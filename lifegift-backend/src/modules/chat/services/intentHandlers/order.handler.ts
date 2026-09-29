import { OrderService } from '../../../order/order.service';
import { CartService } from '../../../cart/cart.service';
import { ResolvedEntities, ChatResponsePayload } from '../../chat.dto';
import { OrderStatus } from '../../../order/order.dto';
import { PaymentMethod } from '../../../payment/payment.dto';
import { PrismaClient } from '@prisma/client';
import { ChatMessageItem } from '../../redisChat.service';

const prisma = new PrismaClient();

export class OrderHandler {
  private static resolveCartPositions(message?: string): number[] {
    if (!message || !/(?:trong|ở|o)\s+(?:giỏ hàng|gio hang)|(?:giỏ hàng|gio hang)\s+(?:của tôi|cua toi)/i.test(message)) {
      return [];
    }

    const matches = [...message.matchAll(
      /(?:sản phẩm|san pham|sp|món|mon)\s*(?:số|so|thứ|thu)?\s*(\d+)|(?:và|va|,|hoặc|hoac)\s*(?:(?:sản phẩm|san pham|sp|món|mon)\s*)?(?:số|so)?\s*(\d+)/gi
    )];
    return [...new Set(matches
      .map((match) => Number(match[1] || match[2]))
      .filter((position) => Number.isInteger(position) && position > 0))];
  }

  private static formatCheckoutProduct(product: any, quantity: number, cartItemId?: number) {
    const inventories = Array.isArray(product.inventories) ? product.inventories : [];
    return {
      id: Number(product.id),
      productId: Number(product.id),
      ...(cartItemId !== undefined && { cartItemId }),
      name: product.name,
      productName: product.name,
      sku: product.sku,
      description: product.description,
      shortDescription: product.short_description,
      images: (product.product_images || []).map((image: any) => image.image_url),
      brandName: product.brands?.name || null,
      categoryName: product.categories?.name || null,
      price: Number(product.price || 0),
      salePrice: product.sale_price ? Number(product.sale_price) : null,
      totalStockQuantity: inventories.reduce((sum: number, inventory: any) => sum + Number(inventory.quantity || 0), 0),
      totalAvailableQuantity: inventories.reduce(
        (sum: number, inventory: any) => sum + Number(inventory.available_quantity ?? Math.max(
          Number(inventory.quantity || 0) - Number(inventory.reserved_quantity || 0),
          0
        )),
        0
      ),
      quantity,
    };
  }

  private static toBigIntIds(primaryId: bigint | number | null | undefined, ids?: Array<bigint | number>): bigint[] {
    const values = [...(ids || []), ...(primaryId !== null && primaryId !== undefined ? [primaryId] : [])];
    return [...new Set(values.map((id) => BigInt(id)))];
  }

  private static selectCartItems(cartItems: any[], requestedProductIds: bigint[]) {
    if (requestedProductIds.length === 0) {
      return { items: cartItems, missingProductIds: [] as bigint[] };
    }

    const requestedIds = new Set(requestedProductIds.map(String));
    const items = cartItems.filter((item: any) => requestedIds.has(String(item.productId)));
    const cartProductIds = new Set(items.map((item: any) => String(item.productId)));
    const missingProductIds = requestedProductIds.filter((id) => !cartProductIds.has(String(id)));
    return { items, missingProductIds };
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
    const receiverName = entities.receiverName || message?.match(/(?:họ và tên|tên(?: người nhận)?)(?:\s+tôi)?\s*(?:là|:)?\s*([^,;\n]+)/iu)?.[1]?.trim();
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

    const formatCheckoutReview = (items: Array<{ name: string; quantity: number; unitPrice: number }>, subtotal: number): string => {
      const paymentLabels: Record<string, string> = {
        COD: 'Thanh toán khi nhận hàng (COD)',
        BANK_TRANSFER: 'Chuyển khoản',
        MOMO: 'MoMo',
        VNPAY: 'VNPay',
      };
      const productLines = items.map((item, index) =>
        `${index + 1}. ${item.name} (SL: ${item.quantity} x ${item.unitPrice.toLocaleString('vi-VN')}đ)`
      );
      const missing = getMissingCheckoutInfo(items.length > 0);
      const customerLines = [
        `Tên người nhận: ${receiverName || 'Chưa cung cấp'}`,
        `Số điện thoại: ${receiverPhone || 'Chưa cung cấp'}`,
        `Địa chỉ giao hàng: ${address || 'Chưa cung cấp'}`,
        `Phương thức thanh toán: ${paymentMethod ? paymentLabels[paymentMethod] || paymentMethod : 'Chưa cung cấp'}`,
      ];
      const review = [
        'Vui lòng kiểm tra thông tin đơn hàng:',
        productLines.length ? productLines.join('\n') : 'Chưa có sản phẩm',
        `Tạm tính: ${subtotal.toLocaleString('vi-VN')}đ`,
        '',
        'Thông tin nhận hàng:',
        ...customerLines,
      ].join('\n');

      if (missing.length > 0) {
        return `${review}\n\nCòn thiếu: ${missing.join(', ')}. Vui lòng gửi bổ sung hoặc gửi lại trường cần sửa.`;
      }
      return `${review}\n\nNếu mọi thông tin đã chính xác, hãy gửi "Xác nhận đặt hàng". Nếu cần sửa, hãy gửi lại trường muốn thay đổi.`;
    };

    const getCheckoutInfoReply = (): string => {
      const items = (entities.checkoutItems || []).map((item: any) => ({
        name: String(item.name || 'Sản phẩm'),
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
      }));
      const subtotal = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);
      const review = formatCheckoutReview(items, subtotal);
      const phoneNeedsCorrection = !receiverPhone && /(?:số điện thoại|sdt|điện thoại|phone)\s*(?:là|:)?\s*0?[\d\s.-]{1,14}/i.test(message || '');
      return phoneNeedsCorrection
        ? review.replace('số điện thoại người nhận.', 'số điện thoại người nhận (cần 10–11 chữ số).')
        : review;
    };

    try {
      switch (intent) {
        // gộp tất cả intent liên quan đến đặt hàng / thanh toán / checkout
        case 'bat_dau_dat_hang':
        case 'thanh_toan_don_hang':
        case 'dat_hang': {
          const cart = await CartService.getMyCart(userId);
          const cartPositions = OrderHandler.resolveCartPositions(message);
          if (cartPositions.length === 0 && entities.productIndex && message && /(?:trong|ở|o)\s+(?:giỏ hàng|gio hang)|(?:giỏ hàng|gio hang)\s+(?:của tôi|cua toi)/i.test(message)) {
            cartPositions.push(Number(entities.productIndex));
          }
          const isCartPositionRequest = cartPositions.length > 0;
          const selectedByCartPosition = cartPositions.map((position) => cart.items[position - 1]);

          if (isCartPositionRequest) {
            const missingPositions = cartPositions.filter((_, index) => !selectedByCartPosition[index]);
            if (missingPositions.length > 0) {
              return { replyMessage: `Giỏ hàng của bạn không có sản phẩm số ${missingPositions.join(', ')}.` };
            }
            entities.productId = Number(selectedByCartPosition[0].productId);
            entities.productIds = selectedByCartPosition.map((item: any) => Number(item.productId));
            entities.cartItemIds = selectedByCartPosition.map((item: any) => Number(item.id));
          }

          if (!entities.productId && message) {
            const selectedProductId = OrderHandler.resolveProductIdFromHistory(message, history);
            if (selectedProductId) entities.productId = selectedProductId;
          }

          const requestedProductIds = OrderHandler.toBigIntIds(entities.productId, entities.productIds);

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

          const { items: matchedCartItems, missingProductIds } = OrderHandler.selectCartItems(cart.items, requestedProductIds);
          if (missingProductIds.length > 0) {
            return {
              replyMessage: 'Một hoặc nhiều sản phẩm bạn yêu cầu chưa có trong giỏ hàng. Vui lòng thêm sản phẩm vào giỏ trước khi đặt hàng.',
            };
          }

          const selectedCartItems = isCartPositionRequest ? selectedByCartPosition : matchedCartItems;
          if (!selectedCartItems || selectedCartItems.length === 0) {
            return { replyMessage: 'Giỏ hàng của bạn đang trống, vui lòng chọn sản phẩm trước khi đặt hàng.' };
          }

          const subtotal = selectedCartItems.reduce((sum: number, item: any) => sum + Number(item.subtotal || 0), 0);

          const missing = getMissingCheckoutInfo(selectedCartItems.length > 0);
          const checkoutProducts = await (async () => {
                const productRecords = await prisma.products.findMany({
                  where: { id: { in: selectedCartItems.map((item: any) => BigInt(item.productId)) } },
                  include: {
                    inventories: true,
                    product_images: { orderBy: { sort_order: 'asc' } },
                    brands: true,
                    categories: true,
                  },
                });
                const productsById = new Map(productRecords.map((product) => [Number(product.id), product]));
                return selectedCartItems.flatMap((item: any) => {
                  const product = productsById.get(Number(item.productId));
                  return product
                    ? [OrderHandler.formatCheckoutProduct(product, Number(item.quantity), Number(item.id))]
                    : [];
                });
              })();
          const reviewItems = checkoutProducts.map((product: any) => ({
            name: String(product.name || 'Sản phẩm'),
            quantity: Number(product.quantity || 0),
            unitPrice: Number(product.salePrice || product.price || 0),
          }));
          return {
            replyMessage: formatCheckoutReview(reviewItems, Number(subtotal)),
            data: checkoutProducts,
            nextStep: missing.length ? 'COLLECT_INFO' : 'CONFIRMATION'
          };
        }

        case 'tra_cuu_don_hang': {
          if (rawOrderId) {
            const orderIdNumber = Number(rawOrderId);
            if (!isNaN(orderIdNumber)) {
              const order = await OrderService.getById(orderIdNumber, userId);

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
            replyMessage: `Dưới đât là các đơn hàng của bạn:`,
            data: myOrders
          };
        }

        case 'huy_don_hang': {
          const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING];

          if (!rawOrderId) {
            const myOrders = await OrderService.getMyOrders(userId);
            const cancellableOrders = myOrders.filter((item) => cancellableStatuses.includes(item.orderStatus));
            if (cancellableOrders.length === 0) {
              return { replyMessage: 'Hiện bạn không có đơn hàng nào có thể hủy. Chỉ đơn ở trạng thái PENDING, CONFIRMED hoặc PROCESSING mới được hủy.' };
            }

            const orderList = cancellableOrders.map((item, index) =>
              `${index + 1}. Đơn #${item.id} (${item.orderCode}) - ${item.orderStatus} - ${Number(item.totalAmount).toLocaleString('vi-VN')}đ`
            ).join('\n');
            return {
              replyMessage: `Các đơn hàng bạn có thể hủy:\n${orderList}\n\nBạn hãy chọn nút "Hủy đơn" bên dưới hoặc gửi mã đơn hàng cần hủy.`,
              data: cancellableOrders,
              nextStep: 'SELECT_ORDER_TO_CANCEL'
            };
          }

          const orderIdNumber = Number(rawOrderId);
          if (isNaN(orderIdNumber)) {
            return { replyMessage: 'Mã đơn hàng không hợp lệ.' };
          }

          const order = await OrderService.getById(orderIdNumber, userId);
          if (!order) {
            return { replyMessage: `Không tìm thấy đơn hàng #${orderIdNumber}.` };
          }
          if (Number(order.userId) !== userId) {
            return { replyMessage: `Bạn không thể hủy đơn hàng #${orderIdNumber} do đơn này không thuộc tài khoản của bạn.` };
          }
          if (!cancellableStatuses.includes(order.orderStatus)) {
            return {
              replyMessage: `Đơn hàng #${orderIdNumber} đang ở trạng thái ${order.orderStatus} nên không thể hủy. Chỉ đơn ở trạng thái PENDING, CONFIRMED hoặc PROCESSING mới được hủy.`,
              data: order
            };
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
          return { replyMessage: getCheckoutInfoReply() };
        }

        case 'chon_phuong_thuc_thanh_toan': {
          return { replyMessage: getCheckoutInfoReply() };
        }

        case 'huy_checkout': {
          return {
            replyMessage: 'Đã hủy quá trình đặt hàng. Các sản phẩm vẫn được giữ trong giỏ hàng của bạn.'
          };
        }

        case 'xac_nhan_dat_hang': {
          const requestedProductIds = OrderHandler.toBigIntIds(entities.productId, entities.productIds);
          const hasSelectedCartItems = Array.isArray(entities.cartItemIds) && entities.cartItemIds.length > 0;
          const checkoutProductIds = requestedProductIds.length > 0
            ? requestedProductIds
            : OrderHandler.toBigIntIds(null, (entities.checkoutItems || []).map((item: any) => item.productId));
          if (!hasSelectedCartItems && checkoutProductIds.length === 0) {
            return { replyMessage: 'Không tìm thấy sản phẩm checkout đã chọn. Vui lòng bắt đầu đặt hàng lại từ giỏ hàng.' };
          }
          const cart = await CartService.getMyCart(userId);
          const selectedCartItems = hasSelectedCartItems
            ? cart.items.filter((item: any) => entities.cartItemIds!.some((id: any) => Number(id) === Number(item.id)))
            : OrderHandler.selectCartItems(cart.items, checkoutProductIds).items;
          const missing = getMissingCheckoutInfo(Boolean(selectedCartItems?.length));
          if (missing.length > 0) {
            return {
              replyMessage: `Chưa thể đặt hàng vì còn thiếu ${missing.join(', ')}. Bạn vui lòng cung cấp đủ thông tin rồi xác nhận lại nhé.`
            };
          }

          if (!selectedCartItems || selectedCartItems.length === 0) {
            return { replyMessage: 'Không thể xác nhận đơn: sản phẩm đã chọn không còn trong giỏ hàng. Vui lòng thêm lại sản phẩm rồi bắt đầu đặt hàng.' };
          }

          if (hasSelectedCartItems && selectedCartItems.length !== entities.cartItemIds!.length) {
            return { replyMessage: 'Một hoặc nhiều sản phẩm đã chọn không còn trong giỏ hàng. Vui lòng kiểm tra giỏ rồi bắt đầu đặt hàng lại.' };
          }

          const { missingProductIds } = OrderHandler.selectCartItems(cart.items, checkoutProductIds);
          if (missingProductIds.length > 0) {
            return { replyMessage: 'Một hoặc nhiều sản phẩm đã chọn không còn trong giỏ hàng. Vui lòng thêm lại sản phẩm rồi bắt đầu đặt hàng.' };
          }

          const createdOrder = await OrderService.create(userId, {
            warehouseId: 1,
            cartItemIds: selectedCartItems?.map((item: any) => Number(item.id)),
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

          if (selectedCartItems?.length) {
            await CartService.removeItems(userId, selectedCartItems.map((item: any) => Number(item.id)));
          }

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