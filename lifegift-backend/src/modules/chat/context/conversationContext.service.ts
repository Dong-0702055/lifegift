import redis from '../../../config/redisClient'; // Đường dẫn tới file khởi tạo Redis client của bạn

export interface ConversationState {
  checkoutItems?: Array<{ productId: number; cartItemId?: number; name: string; quantity?: number; unitPrice?: number }>;
  lastIntent?: string;
  productId?: number;
  productIds?: number[];
  cartItemIds?: number[];
  productName?: string;
  categoryId?: number;
  categoryIds?: number[];
  brandId?: number;
  brandIds?: number[];
  origin?: string;
  orderId?: number;
  quantity?: number;
  minPrice?: number;
  maxPrice?: number;
  address?: string;
  receiverName?: string;
  receiverPhone?: string;
  paymentMethod?: string;
  checkoutStep?: 'NONE' | 'CART' | 'ADDRESS' | 'PAYMENT' | 'CONFIRMATION';
  mentionedProducts?: Array<{ productId: number; name: string }>;
  recentProducts?: Array<{ productId: number; name: string }>;
  viewedProductIds?: number[];
  extractedPrice?: number;
  couponCode?: string;
  checkoutCompleted?: boolean;
}

export class ConversationContextService {
  private static getKey(sessionId: string): string {
    return `chat:state:${sessionId}`;
  }

  static async getState(sessionId: string): Promise<ConversationState> {
    try {
      const raw = await redis.get(this.getKey(sessionId));
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.error('Lỗi khi lấy ConversationState từ Redis:', err);
      return {};
    }
  }

  static async saveState(sessionId: string, state: ConversationState): Promise<void> {
    try {
      await redis.set(
        this.getKey(sessionId),
        JSON.stringify(state),
        'EX',
        30 * 60 // Tự động xóa trạng thái sau 30 phút không tương tác
      );
    } catch (err) {
      console.error('Lỗi khi lưu ConversationState vào Redis:', err);
    }
  }

  static async updateState(
    sessionId: string, 
    intent: string, 
    entities: Record<string, any>
  ): Promise<ConversationState> {
    const currentState = await this.getState(sessionId);

    const rememberedFields = [
      'productId', 'productIds', 'cartItemIds', 'productName', 'categoryId', 'categoryIds', 'brandId', 'brandIds', 'origin', 'orderId',
      'quantity', 'minPrice', 'maxPrice', 'extractedPrice', 'address', 'checkoutItems',
      'receiverName', 'receiverPhone', 'paymentMethod', 'couponCode', 'checkoutStep', 'mentionedProducts',
    ];
    const updatedState: ConversationState = { ...currentState, lastIntent: intent };

    for (const field of rememberedFields) {
      const value = entities[field];
      if (value !== undefined && value !== null && value !== '') {
        (updatedState as any)[field] = value;
      }
    }

    if (entities.invalidReceiverPhone) delete updatedState.receiverPhone;

    if (intent === 'bat_dau_dat_hang' && !entities.productId) {
      delete updatedState.productId;
      delete updatedState.productName;
      delete (updatedState as any).productIds;
      delete (updatedState as any).productIndex;
      delete (updatedState as any).productIndices;
      if (!entities.checkoutItems) delete updatedState.checkoutItems;
    }

    if (intent === 'huy_checkout' || entities.checkoutCompleted) {
      delete updatedState.checkoutStep;
      delete updatedState.quantity;
      delete updatedState.couponCode;
      delete updatedState.productId;
      delete updatedState.productName;
      delete updatedState.productIds;
      delete updatedState.cartItemIds;
      delete updatedState.checkoutItems;
      delete updatedState.address;
      delete updatedState.receiverName;
      delete updatedState.receiverPhone;
      delete updatedState.paymentMethod;
    }

    await this.saveState(sessionId, updatedState);
    return updatedState;
  }

  static async clearState(sessionId: string): Promise<void> {
    try {
      await redis.del(this.getKey(sessionId));
    } catch (err) {
      console.error('Lỗi khi xóa ConversationState:', err);
    }
  }

  static async rememberViewedProducts(sessionId: string, products: any[]): Promise<void> {
    if (!Array.isArray(products) || products.length === 0) return;

    const currentState = await this.getState(sessionId);
    const previousIds = currentState.viewedProductIds || [];
    const newIds = products
      .map((product) => Number(product?.id))
      .filter((id) => Number.isInteger(id) && id > 0);
    const viewedProductIds = [...new Set([...previousIds, ...newIds])].slice(-50);

    await this.saveState(sessionId, { ...currentState, viewedProductIds });
  }

  static async rememberRecentProducts(sessionId: string, products: any[]): Promise<void> {
    if (!Array.isArray(products) || products.length < 2) return;

    const recentProducts = products
      .map((product) => ({
        productId: Number(product?.id ?? product?.productId ?? product?.product_id),
        name: String(product?.name ?? product?.productName ?? ''),
      }))
      .filter((product) => Number.isInteger(product.productId) && product.productId > 0)
      .slice(0, 10);

    if (recentProducts.length === 0) return;

    const currentState = await this.getState(sessionId);
    await this.saveState(sessionId, { ...currentState, recentProducts });
  }
}