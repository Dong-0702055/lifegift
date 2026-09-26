// src/services/chat/chat.service.ts
import { AliasResolverService } from './aliasResolver.service';
import { ConversationContextService } from '../context/conversationContext.service';
import { ContextResolver } from '../context/contextResolver';

import { ProductHandler } from './intentHandlers/product.handler';
import { OrderHandler } from './intentHandlers/order.handler';
import { CartHandler } from './intentHandlers/cart.handler';
import { PolicyHandler } from './intentHandlers/policy.handler';
import { ConverseHandler } from './intentHandlers/converse.handler';
import { ChatMessageItem } from '../redisChat.service';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

const serializeData = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
  );
};

export class ChatService {
  public static async processMessage(
    message: string, 
    userId?: number, 
    history: ChatMessageItem[] = [],
    sessionId?: string
  ) {
    // 0. Khởi tạo Session ID để lưu State vào Redis
    // Dùng cùng session key với ChatController/RedisChatService để state và history
    // luôn thuộc về cùng một cuộc trò chuyện.
    const targetSessionId = sessionId || (userId ? String(userId) : 'guest_session');

    // 1. Lấy State hội thoại cũ từ Redis
    const previousState = await ConversationContextService.getState(targetSessionId);
    const lastSingleProductMessage = [...history]
      .reverse()
      .find((item) => item.role === 'assistant' && Array.isArray(item.products) && item.products.length === 1);
    const lastProductListMessage = [...history]
      .reverse()
      .find((item) => item.role === 'assistant' && Array.isArray(item.products) && item.products.length > 1);
    const recentProductsFromHistory = lastProductListMessage?.products
      ?.map((product: any) => ({
        productId: Number(product?.id ?? product?.productId ?? product?.product_id),
        name: String(product?.name ?? product?.productName ?? ''),
      }))
      .filter((product: { productId: number; name: string }) => Number.isInteger(product.productId) && product.productId > 0)
      .slice(0, 10);
    const contextState = {
      ...previousState,
      ...(!previousState.productId && lastSingleProductMessage?.products?.[0]?.id && {
        productId: Number(lastSingleProductMessage.products[0].id),
        productName: lastSingleProductMessage.products[0].name,
      }),
      ...(recentProductsFromHistory?.length && {
        recentProducts: recentProductsFromHistory,
      }),
    };

    // 2. Dự đoán Intent qua PhoBERT AI Service
    let intent = 'fallback';
    let confidence = 0;
    let detectedEntities: Array<{ type?: string; text?: string }> = [];

    try {
      const aiRes = await fetch(`${AI_SERVICE_URL}/predict-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: message,
          history: history 
        }),
      });

      if (aiRes.ok) {
        const aiData: any = await aiRes.json();
        intent = aiData.intent;
        confidence = aiData.confidence;
        detectedEntities = Array.isArray(aiData.entities) ? aiData.entities : [];
      }
    } catch (err) {
      console.error('Lỗi kết nối AI Service:', err);
    }

    if (
      previousState.checkoutStep && previousState.checkoutStep !== 'NONE' &&
      /(?:xác nhận|xac nhan|đặt hàng|dat hang)/i.test(message)
    ) {
      intent = 'xac_nhan_dat_hang';
      confidence = 1;
    } else if (
      previousState.checkoutStep && previousState.checkoutStep !== 'NONE' &&
      /(?:tên người nhận|họ và tên|số điện thoại|\bsdt\b|địa chỉ giao hàng|phương thức thanh toán)/i.test(message)
    ) {
      intent = 'nhap_dia_chi_giao_hang';
      confidence = 1;
    }

    // Giữ đúng ý định phân trang sản phẩm ngay cả khi model cũ chưa được huấn luyện lại.
    if (/(sản phẩm|san pham|mặt hàng|mat hang)/i.test(message) &&
        /(khác|khac|trước đó|truoc do|đã xem|da xem|tiếp theo|tiep theo)/i.test(message)) {
      intent = 'xem_san_pham_khac';
      confidence = 1;
    }

    // 3. Trích xuất Entity mới từ câu nói hiện tại
    const currentEntities = await AliasResolverService.resolveEntities(message, detectedEntities);

    // 4. MERGE CONTEXT: Kết hợp State cũ + Entity mới thành Final Entities
    const finalEntities = ContextResolver.resolve(
      contextState, 
      currentEntities, 
      intent, 
      message
    );

    if ((finalEntities.productIndex || finalEntities.productIds?.length > 1) &&
      ['tim_kiem_san_pham', 'goi_y_san_pham', 'xem_san_pham_khac'].includes(intent)) {
      intent = 'chi_tiet_san_pham';
      confidence = 1;
    }

    // 5. Khai báo các nhóm Intent
    const productIntents = [
      'kiem_tra_ton_kho', 'tim_kiem_san_pham', 'tim_san_pham_theo_gia',
      'goi_y_san_pham', 'chi_tiet_san_pham', 'so_sanh_san_pham',
      'xem_san_pham_khac',
      'hoi_gia', 'hoi_khoi_luong', 'hoi_don_vi', 'hoi_thuong_hieu', 'hoi_nguon_goc'
    ];

    const cartIntents = [
      'them_gio_hang', 'them_vao_gio_hang', 'xem_gio_hang', 
      'cap_nhat_gio_hang', 'xoa_khoi_gio_hang', 'xoa_tat_ca_gio_hang'
    ];

    const orderIntents = [
      'tra_cuu_don_hang', 'huy_don_hang', 
      'bat_dau_dat_hang', 'thanh_toan_don_hang', 'dat_hang',
      'nhap_dia_chi_giao_hang', 
      'chon_phuong_thuc_thanh_toan', 'xac_nhan_dat_hang', 'huy_checkout'
    ];

    const policyIntents = [
      'hoi_phi_ship', 'thoi_gian_giao_hang', 'dia_chi_cua_hang',
      'chinh_sach_doi_tra', 'phuong_thuc_thanh_toan', 'khuyen_mai',
      'huong_dan_dat_hang'
    ];

    // 6. Điều hướng đến Handler tương ứng (Truyền finalEntities)
    let responsePayload: any;

    if (productIntents.includes(intent)) {
      responsePayload = await ProductHandler.handle(intent, finalEntities, previousState.viewedProductIds || []);
    } else if (cartIntents.includes(intent)) {
      responsePayload = await CartHandler.handle(intent, finalEntities, userId, message, history);
    } else if (orderIntents.includes(intent)) {
      responsePayload = await OrderHandler.handle(intent, finalEntities, userId, message, history);
    } else if (policyIntents.includes(intent)) {
      responsePayload = PolicyHandler.handle(intent);
    } else {
      responsePayload = ConverseHandler.handle(intent);
    }

    // 7. Lưu / Cập nhật Conversation State mới nhất vào Redis
    const stateEntities = { ...finalEntities };
    const responseProducts = Array.isArray(responsePayload.data) ? responsePayload.data : [];
    const singleResponseProduct = responseProducts.length === 1 ? responseProducts[0] : null;
    const singleResponseProductId = singleResponseProduct?.productId ?? singleResponseProduct?.id;
    if (!stateEntities.productId && singleResponseProductId) {
      stateEntities.productId = Number(singleResponseProductId);
      stateEntities.productName = singleResponseProduct.productName || singleResponseProduct.name || undefined;
    }
    if (
      ['bat_dau_dat_hang', 'thanh_toan_don_hang', 'dat_hang'].includes(intent) &&
      ['COLLECT_INFO', 'CONFIRMATION'].includes(responsePayload.nextStep) &&
      responseProducts.length > 0
    ) {
      stateEntities.checkoutItems = responseProducts
        .map((product: any) => ({
          productId: Number(product?.productId ?? product?.id),
          cartItemId: Number(product?.cartItemId) || undefined,
          name: String(product?.productName ?? product?.name ?? ''),
          quantity: Number(product?.quantity || 0),
          unitPrice: Number(product?.salePrice || product?.price || 0),
        }))
        .filter((product: { productId: number; name: string }) => Number.isInteger(product.productId) && product.productId > 0);
    }
    if (responsePayload.nextStep === 'COMPLETED') {
      stateEntities.checkoutCompleted = true;
    }
    await ConversationContextService.updateState(targetSessionId, intent, stateEntities);
    if (productIntents.includes(intent)) {
      await ConversationContextService.rememberViewedProducts(targetSessionId, responsePayload.data || []);
      await ConversationContextService.rememberRecentProducts(targetSessionId, responsePayload.data || []);
    }

    return serializeData({
      message,
      intent: { name: intent, confidence },
      entities: finalEntities,
      products: responsePayload.data || [],
      response: responsePayload.replyMessage,
    });
  }
}