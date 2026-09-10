import { PrismaClient } from '@prisma/client';
import { CartService } from '../../../cart/cart.service';
import { ResolvedEntities, ChatResponsePayload } from '../../chat.dto';

const prisma = new PrismaClient();

export class CartHandler {
  public static async handle(
    intent: string,
    entities: ResolvedEntities,
    userId?: number,
    message?: string
  ): Promise<ChatResponsePayload> {
    if (!userId) {
      return { replyMessage: 'Bạn vui lòng đăng nhập để thực hiện quản lý giỏ hàng nhé!' };
    }

    try {
      switch (intent) {
        case 'them_gio_hang': {
          // XỬ LÝ TRƯỜNG HỢP THIẾU PRODUCT_ID
          if (!entities.productId) {
            // Nếu có categoryId -> Lấy gợi ý các sản phẩm thuộc danh mục này
            if (entities.categoryId) {
              const categoryIdNum = Number(entities.categoryId);
              const prismaAny = prisma as any;

              // 1. Lấy thông tin danh mục & các sản phẩm tương ứng
              const [category, categoryProducts] = await Promise.all([
                prismaAny.categories?.findUnique({ where: { id: categoryIdNum } }) ||
                  prismaAny.category?.findUnique({ where: { id: categoryIdNum } }),
                prismaAny.products?.findMany({
                  where: { category_id: categoryIdNum }, // Sử dụng category_id đúng với Prisma Schema
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
                      `  ${index + 1}. ${p.name || p.productName} - ${Number(p.price || 0).toLocaleString('vi-VN')}đ`
                  )
                  .join('\n');

                return {
                  replyMessage: `Dưới đây là các sản phẩm thuộc danh mục **${categoryName}**. Bạn muốn chọn sản phẩm nào ạ?\n\n${productListStr}`,
                  data: {
                    categoryId: categoryIdNum,
                    products: categoryProducts
                  }
                };
              }
            }

            // Trường hợp không có cả categoryId hoặc không tìm thấy sản phẩm
            return { replyMessage: 'Bạn muốn thêm sản phẩm nào vào giỏ hàng ạ?' };
          }

          const productId = Number(entities.productId);
          let quantity = entities.quantity && entities.quantity > 0 ? entities.quantity : 1;

          // 1. Kiểm tra tồn kho của sản phẩm trong DB
          const prismaAny = prisma as any;
          const product = await (prismaAny.products?.findUnique({ where: { id: productId } }) ||
            prismaAny.product?.findUnique({ where: { id: productId } }));

          if (!product) {
            return { replyMessage: 'Sản phẩm này hiện không tồn tại hoặc đã ngừng kinh doanh.' };
          }

          const availableStock = product.stock ?? product.quantity ?? product.inventory ?? 0;

          // Bắt lỗi nếu người dùng yêu cầu số lượng vượt quá tồn kho
          if (quantity > availableStock) {
            return {
              replyMessage: `Sản phẩm "${product.name || product.productName || 'này'}" hiện chỉ còn ${availableStock} sản phẩm trong kho. Bạn không thể đặt ${quantity} sản phẩm!`
            };
          }

          // 2. Thêm vào giỏ hàng nếu kho đáp ứng đủ
          const cartData = await CartService.addItem(userId, {
            productId,
            quantity
          });

          const addedItem = cartData.items.find((item: any) => item.productId === String(productId));
          const productName = addedItem ? addedItem.productName : (product.name || 'sản phẩm');

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
          if (!entities.productId) {
            return { replyMessage: 'Bạn muốn cập nhật số lượng cho sản phẩm nào ạ?' };
          }

          const cart = await CartService.getMyCart(userId);
          const productId = String(entities.productId);
          const targetItem = cart.items.find((item: any) => item.productId === productId);

          if (!targetItem) {
            return { replyMessage: 'Sản phẩm này chưa có trong giỏ hàng của bạn.' };
          }

          const newQuantity = entities.quantity && entities.quantity > 0 ? entities.quantity : 1;

          if (newQuantity <= 0) {
            const updatedCart = await CartService.removeItem(userId, Number(targetItem.id));
            return {
              replyMessage: 'Đã xóa sản phẩm khỏi giỏ hàng.',
              data: updatedCart
            };
          }

          // Kiểm tra tồn kho trước khi cập nhật số lượng mới
          const prismaAny = prisma as any;
          const product = await (prismaAny.products?.findUnique({ where: { id: Number(productId) } }) ||
            prismaAny.product?.findUnique({ where: { id: Number(productId) } }));

          if (product) {
            const availableStock = product.stock ?? product.quantity ?? product.inventory ?? 0;
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

        case 'xoa_khoi_gio_hang': {
          if (!entities.productId) {
            return { replyMessage: 'Bạn muốn xóa sản phẩm nào khỏi giỏ hàng ạ?' };
          }

          const cart = await CartService.getMyCart(userId);
          const productId = String(entities.productId);
          const targetItem = cart.items.find((item: any) => item.productId === productId);

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