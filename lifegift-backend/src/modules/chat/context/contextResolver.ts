import { ConversationState } from './conversationContext.service';

export class ContextResolver {
  static resolve(
    previousState: ConversationState,
    currentEntities: Record<string, any>,
    intent: string,
    message: string
  ): Record<string, any> {
    const resolvedEntities = { ...currentEntities };
    const lowerMsg = message.toLowerCase();
    const refersToRecentProductGroup = /(?:cả\s+)?(?:2|hai)\s+sản phẩm\s+(?:đó|đo|này|nay|trên|ở\s+trên|vừa\s+rồi)|(?:cả\s+)?hai\s+sản phẩm\b/i.test(lowerMsg);

    const productIndexMatches = [...lowerMsg.matchAll(
      /(?:sản phẩm|san pham|sp|món|mon)\s*(?:số|so|thứ|thu)?\s*(\d+)|(?:số|so|thứ|thu)\s*(\d+)|(?:và|va|,|hoặc|hoac)\s*(?:(?:sản phẩm|san pham|sp|món|mon)\s*)?(\d+)/gi
    )];
    const ordinalWords: Record<string, number> = {
      'đầu tiên': 1,
      'thứ nhất': 1,
      'thứ hai': 2,
      'thứ ba': 3,
      'thứ tư': 4,
      'thứ năm': 5,
    };
    const wordOrdinalMatches = [...lowerMsg.matchAll(
      /(?:sản phẩm|san pham|sp|món|mon)\s+(đầu tiên|thứ nhất|thứ hai|thứ ba|thứ tư|thứ năm)/gi
    )];
    const requestedProductIndices = [...new Set(
      productIndexMatches
        .map((match) => Number(match[1] || match[2] || match[3]))
        .concat(wordOrdinalMatches.map((match) => ordinalWords[match[1]]))
        .filter((index) => Number.isInteger(index) && index > 0)
    )];
    const checkoutItems = previousState.checkoutItems || [];
    const isCheckoutQuantityUpdate = intent === 'cap_nhat_gio_hang' &&
      previousState.checkoutStep && previousState.checkoutStep !== 'NONE' && checkoutItems.length > 0;
    const selectedProducts = requestedProductIndices
      .map((index) => isCheckoutQuantityUpdate
        ? checkoutItems[index - 1]
        : previousState.recentProducts?.[index - 1])
      .filter((product): product is { productId: number; name: string } => Boolean(product));
    const groupedProducts = refersToRecentProductGroup ? (previousState.recentProducts || []) : [];
    const productsToResolve = groupedProducts.length > 0 ? groupedProducts : selectedProducts;

    if (productsToResolve.length > 0) {
      if (groupedProducts.length === 0) {
        resolvedEntities.productIndex = requestedProductIndices[0];
      }
      resolvedEntities.productIndices = groupedProducts.length > 0
        ? productsToResolve.map((_, index) => index + 1)
        : requestedProductIndices;
      resolvedEntities.productIds = productsToResolve.map((product) => product.productId);
      resolvedEntities.productId = productsToResolve[0].productId;
      resolvedEntities.productName = productsToResolve[0].name;
    }

    if (isCheckoutQuantityUpdate && !resolvedEntities.productId && requestedProductIndices.length === 0 && checkoutItems.length === 1) {
      resolvedEntities.productId = checkoutItems[0].productId;
      resolvedEntities.productIds = [checkoutItems[0].productId];
      resolvedEntities.productName = checkoutItems[0].name;
    }

    const paymentMatch = lowerMsg.match(/\b(cod|momo|vnpay|chuyển khoản|chuyen khoan|tiền mặt|tien mat|thanh toán khi nhận hàng|nhận hàng)\b/i);
    if (!resolvedEntities.paymentMethod && paymentMatch) {
      const payment = paymentMatch[1].toLowerCase();
      resolvedEntities.paymentMethod = payment === 'momo' ? 'MOMO'
        : payment === 'vnpay' ? 'VNPAY'
        : payment.includes('chuyển') || payment.includes('chuyen') ? 'BANK_TRANSFER'
        : 'COD';
    }

    const checkoutInProgress = Boolean(previousState.checkoutStep && previousState.checkoutStep !== 'NONE');
    const phoneInput = message.match(/(?:số điện thoại|sdt|điện thoại|phone)\s*(?:là|:)?\s*(0[\d\s.-]{1,14})/i)?.[1]
      || message.match(/\b(0\d{9,10})\b/)?.[1]
      || (checkoutInProgress ? message.match(/\b(0\d{6,10})\b/)?.[1] : null);
    const normalizedPhone = phoneInput?.replace(/\D/g, '');
    if (normalizedPhone && /^0\d{9,10}$/.test(normalizedPhone)) {
      resolvedEntities.receiverPhone = normalizedPhone;
    } else if (phoneInput) {
      resolvedEntities.invalidReceiverPhone = true;
    }

    const nameMatch = message.match(/(?:họ và tên|tên(?: người nhận)?)(?:\s+tôi)?\s*(?:là|:)?\s*([\p{L}][\p{L} .'-]{1,79}?)(?=\s*(?:[,;]|số điện thoại|sdt|điện thoại|phone|địa chỉ|thanh toán|$))/iu);
    if (!resolvedEntities.receiverName && nameMatch?.[1]) {
      resolvedEntities.receiverName = nameMatch[1].trim();
    }

    const addressMatch = message.match(/(?:địa chỉ giao hàng|địa chỉ)\s*(?:(?:là|:)\s*)?(.+?)(?=\s*(?:[,;]\s*)?(?:họ và tên|tên(?: người nhận)?|số điện thoại|sdt|điện thoại|phone|phương thức thanh toán|thanh toán)\b|$)/iu);
    if (!resolvedEntities.address && addressMatch?.[1]) {
      resolvedEntities.address = addressMatch[1].trim().replace(/^(?:ở|tại)\s+/i, '').replace(/[,;\s]+$/, '');
    }

    // Kế thừa các entity chưa được nói lại trong câu hiện tại.
    const rememberedFields = [
      'quantity', 'productIds', 'cartItemIds', 'checkoutItems', 'address', 'receiverName', 'receiverPhone', 'paymentMethod', 'couponCode',
    ];
    for (const field of rememberedFields) {
      const inCheckout = previousState.checkoutStep && previousState.checkoutStep !== 'NONE';
      const shouldInheritField = !(field === 'quantity' && intent === 'cap_nhat_gio_hang') &&
        !(field === 'receiverPhone' && resolvedEntities.invalidReceiverPhone);
      if (inCheckout && shouldInheritField && (resolvedEntities[field] === undefined || resolvedEntities[field] === null || resolvedEntities[field] === '') && previousState[field as keyof ConversationState] !== undefined) {
        resolvedEntities[field] = previousState[field as keyof ConversationState];
      }
    }

    if (intent === 'xac_nhan_dat_hang' && checkoutItems.length > 0) {
      resolvedEntities.productIds = checkoutItems.map((item) => item.productId);
      resolvedEntities.productId = checkoutItems[0].productId;
      resolvedEntities.cartItemIds = checkoutItems
        .map((item) => item.cartItemId)
        .filter((id): id is number => Number.isInteger(id) && Number(id) > 0);
    }

    // 1. Kế thừa Product ID nếu câu hiện tại hỏi tiếp về sản phẩm cũ
    // Ví dụ: "Còn hàng không?", "Giá bao nhiêu?", "Thêm vào giỏ hàng"
    if (!resolvedEntities.productId && previousState.productId) {
      const isContextualQuestion = 
        ['kiem_tra_ton_kho', 'hoi_gia', 'them_gio_hang', 'chi_tiet_san_pham', 'dat_hang', 'xac_nhan_dat_hang'].includes(intent) ||
        lowerMsg.includes('nó') || 
        lowerMsg.includes('cái này') || 
        lowerMsg.includes('loại này') ||
        lowerMsg.includes('còn không');

      if (isContextualQuestion) {
        resolvedEntities.productId = previousState.productId;
        resolvedEntities.productName = previousState.productName;
      }
    }

    // 2. Kế thừa Order ID nếu đang thao tác với đơn hàng
    if (!resolvedEntities.orderId && previousState.orderId) {
      if (['tra_cuu_don_hang', 'huy_don_hang'].includes(intent)) {
        resolvedEntities.orderId = previousState.orderId;
      }
    }

    // 3. Xử lý luồng Đặt hàng (Checkout Flow Context)
    if (previousState.checkoutStep && previousState.checkoutStep !== 'NONE') {
      // Nếu người dùng nhập thông tin thanh toán/địa chỉ trong khi đang trong luồng Checkout
      if (intent === 'nhap_dia_chi_giao_hang' || lowerMsg.includes('địa chỉ')) {
        resolvedEntities.checkoutStep = 'ADDRESS';
      } else if (intent === 'chon_phuong_thuc_thanh_toan' || lowerMsg.includes('cod') || lowerMsg.includes('momo') || lowerMsg.includes('vnpay')) {
        resolvedEntities.checkoutStep = 'PAYMENT';
      } else if (lowerMsg.includes('đúng rồi') || lowerMsg.includes('xác nhận') || intent === 'xac_nhan_dat_hang') {
        resolvedEntities.checkoutStep = 'CONFIRMATION';
      }
    }

    if (['bat_dau_dat_hang', 'thanh_toan_don_hang', 'dat_hang'].includes(intent)) {
      resolvedEntities.checkoutStep = 'CART';
    } else if (intent === 'nhap_dia_chi_giao_hang') {
      resolvedEntities.checkoutStep = 'ADDRESS';
    } else if (intent === 'chon_phuong_thuc_thanh_toan') {
      resolvedEntities.checkoutStep = 'PAYMENT';
    } else if (intent === 'xac_nhan_dat_hang') {
      resolvedEntities.checkoutStep = 'CONFIRMATION';
    }

    return resolvedEntities;
  }
}