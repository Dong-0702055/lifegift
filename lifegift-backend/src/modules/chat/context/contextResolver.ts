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

    const paymentMatch = lowerMsg.match(/\b(cod|momo|vnpay|chuyển khoản|chuyen khoan|tiền mặt|tien mat)\b/i);
    if (!resolvedEntities.paymentMethod && paymentMatch) {
      const payment = paymentMatch[1].toLowerCase();
      resolvedEntities.paymentMethod = payment === 'momo' ? 'MOMO'
        : payment === 'vnpay' ? 'VNPAY'
        : payment.includes('chuyển') || payment.includes('chuyen') ? 'BANK_TRANSFER'
        : 'COD';
    }

    const phoneMatch = message.match(/(?:số điện thoại|sdt|điện thoại|phone)\s*(?:là|:)?\s*(0\d{9,10})/i) || message.match(/\b(0\d{9,10})\b/);
    if (!resolvedEntities.receiverPhone && phoneMatch) {
      resolvedEntities.receiverPhone = phoneMatch[1];
    }

    const nameMatch = message.match(/(?:tên người nhận|tên)\s*(?:là|:)?\s*([\p{L} ]{2,80})/iu);
    if (!resolvedEntities.receiverName && nameMatch?.[1]) {
      resolvedEntities.receiverName = nameMatch[1].trim();
    }

    const addressMatch = message.match(/(?:địa chỉ giao hàng|địa chỉ)\s*(?:là|:)?\s*(.+)$/i);
    if (!resolvedEntities.address && addressMatch?.[1]) {
      resolvedEntities.address = addressMatch[1].trim();
    }

    // Kế thừa các entity chưa được nói lại trong câu hiện tại.
    const rememberedFields = [
      'quantity', 'address', 'receiverName', 'receiverPhone', 'paymentMethod', 'couponCode',
    ];
    for (const field of rememberedFields) {
      const inCheckout = previousState.checkoutStep && previousState.checkoutStep !== 'NONE';
      if (inCheckout && (resolvedEntities[field] === undefined || resolvedEntities[field] === null || resolvedEntities[field] === '') && previousState[field as keyof ConversationState] !== undefined) {
        resolvedEntities[field] = previousState[field as keyof ConversationState];
      }
    }

    // 1. Kế thừa Product ID nếu câu hiện tại hỏi tiếp về sản phẩm cũ
    // Ví dụ: "Còn hàng không?", "Giá bao nhiêu?", "Thêm vào giỏ hàng"
    if (!resolvedEntities.productId && previousState.productId) {
      const isContextualQuestion = 
        ['kiem_tra_ton_kho', 'hoi_gia', 'them_gio_hang', 'chi_tiet_san_pham', 'bat_dau_dat_hang', 'dat_hang', 'xac_nhan_dat_hang'].includes(intent) ||
        (previousState.checkoutStep && previousState.checkoutStep !== 'NONE') ||
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