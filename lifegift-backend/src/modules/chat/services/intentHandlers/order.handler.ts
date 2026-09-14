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
    userId?: number,
    message?: string
  ): Promise<ChatResponsePayload> {
    if (!userId) {
      return { replyMessage: 'Bạn vui lòng đăng nhập để có thể tra cứu hoặc quản lý đơn hàng nhé!' };
    }

    const rawOrderId = entities.orderId || (entities.extractedPrice ? String(entities.extractedPrice) : null);

    const paymentMethod = entities.paymentMethod as PaymentMethod | undefined;
    const receiverPhone = entities.receiverPhone || entities.phone || message?.match(/\b(0\d{9,10})\b/)?.[1];
    const receiverName = entities.receiverName || message?.match(/(?:tên người nhận|tên)\s*(?:là|:)?\s*([\p{L} ]{2,80})/iu)?.[1]?.trim();
    const address = entities.address;

    const getMissingCheckoutInfo = (hasProduct: boolean): string[] => {
      const missing: string[] = [];
      if (!hasProduct) missing.push('sản phẩm và số lượng');
      if (!receiverName) missing.push('tên người nhận');
      if (!receiverPhone) missing.push('số điện thoại người nhận');
      if (!address) missing.push('địa chỉ giao hàng');
      if (!paymentMethod) missing.push('phương thức thanh toán');
      return missing;
    };

    try {
      switch (intent) {
        // gộp tất cả intent liên quan đến đặt hàng / thanh toán / checkout
        case 'bat_dau_dat_hang':
        case 'thanh_toan_don_hang':
        case 'dat_hang': {
          const cart = await CartService.getMyCart(userId);
          const quantity = entities.quantity && entities.quantity > 0 ? entities.quantity : 1;
          let directProduct: any = null;

          // TRƯỜNG HỢP 1: Khách hàng chỉ định sản phẩm cụ thể (VD: "tôi muốn đặt 1 cafe cầu đất")
          if (entities.productId) {
            const productId = Number(entities.productId);
            const prismaAny = prisma as any;

            // Kiểm tra sản phẩm có tồn tại không
            const product = await (prismaAny.products?.findUnique({ where: { id: BigInt(productId) } }) ||
              prismaAny.product?.findUnique({ where: { id: BigInt(productId) } }));

            if (!product || product.status !== 'ACTIVE') {
              return { replyMessage: 'Sản phẩm này hiện không tồn tại hoặc đã ngừng kinh doanh.' };
            }

            // Đặt trực tiếp, không bắt buộc sản phẩm phải nằm trong giỏ hàng.
            directProduct = { product, quantity };
          }

          if (!directProduct && (!cart.items || cart.items.length === 0)) {
            return { replyMessage: 'Giỏ hàng của bạn đang trống, vui lòng chọn sản phẩm trước khi đặt hàng.' };
          }

          const itemsSummary = directProduct
            ? `  1. ${directProduct.product.name} (SL: ${directProduct.quantity})`
            : cart.items
                .map((item: any, idx: number) => `  ${idx + 1}. ${item.productName} (SL: ${item.quantity})`)
                .join('\n');
          const subtotal = directProduct
            ? (directProduct.product.sale_price || directProduct.product.price || 0) * directProduct.quantity
            : cart.subtotal;

          const missing = getMissingCheckoutInfo(Boolean(directProduct || cart.items?.length));
          const nextMessage = missing.length
            ? `Để tiếp tục, vui lòng cung cấp: ${missing.join(', ')}.`
            : 'Thông tin đã đủ. Bạn hãy kiểm tra lại và gõ "Xác nhận đặt hàng" để hoàn tất.';
          return {
            replyMessage: `🛒 **Đơn hàng của bạn gồm:**\n${itemsSummary}\n\n💰 **Tạm tính:** ${Number(subtotal).toLocaleString('vi-VN')}đ.\n\n${nextMessage}`,
            data: directProduct ? [directProduct.product] : cart,
            nextStep: missing.length ? 'COLLECT_INFO' : 'CONFIRMATION'
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
          if (!address) {
            return { replyMessage: 'Bạn vui lòng cung cấp địa chỉ giao hàng cụ thể nhé.' };
          }
          return {
            replyMessage: `Đã ghi nhận địa chỉ giao hàng: ${address}. Bạn vui lòng cho biết tên và số điện thoại người nhận, cùng phương thức thanh toán (COD, chuyển khoản, MoMo hoặc VNPay).`
          };
        }

        case 'chon_phuong_thuc_thanh_toan': {
          if (!paymentMethod) {
            return { replyMessage: 'Bạn vui lòng chọn phương thức thanh toán: COD, chuyển khoản, MoMo hoặc VNPay.' };
          }
          return {
            replyMessage: `Đã ghi nhận thanh toán bằng ${paymentMethod}. Bạn hãy kiểm tra thông tin và gõ "Xác nhận đặt hàng" để hoàn tất.`
          };
        }

        case 'huy_checkout': {
          return {
            replyMessage: 'Đã hủy quá trình đặt hàng. Các sản phẩm vẫn được giữ trong giỏ hàng của bạn.'
          };
        }

        case 'xac_nhan_dat_hang': {
          const directItems = entities.productId
            ? [{
                productId: Number(entities.productId),
                quantity: entities.quantity && entities.quantity > 0 ? Number(entities.quantity) : 1,
              }]
            : undefined;
          const cart = directItems ? null : await CartService.getMyCart(userId);
          const missing = getMissingCheckoutInfo(Boolean(directItems || cart?.items?.length));
          if (missing.length > 0) {
            return {
              replyMessage: `Chưa thể đặt hàng vì còn thiếu ${missing.join(', ')}. Bạn vui lòng cung cấp đủ thông tin rồi xác nhận lại nhé.`
            };
          }

          if (!directItems && (!cart?.items || cart.items.length === 0)) {
            return { replyMessage: 'Bạn chưa chọn sản phẩm để tạo đơn hàng.' };
          }

          const createdOrder = await OrderService.create(userId, {
            warehouseId: 1,
            items: directItems,
            cartItemIds: cart?.items.map((item: any) => Number(item.id)),
            receiverName: receiverName!,
            receiverPhone: receiverPhone!,
            shippingProvince: 'Chưa cung cấp',
            shippingDistrict: 'Chưa cung cấp',
            shippingWard: 'Chưa cung cấp',
            shippingAddress: address!,
            shippingFee: 0,
            discountAmount: 0,
            couponCode: entities.couponCode || undefined,
            payment: {
              paymentMethod: paymentMethod!,
            }
          });

          return {
            replyMessage: `🎉 Bạn đã đặt hàng thành công! Mã đơn hàng của bạn là #${createdOrder.id} (${createdOrder.orderCode}).`,
            data: createdOrder,
            nextStep: 'COMPLETED'
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