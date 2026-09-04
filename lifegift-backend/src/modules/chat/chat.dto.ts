export interface ResolvedEntities {
  productId?: bigint | number | null;
  categoryId?: bigint | number | null;
  brandId?: bigint | number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  extractedPrice?: number | null;
  orderId?: string | null;
  phone?: string | null;
  [key: string]: any; // Thêm dòng này để linh hoạt nhận dữ liệu từ AliasResolver
}

export interface ChatResponsePayload {
  replyMessage: string;
  data?: any;
}