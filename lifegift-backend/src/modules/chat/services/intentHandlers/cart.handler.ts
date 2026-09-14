import { PrismaClient } from '@prisma/client';
import { CartService } from '../../../cart/cart.service';
import { ResolvedEntities, ChatResponsePayload } from '../../chat.dto';
import { ChatMessageItem } from '../../redisChat.service';

const prisma = new PrismaClient();

export class CartHandler {
  /**
   * Trích xuất số lượng tồn kho khả dụng từ Record sản phẩm
   */
  private static getStockQuantity(product: any): number {
    if (!product) return 0;

    if (Array.isArray(product.inventories)) {
      return product.inventories.reduce(
        (sum: number, inventory: any) =>
          sum + Number(inventory.available_quantity ?? Math.max(
            Number(inventory.quantity || 0) - Number(inventory.reserved_quantity || 0),
            0
          )),
        0
      );
    }

    const stockVal =
      product.totalAvailableQuantity ??
      product.totalStockQuantity ??
      product.stock_quantity ??
      product.stockQuantity ??
      product.stock ??
      product.quantity ??
      product.inventory ??
      0;

    return Number(stockVal) || 0;
  }

  /**
   * Truy vấn sản phẩm theo ID bằng Prisma với linh hoạt mô hình bảng
   */
  private static async findProductById(productId: number): Promise<any> {
    const prismaAny = prisma as any;
    if (prismaAny.products?.findUnique) {
      const res = await prismaAny.products.findUnique({
        where: { id: BigInt(productId) },
        include: { inventories: true },
      });
      if (res) return res;
    }
    if (prismaAny.product?.findUnique) {
      return await prismaAny.product.findUnique({
        where: { id: BigInt(productId) },
        include: { inventories: true },
      });
    }
    return null;
  }

  /**
   * Giải mã thứ tự chọn sản phẩm từ câu hội thoại gần nhất của Assistant
   */
  private static resolveProductIdFromHistory(message: string, history: ChatMessageItem[]): number | null {
    const indexMatch = message.match(/(?:sản phẩm|sp|món|thứ|số)\s*(\d+)/i);
    if (!indexMatch) return null;

    const targetIndex = parseInt(indexMatch[1], 10) - 1;
    if (targetIndex < 0) return null;

    const lastMsgWithProducts = [...history]
      .reverse()
      .find((msg) => {
        if (msg.role !== 'assistant') return false;
        return Array.isArray(msg.products) && msg.products.length > 0;
      });

    if (lastMsgWithProducts) {
      const productsList = lastMsgWithProducts.products;
      if (productsList?.[targetIndex]) {
        const selectedProd = productsList[targetIndex];
        const prodId = selectedProd.id || selectedProd.productId || selectedProd.product_id;
        return prodId ? Number(prodId) : null;
      }
    }

    return null;
  }

  /**
   * Trích xuất số lượng từ tin nhắn văn bản khi NLU không bắt được entity
   */
  private static extractQuantityFromMessage(message?: string): number | null {
    if (!message) return null;

    // Bắt các mẫu câu: "lên 2", "thành 2", "là 2", "số lượng 2", "thêm 2"
    const match = message.match(/(?:lên\s*là|lên|thành|là|số\s*lượng|thêm)\s*(\d+)/i) ||
                  message.match(/(\d+)\s*(?:cái|sản\s*phẩm|món|hộp|gói|chai|lon|túi|sp)/i);

    if (match && match[1]) {
      const val = parseInt(match[1], 10);
      return isNaN(val) ? null : val;
    }

    return null;
  }

  public static async handle(
    intent: string,
    entities: ResolvedEntities,
    userId?: number,
    message?: string,
    history: ChatMessageItem[] = []
  ): Promise<ChatResponsePayload> {
    if (!userId) {
      return { replyMessage: 'Bạn vui lòng đăng nhập để thực hiện quản lý giỏ hàng nhé!' };
    }

    try {
      switch (intent) {
        case 'them_gio_hang':
        case 'them_vao_gio_hang': {
          let targetProductId = entities.productId ? Number(entities.productId) : null;

          if (!targetProductId && message) {
            targetProductId = CartHandler.resolveProductIdFromHistory(message, history);
          }

          if (!targetProductId) {
            if (entities.categoryId) {
              const categoryIdNum = Number(entities.categoryId);
              const prismaAny = prisma as any;

              const [category, categoryProducts] = await Promise.all([
                prismaAny.categories?.findUnique({ where: { id: categoryIdNum } }) ||
                  prismaAny.category?.findUnique({ where: { id: categoryIdNum } }),
                prismaAny.products?.findMany({
                  where: { category_id: categoryIdNum },
                  take: 5
                }) ||
                  prismaAny.product?.findMany({
                    where: { category_id: categoryIdNum },
                    take: 5
                  })
              ]);

              const categoryName = category?.name || category?.categoryName || 'danh mục này';

              if (categoryProducts && categoryProducts.length > 0) {
                const productListStr = categoryProducts
                  .map(
                    (p: any, index: number) =>
                      `  ${index + 1}. ${p.name || p.productName} - ${Number(p.salePrice || p.price || 0).toLocaleString('vi-VN')}đ`
                  )
                  .join('\n');

                return {
                  replyMessage: `Dưới đây là các sản phẩm thuộc danh mục **${categoryName}**. Bạn muốn chọn sản phẩm nào ạ?\n\n${productListStr}`,
                  data: categoryProducts
                };
              }
            }

            return { replyMessage: 'Bạn muốn thêm sản phẩm nào vào giỏ hàng ạ?' };
          }

          // Lấy số lượng từ entities hoặc bóc tách từ message
          let quantity = entities.quantity && Number(entities.quantity) > 0 ? Number(entities.quantity) : null;
          if (!quantity) {
            quantity = CartHandler.extractQuantityFromMessage(message) || 1;
          }

          const product = await CartHandler.findProductById(targetProductId);
          if (!product) {
            return { replyMessage: 'Sản phẩm này hiện không tồn tại hoặc đã ngừng kinh doanh.' };
          }

          const availableStock = CartHandler.getStockQuantity(product);
          if (quantity > availableStock) {
            return {
              replyMessage: `Sản phẩm "${product.name || product.productName || 'này'}" hiện chỉ còn ${availableStock} sản phẩm trong kho. Bạn không thể đặt ${quantity} sản phẩm!`
            };
          }

          const cartData = await CartService.addItem(userId, {
            productId: targetProductId,
            quantity
          });

          const productName = product.name || product.productName || 'sản phẩm';
          return {
            replyMessage: `Đã thêm ${quantity} x "${productName}" vào giỏ hàng của bạn!`,
            data: cartData
          };
        }

        case 'xem_gio_hang': {
          const cartData = await CartService.getMyCart(userId);

          if (!cartData.items || cartData.items.length === 0) {
            return { replyMessage: 'Giỏ hàng của bạn hiện đang trống.' };
          }

          const itemsList = cartData.items
            .map(
              (item: any, index: number) =>
                `${index + 1}. ${item.productName} - SL: ${item.quantity} x ${Number(item.price).toLocaleString('vi-VN')}đ`
            )
            .join('\n');

          return {
            replyMessage: `🛒 Giỏ hàng của bạn:\n${itemsList}\n\n💰 Tổng tạm tính: ${Number(cartData.subtotal).toLocaleString('vi-VN')}đ`,
            data: cartData
          };
        }

        case 'cap_nhat_gio_hang': {
          let targetProductId = entities.productId ? Number(entities.productId) : null;

          if (!targetProductId && message) {
            targetProductId = CartHandler.resolveProductIdFromHistory(message, history);
          }

          if (!targetProductId) {
            return { replyMessage: 'Bạn muốn cập nhật số lượng cho sản phẩm nào ạ?' };
          }

          const cart = await CartService.getMyCart(userId);
          const targetItem = cart.items.find((item: any) => Number(item.productId) === targetProductId);

          if (!targetItem) {
            return { replyMessage: 'Sản phẩm này chưa có trong giỏ hàng của bạn.' };
          }

          // Ưu tiên đọc từ entities, nếu không có thì đọc từ tin nhắn văn bản
          let targetQuantity: number | null = entities.quantity && Number(entities.quantity) >= 0 ? Number(entities.quantity) : null;

          if (targetQuantity === null) {
            targetQuantity = CartHandler.extractQuantityFromMessage(message);
          }

          if (targetQuantity === null) {
            return { replyMessage: `Bạn muốn cập nhật số lượng cho "${targetItem.productName}" thành bao nhiêu ạ?` };
          }

          const newQuantity = targetQuantity;

          if (newQuantity === 0) {
            const updatedCart = await CartService.removeItem(userId, Number(targetItem.id));
            return {
              replyMessage: `Đã xóa sản phẩm "${targetItem.productName}" khỏi giỏ hàng.`,
              data: updatedCart
            };
          }

          const product = await CartHandler.findProductById(targetProductId);
          if (product) {
            const availableStock = CartHandler.getStockQuantity(product);
            if (newQuantity > availableStock) {
              return {
                replyMessage: `Sản phẩm "${targetItem.productName}" trong kho chỉ còn ${availableStock} sản phẩm. Không thể cập nhật thành ${newQuantity}!`
              };
            }
          }

          const updatedCart = await CartService.updateItem(userId, Number(targetItem.id), {
            quantity: newQuantity
          });

          return {
            replyMessage: `Đã cập nhật số lượng sản phẩm "${targetItem.productName}" thành ${newQuantity}.`,
            data: updatedCart
          };
        }

        case 'xoa_tat_ca_gio_hang': {
          const cart = await CartService.getMyCart(userId);

          if (!cart.items || cart.items.length === 0) {
            return { replyMessage: 'Giỏ hàng của bạn hiện đang trống.' };
          }

          const updatedCart = await CartService.clearCart(userId);

          return {
            replyMessage: 'Đã xóa tất cả sản phẩm khỏi giỏ hàng của bạn.',
            data: updatedCart
          };
        }

        case 'xoa_khoi_gio_hang': {
          let targetProductId = entities.productId ? Number(entities.productId) : null;

          if (!targetProductId && message) {
            targetProductId = CartHandler.resolveProductIdFromHistory(message, history);
          }

          if (!targetProductId) {
            return { replyMessage: 'Bạn muốn xóa sản phẩm nào khỏi giỏ hàng ạ?' };
          }

          const cart = await CartService.getMyCart(userId);
          const targetItem = cart.items.find((item: any) => Number(item.productId) === targetProductId);

          if (!targetItem) {
            return { replyMessage: 'Sản phẩm này hiện không có trong giỏ hàng của bạn.' };
          }

          const updatedCart = await CartService.removeItem(userId, Number(targetItem.id));

          return {
            replyMessage: `Đã xóa sản phẩm "${targetItem.productName}" khỏi giỏ hàng của bạn.`,
            data: updatedCart
          };
        }

        default:
          return { replyMessage: 'Thao tác giỏ hàng không hợp lệ.' };
      }
    } catch (error: any) {
      return {
        replyMessage: `Không thể thực hiện: ${error.message}`
      };
    }
  }
}