import { OrderService } from '../../../order/order.service';
import { CartService } from '../../../cart/cart.service';
import { ResolvedEntities, ChatResponsePayload } from '../../chat.dto';
import { OrderStatus } from '../../../order/order.dto';
import { PaymentMethod } from '../../../payment/payment.dto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OrderHandler {
  public static async handle(
    intent: string,
    entities: ResolvedEntities,
    userId?: number
  ): Promise<ChatResponsePayload> {
    if (!userId) {
      return { replyMessage: 'Bạn vui lòng đăng nhập để có thể tra cứu hoặc quản lý đơn hàng nhé!' };
    }

    const rawOrderId = entities.orderId || (entities.extractedPrice ? String(entities.extractedPrice) : null);

    try {
      switch (intent) {
        // gộp tất cả intent liên quan đến đặt hàng / thanh toán / checkout
        case 'bat_dau_dat_hang':
        case 'thanh_toan_don_hang':
        case 'dat_hang': {
          let cart = await CartService.getMyCart(userId);
          const quantity = entities.quantity && entities.quantity > 0 ? entities.quantity : 1;

          // TRƯỜNG HỢP 1: Khách hàng chỉ định sản phẩm cụ thể (VD: "tôi muốn đặt 1 cafe cầu đất")
          if (entities.productId) {
            const productId = Number(entities.productId);
            const prismaAny = prisma as any;

            // Kiểm tra sản phẩm có tồn tại không
            const product = await (prismaAny.products?.findUnique({ where: { id: productId } }) ||
              prismaAny.product?.findUnique({ where: { id: productId } }));

            if (!product) {
              return { replyMessage: 'Sản phẩm này hiện không tồn tại hoặc đã ngừng kinh doanh.' };
            }

            // Tự động thêm sản phẩm này vào giỏ hàng trước khi đặt hàng
            await CartService.addItem(userId, {
              productId,
              quantity
            });

            // Lấy lại dữ liệu giỏ hàng mới nhất
            cart = await CartService.getMyCart(userId);
          }

          // TRƯỜNG HỢP 2: Giỏ hàng trống
          if (!cart.items || cart.items.length === 0) {
            return { replyMessage: 'Giỏ hàng của bạn đang trống, vui lòng chọn sản phẩm trước khi đặt hàng.' };
          }

          // Hiển thị thông tin đơn hàng và yêu cầu xác nhận
          const itemsSummary = cart.items
            .map((item: any, idx: number) => `  ${idx + 1}. ${item.productName} (SL: ${item.quantity})`)
            .join('\n');

          return {
            replyMessage: `🛒 **Đơn hàng của bạn bao gồm:**\n${itemsSummary}\n\n💰 **Tổng giá trị:** ${Number(cart.subtotal).toLocaleString('vi-VN')}đ.\n\nBạn có muốn xác nhận tạo đơn hàng ngay không? Vui lòng gõ **"Xác nhận đặt hàng"** để hoàn tất.`,
            data: cart
          };
        }

        case 'tra_cuu_don_hang': {
          if (rawOrderId) {
            const orderIdNumber = Number(rawOrderId);
            if (!isNaN(orderIdNumber)) {
              const order = await OrderService.getById(orderIdNumber);

              if (order) {
                if (Number(order.userId) !== userId) {
                  return { replyMessage: `Đơn hàng #${orderIdNumber} không thuộc tài khoản của bạn.` };
                }

                const formattedTotal = Number(order.totalAmount).toLocaleString('vi-VN');
                const orderStatus = order.orderStatus || 'Đang xử lý';

                return {
                  replyMessage: `Đơn hàng #${order.id} của bạn hiện có trạng thái: ${orderStatus}. Tổng tiền: ${formattedTotal}đ.`,
                  data: order
                };
              }
            }
          }

          const myOrders = await OrderService.getMyOrders(userId);
          if (myOrders.length === 0) {
            return { replyMessage: 'Bạn chưa có đơn hàng nào trên hệ thống.' };
          }

          const latestOrder = myOrders[0];
          return {
            replyMessage: `Đơn hàng gần nhất #${latestOrder.id} (${latestOrder.orderCode}) đang ở trạng thái: ${latestOrder.orderStatus}. Tổng tiền: ${Number(latestOrder.totalAmount).toLocaleString('vi-VN')}đ.`,
            data: myOrders
          };
        }

        case 'huy_don_hang': {
          if (!rawOrderId) {
            return { replyMessage: 'Bạn vui lòng cung cấp Mã đơn hàng bạn muốn hủy giúp shop nhé.' };
          }

          const orderIdNumber = Number(rawOrderId);
          if (isNaN(orderIdNumber)) {
            return { replyMessage: 'Mã đơn hàng không hợp lệ.' };
          }

          const order = await OrderService.getById(orderIdNumber);
          if (Number(order.userId) !== userId) {
            return { replyMessage: `Bạn không thể hủy đơn hàng #${orderIdNumber} do đơn này không thuộc tài khoản của bạn.` };
          }

          const updatedOrder = await OrderService.updateStatus(
            userId,
            orderIdNumber,
            OrderStatus.CANCELLED,
            'Khách hàng yêu cầu hủy qua Chatbot'
          );

          return {
            replyMessage: `Yêu cầu hủy đơn hàng #${orderIdNumber} đã được ghi nhận thành công.`,
            data: updatedOrder
          };
        }

        case 'nhap_dia_chi_giao_hang': {
          return {
            replyMessage: 'Đã ghi nhận yêu cầu cập nhật địa chỉ giao hàng. Bạn hãy tiếp tục chọn phương thức thanh toán hoặc gõ "Xác nhận đặt hàng" để hoàn tất nhé!'
          };
        }

        case 'chon_phuong_thuc_thanh_toan': {
          return {
            replyMessage: 'Đã ghi nhận phương thức thanh toán của bạn. Hãy gõ "Xác nhận đặt hàng" để tiến hành tạo đơn hàng.'
          };
        }

        case 'huy_checkout': {
          return {
            replyMessage: 'Đã hủy quá trình đặt hàng. Các sản phẩm vẫn được giữ trong giỏ hàng của bạn.'
          };
        }

        case 'xac_nhan_dat_hang': {
          const cart = await CartService.getMyCart(userId);

          if (!cart.items || cart.items.length === 0) {
            return { replyMessage: 'Không có sản phẩm nào trong giỏ hàng để tạo đơn.' };
          }

          const cartItemIds = cart.items.map((item: any) => Number(item.id));

          const createdOrder = await OrderService.create(userId, {
            warehouseId: 1,
            cartItemIds,
            receiverName: 'Khách hàng',
            receiverPhone: '0000000000',
            shippingProvince: 'Chưa cung cấp',
            shippingDistrict: 'Chưa cung cấp',
            shippingWard: 'Chưa cung cấp',
            shippingAddress: entities.address || 'Chưa cung cấp',
            shippingFee: 0,
            discountAmount: 0,
            couponCode: entities.couponCode || undefined,
            payment: {
              paymentMethod: PaymentMethod.COD,
            }
          });

          return {
            replyMessage: `🎉 Bạn đã đặt hàng thành công! Mã đơn hàng của bạn là #${createdOrder.id} (${createdOrder.orderCode}).`,
            data: createdOrder
          };
        }

        default:
          return { replyMessage: 'Shop có thể hỗ trợ gì thêm về đơn hàng của bạn ạ?' };
      }
    } catch (error: any) {
      return {
        replyMessage: `Không thể thực hiện yêu cầu: ${error.message}`
      };
    }
  }
}