// src/services/chat/intentHandlers/order.handler.ts
import { PrismaClient } from '@prisma/client';
import { ResolvedEntities, ChatResponsePayload } from '../../chat.dto';

const prisma = new PrismaClient();

export class OrderHandler {
  public static async handle(
    intent: string, 
    entities: ResolvedEntities, 
    userId?: number
  ): Promise<ChatResponsePayload> {
    
    // Nếu người dùng chưa đăng nhập / chưa truyền userId
    if (!userId) {
      return {
        replyMessage: 'Bạn vui lòng đăng nhập để có thể tra cứu hoặc quản lý đơn hàng nhé!'
      };
    }

    // Lấy orderId từ entities.orderId, nếu null thì fallback lấy từ extractedPrice
    const rawOrderId = entities.orderId || (entities.extractedPrice ? String(entities.extractedPrice) : null);

    switch (intent) {
      case 'tra_cuu_don_hang':
        if (rawOrderId) {
          const orderIdNumber = Number(rawOrderId);

          if (!isNaN(orderIdNumber)) {
            const order = await prisma.orders.findUnique({
              where: { id: orderIdNumber },
              include: { order_items: true }
            });

            if (order) {
              // XÁC THỰC QUYỀN SỞ HỮU: Kiểm tra đơn hàng có thuộc về userId này không
              if (order.user_id !== BigInt(userId)) {
                return {
                  replyMessage: `Đơn hàng #${orderIdNumber} không thuộc tài khoản của bạn. Bạn vui lòng kiểm tra lại mã đơn hàng nhé!`
                };
              }

              const formattedTotal = Number(order.total_amount).toLocaleString('vi-VN');
              return {
                replyMessage: `Đơn hàng #${order.id} của bạn hiện có trạng thái: ${order.order_status}. Tổng tiền: ${formattedTotal}đ.`,
                data: order
              };
            } else {
              return {
                replyMessage: `Shop không tìm thấy đơn hàng #${orderIdNumber} trên hệ thống.`
              };
            }
          }
        }
        return { 
          replyMessage: 'Bạn vui lòng cung cấp Mã đơn hàng (ví dụ: #12345) để shop kiểm tra trạng thái nhé!' 
        };

      case 'huy_don_hang':
        if (rawOrderId) {
          const orderIdNumber = Number(rawOrderId);

          if (!isNaN(orderIdNumber)) {
            const order = await prisma.orders.findUnique({
              where: { id: orderIdNumber }
            });

            if (order) {
              // XÁC THỰC QUYỀN SỞ HỮU khi hủy đơn
              if (order.user_id !== BigInt(userId)) {
                return {
                  replyMessage: `Bạn không thể hủy đơn hàng #${orderIdNumber} do đơn hàng này không thuộc tài khoản của bạn.`
                };
              }

              return { 
                replyMessage: `Yêu cầu hủy đơn #${orderIdNumber} đã được ghi nhận. Bộ phận CSKH sẽ hỗ trợ bạn ngay trong ít phút.` 
              };
            }
          }
        }
        return { 
          replyMessage: 'Bạn vui lòng cung cấp Mã đơn hàng bạn muốn hủy giúp shop nhé.' 
        };

      default:
        return { 
          replyMessage: 'Shop có thể hỗ trợ gì thêm về đơn hàng của bạn ạ?' 
        };
    }
  }
}