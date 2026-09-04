import prisma from '../../config/database';
import { AddCartItemRequestDto, CartItemResponse, CartResponse, UpdateCartItemRequestDto } from './cart.dto';

const getVietNamDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

export class CartService {
  private static async getAvailableQuantity(productId: bigint): Promise<number> {
    const aggregate = await prisma.inventories.aggregate({
      _sum: {
        available_quantity: true,
      },
      where: {
        product_id: productId,
      },
    });
    return aggregate._sum.available_quantity ?? 0;
  }

  private static toItemResponse(item: any): CartItemResponse {
    const product = item.products;
    const salePrice = product?.sale_price ? Number(product.sale_price) : 0;
    const regularPrice = product?.price ? Number(product.price) : 0;

    const price = salePrice > 0 ? salePrice : regularPrice;
    const subtotal = price * item.quantity;

    return {
      id: item.id.toString(),
      productId: product?.id?.toString() || '',
      productName: product?.name || '',
      sku: product?.sku || '',
      price,
      quantity: item.quantity,
      subtotal,
    };
  }

  private static toCartResponse(cart: any): CartResponse {
    const items = (cart.cart_items || []).map((item: any) => this.toItemResponse(item));
    const totalQuantity = items.reduce((sum: number, item: CartItemResponse) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum: number, item: CartItemResponse) => sum + item.subtotal, 0);

    return {
      id: cart.id.toString(),
      userId: cart.user_id.toString(),
      items,
      totalQuantity,
      subtotal,
    };
  }

  private static async findOrCreateCart(userId: number): Promise<any> {
    const uId = BigInt(userId);
    let cart = await prisma.carts.findFirst({
      where: { user_id: uId },
      include: {
        cart_items: {
          include: { products: true },
        },
      },
    });

    if (!cart) {
      const now = getVietNamDateTime();
      cart = await prisma.carts.create({
        data: {
          user_id: uId,
          created_at: now,
          updated_at: now,
        },
        include: {
          cart_items: {
            include: { products: true },
          },
        },
      });
    }

    return cart;
  }

  public static async getMyCart(userId: number): Promise<CartResponse> {
    const cart = await this.findOrCreateCart(userId);
    return this.toCartResponse(cart);
  }

  public static async addItem(userId: number, request: AddCartItemRequestDto): Promise<CartResponse> {
    if (!request.quantity || request.quantity <= 0) {
      throw new Error('Số lượng phải lớn hơn 0');
    }

    const productId = BigInt(request.productId);
    const product = await prisma.products.findUnique({ where: { id: productId } });

    if (!product) {
      throw new Error(`Product không tồn tại: ${request.productId}`);
    }

    if (product.status !== 'ACTIVE') {
      throw new Error(`Sản phẩm không còn hoạt động: ${product.name}`);
    }

    const availableQuantity = await this.getAvailableQuantity(productId);
    const cart = await this.findOrCreateCart(userId);

    const existingItem = await prisma.cart_items.findFirst({
      where: {
        cart_id: cart.id,
        product_id: productId,
      },
    });

    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const newQuantity = currentQuantity + request.quantity;

    if (newQuantity > availableQuantity) {
      throw new Error(
        `Số lượng sản phẩm vượt quá tồn kho. Tồn kho khả dụng: ${availableQuantity}, số lượng trong giỏ sau khi thêm: ${newQuantity}`
      );
    }

    const now = getVietNamDateTime();

    if (existingItem) {
      await prisma.cart_items.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          updated_at: now,
        },
      });
    } else {
      await prisma.cart_items.create({
        data: {
          cart_id: cart.id,
          product_id: productId,
          quantity: request.quantity,
          created_at: now,
          updated_at: now,
        },
      });
    }

    const updatedCart = await this.findOrCreateCart(userId);
    return this.toCartResponse(updatedCart);
  }

  public static async updateItem(userId: number, cartItemId: number, request: UpdateCartItemRequestDto): Promise<CartResponse> {
    const cart = await prisma.carts.findFirst({ where: { user_id: BigInt(userId) } });
    if (!cart) throw new Error('Giỏ hàng không tồn tại');

    const item = await prisma.cart_items.findUnique({
      where: { id: BigInt(cartItemId) },
      include: { products: true },
    });

    if (!item) throw new Error('CartItem không tồn tại');

    if (item.cart_id !== cart.id) {
      throw new Error('Bạn không có quyền chỉnh sửa CartItem này');
    }

    if (!request.quantity || request.quantity <= 0) {
      throw new Error('Số lượng phải lớn hơn 0');
    }

    const availableQuantity = await this.getAvailableQuantity(item.product_id);

    if (request.quantity > availableQuantity) {
      throw new Error(
        `Số lượng sản phẩm vượt quá tồn kho. Tồn kho khả dụng: ${availableQuantity}, số lượng yêu cầu: ${request.quantity}`
      );
    }

    const now = getVietNamDateTime();
    await prisma.cart_items.update({
      where: { id: item.id },
      data: {
        quantity: request.quantity,
        updated_at: now,
      },
    });

    const updatedCart = await this.findOrCreateCart(userId);
    return this.toCartResponse(updatedCart);
  }

  public static async removeItem(userId: number, cartItemId: number): Promise<CartResponse> {
    const cart = await prisma.carts.findFirst({ where: { user_id: BigInt(userId) } });
    if (!cart) throw new Error('Giỏ hàng không tồn tại');

    const item = await prisma.cart_items.findUnique({ where: { id: BigInt(cartItemId) } });
    if (!item) throw new Error('CartItem không tồn tại');

    if (item.cart_id !== cart.id) {
      throw new Error('Sản phẩm không tồn tại trong giỏ hàng của bạn');
    }

    await prisma.cart_items.delete({ where: { id: item.id } });

    const updatedCart = await this.findOrCreateCart(userId);
    return this.toCartResponse(updatedCart);
  }

  public static async clearCart(userId: number): Promise<void> {
    const cart = await prisma.carts.findFirst({ where: { user_id: BigInt(userId) } });
    if (!cart) throw new Error('Giỏ hàng không tồn tại');

    await prisma.cart_items.deleteMany({
      where: { cart_id: cart.id },
    });
  }
}