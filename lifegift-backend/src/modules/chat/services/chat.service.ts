// src/services/chat/chat.service.ts
import { AliasResolverService } from './aliasResolver.service';
import { ProductHandler } from './intentHandlers/product.handler';
import { OrderHandler } from './intentHandlers/order.handler';
import { PolicyHandler } from './intentHandlers/policy.handler';
import { ConverseHandler } from './intentHandlers/converse.handler';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

const serializeData = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
  );
};

export class ChatService {
  public static async processMessage(message: string, userId?: number) {
    // 1. Gọi Python AI Service
    let intent = 'fallback';
    let confidence = 0;

    try {
      const aiRes = await fetch(`${AI_SERVICE_URL}/predict-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });

      if (aiRes.ok) {
        const aiData: any = await aiRes.json();
        intent = aiData.intent;
        confidence = aiData.confidence;
      }
    } catch (err) {
      console.error('Lỗi kết nối AI Service:', err);
    }

    // 2. Resolve Entities
    const entities = await AliasResolverService.resolveEntities(message);

    // 3. Dispatch tới Domain Handler tương ứng theo Intent Group
    let responsePayload;

    const productIntents = [
      'kiem_tra_ton_kho', 'tim_kiem_san_pham', 'tim_san_pham_theo_gia',
      'goi_y_san_pham', 'chi_tiet_san_pham', 'so_sanh_san_pham',
      'hoi_gia', 'hoi_khoi_luong', 'hoi_don_vi', 'hoi_thuong_hieu', 'hoi_nguon_goc'
    ];

    const orderIntents = ['tra_cuu_don_hang', 'huy_don_hang'];

    const policyIntents = [
      'hoi_phi_ship', 'thoi_gian_giao_hang', 'dia_chi_cua_hang',
      'chinh_sach_doi_tra', 'phuong_thuc_thanh_toan', 'khuyen_mai'
    ];

    if (productIntents.includes(intent)) {
      responsePayload = await ProductHandler.handle(intent, entities);
    } else if (orderIntents.includes(intent)) {
      responsePayload = await OrderHandler.handle(intent, entities, userId);
    } else if (policyIntents.includes(intent)) {
      responsePayload = PolicyHandler.handle(intent);
    } else {
      responsePayload = ConverseHandler.handle(intent);
    }

    return serializeData({
      message,
      intent: { name: intent, confidence },
      entities,
      products: responsePayload.data || [],
      response: responsePayload.replyMessage,
    });
  }
}