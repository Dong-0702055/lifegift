export interface ResolvedEntities {
  productId?: bigint | number | null;
  categoryId?: bigint | number | null;
  brandId?: bigint | number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  extractedPrice?: number | null;
  orderId?: string | null;
  phone?: string | null;

  // --- Bổ sung các entity mới ---
  quantity?: number | null;
  paymentMethod?: 'COD' | 'VNPAY' | 'MOMO' | null;
  receiverName?: string | null;
  address?: string | null;
  
  [key: string]: any;
}

export interface ChatResponsePayload {
  replyMessage: string;
  data?: any;
  nextStep?: string; // Dùng để quản lý luồng trạng thái (State) ở Frontend nếu cần
}