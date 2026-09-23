import { OrderService } from '../../../order/order.service';
import { CartService } from '../../../cart/cart.service';
import { ResolvedEntities, ChatResponsePayload } from '../../chat.dto';
import { OrderStatus } from '../../../order/order.dto';
import { PaymentMethod } from '../../../payment/payment.dto';
import { PrismaClient } from '@prisma/client';
import { ChatMessageItem } from '../../redisChat.service';

const prisma = new PrismaClient();

export class OrderHandler {
  private static toBigIntIds(primaryId: bigint | number | null | undefined, ids?: Array<bigint | number>): bigint[] {
    const values = [...(ids || []), ...(primaryId !== null && primaryId !== undefined ? [primaryId] : [])];
    return [...new Set(values.map((id) => BigInt(id)))];
  }

  private static getOriginKeywords(origin: string): string[] {
    const normalizedOrigin = origin.toLowerCase();
    if (normalizedOrigin === 'tây nguyên') return ['tây nguyên', 'đắk lắk', 'buôn ma thuột', 'đắk nông', 'gia lai', 'kon tum', 'lâm đồng', 'đà lạt', 'cầu đất'];
    if (normalizedOrigin === 'tây bắc') return ['tây bắc', 'sơn la', 'điện biên', 'lai châu', 'lào cai', 'yên bái', 'hòa bình'];
    return [origin];
  }

  private static buildProductFilter(entities: ResolvedEntities): Record<string, any> {
    const categoryIds = this.toBigIntIds(entities.categoryId, entities.categoryIds);
    const brandIds = this.toBigIntIds(entities.brandId, entities.brandIds);
    const where: Record<string, any> = {
      status: 'ACTIVE',
      ...(categoryIds.length > 0 && { category_id: { in: categoryIds } }),
      ...(brandIds.length > 0 && { brand_id: { in: brandIds } }),
    };
    if (entities.origin) {
      where.OR = this.getOriginKeywords(entities.origin).map((keyword) => ({ origin: { contains: keyword } }));
    }
    const priceQuery = {
      ...(entities.minPrice !== null && entities.minPrice !== undefined && { gte: entities.minPrice }),
      ...(entities.maxPrice !== null && entities.maxPrice !== undefined && { lte: entities.maxPrice }),
    };
    if (Object.keys(priceQuery).length > 0) where.price = priceQuery;
    else if (entities.extractedPrice) where.price = { gte: entities.extractedPrice * 0.8, lte: entities.extractedPrice * 1.2 };
    return where;
  }

  private static hasProductFilters(entities: ResolvedEntities): boolean {
    return Boolean(entities.categoryId || entities.categoryIds?.length || entities.brandId || entities.brandIds?.length || entities.origin || entities.minPrice !== null && entities.minPrice !== undefined || entities.maxPrice !== null && entities.maxPrice !== undefined || entities.extractedPrice);
  }

  private static describeProductFilters(entities: ResolvedEntities): string {
    const names: Record<string, string> = { '4': 'cà phê', '5': 'trà', '6': 'hạt dinh dưỡng', '7': 'đặc sản Tây Bắc' };
    const categories = this.toBigIntIds(entities.categoryId, entities.categoryIds)
      .map((id) => names[id.toString()] || 'nhóm sản phẩm')
      .filter((name, index, values) => values.indexOf(name) === index);
    const filters = [...categories];
    if (entities.origin) filters.push(`có xuất xứ từ ${entities.origin}`);
    if (entities.minPrice !== null && entities.minPrice !== undefined) filters.push(`từ ${Number(entities.minPrice).toLocaleString('vi-VN')}đ`);
    if (entities.maxPrice !== null && entities.maxPrice !== undefined) filters.push(`không quá ${Number(entities.maxPrice).toLocaleString('vi-VN')}đ`);
    return filters.join(', ');
  }

  private static resolveProductIdFromHistory(message: string, history: ChatMessageItem[] = []): number | null {
    const match = message.match(/(?:sản phẩm|sp|món|thứ|số)\s*(\d+)/i);
    if (!match) return null;
    const index = Number(match[1]) - 1;
    const previous = [...history].reverse().find((item) => item.role === 'assistant' && Array.isArray(item.products) && item.products.length > 0);
    const product = previous?.products?.[index];
    return product ? Number(product.id || product.productId || product.product_id) : null;
  }

  public static async handle(
    intent: string,
    entities: ResolvedEntities,
    userId?: number,
    message?: string,
    history: ChatMessageItem[] = []
  ): Promise<ChatResponsePayload> {
    if (!userId) {
      return { replyMessage: 'Bạn vui lòng đăng nhập để có thể tra cứu hoặc quản lý đơn hàng nhé!' };
    }

    const rawOrderId = entities.orderId || null;

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

          if (!entities.productId && message) {
            const selectedProductId = OrderHandler.resolveProductIdFromHistory(message, history);
            if (selectedProductId) entities.productId = selectedProductId;
          }

          if (!entities.productId && OrderHandler.hasProductFilters(entities)) {
            const candidates = await prisma.products.findMany({
              where: OrderHandler.buildProductFilter(entities),
              take: 5,
            });
            if (candidates.length === 0) {
              return { replyMessage: `Hiện chưa tìm thấy sản phẩm ${OrderHandler.describeProductFilters(entities) || 'phù hợp'} để đặt hàng.` };
            }
            const list = candidates.map((product, index) => `${index + 1}. ${product.name} - ${Number(product.sale_price || product.price).toLocaleString('vi-VN')}đ`).join('\n');
            return {
              replyMessage: `Tôi tìm thấy các sản phẩm ${OrderHandler.describeProductFilters(entities) || 'phù hợp'}. Bạn muốn đặt sản phẩm số mấy?\n\n${list}`,
              data: candidates,
              nextStep: 'SELECT_PRODUCT',
            };
          }

          // TRƯỜNG HỢP 1: Khách hàng chỉ định sản phẩm cụ thể (VD: "tôi muốn đặt 1 cafe cầu đất")
          if (entities.productId) {
            const productId = Number(entities.productId);
            const prismaAny = prisma as any;

            // Kiểm tra sản phẩm có tồn tại không
            const product = await (prismaAny.products?.findFirst({ where: { id: BigInt(productId), ...OrderHandler.buildProductFilter(entities) } }) ||
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
          if (!order) {
            return { replyMessage: `Không tìm thấy đơn hàng #${orderIdNumber}.` };
          }
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