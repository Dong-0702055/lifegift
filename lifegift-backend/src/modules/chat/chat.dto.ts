export interface ResolvedEntities {
  productId?: bigint | number | null;
  productIds?: Array<bigint | number>;
  productIndex?: number | null;
  productIndices?: number[];
  categoryId?: bigint | number | null;
  categoryIds?: Array<bigint | number>;
  brandId?: bigint | number | null;
  brandIds?: Array<bigint | number>;
  origin?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  extractedPrice?: number | null;
  orderId?: string | null;
  phone?: string | null;

  // --- Bổ sung các entity mới ---
  quantity?: number | null;
  paymentMethod?: 'COD' | 'VNPAY' | 'MOMO' | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  address?: string | null;
  
  [key: string]: any;
}

export interface ChatResponsePayload {
  replyMessage: string;
  data?: any;
  nextStep?: string; // Dùng để quản lý luồng trạng thái (State) ở Frontend nếu cần
}