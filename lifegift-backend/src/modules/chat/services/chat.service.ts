import { AliasResolverService } from './aliasResolver.service';
import { ProductHandler } from './intentHandlers/product.handler';
import { OrderHandler } from './intentHandlers/order.handler';
import { CartHandler } from './intentHandlers/cart.handler';
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

    const entities = await AliasResolverService.resolveEntities(message);

    // 1. Nhóm Intent Sản phẩm
    const productIntents = [
      'kiem_tra_ton_kho', 'tim_kiem_san_pham', 'tim_san_pham_theo_gia',
      'goi_y_san_pham', 'chi_tiet_san_pham', 'so_sanh_san_pham',
      'hoi_gia', 'hoi_khoi_luong', 'hoi_don_vi', 'hoi_thuong_hieu', 'hoi_nguon_goc'
    ];

    // 2. Nhóm Intent Giỏ hàng (Đã cập nhật đủ)
    const cartIntents = [
      'them_gio_hang', 'them_vao_gio_hang', 'xem_gio_hang', 
      'cap_nhat_gio_hang', 'xoa_khoi_gio_hang'
    ];

    // 3. Nhóm Intent Đặt hàng & Đơn hàng (Đã bổ sung huy_checkout)
    const orderIntents = [
      'tra_cuu_don_hang', 'huy_don_hang', 
      'bat_dau_dat_hang', 'nhap_dia_chi_giao_hang', 
      'chon_phuong_thuc_thanh_toan', 'xac_nhan_dat_hang', 'huy_checkout'
    ];

    // 4. Nhóm Intent Chính sách
    const policyIntents = [
      'hoi_phi_ship', 'thoi_gian_giao_hang', 'dia_chi_cua_hang',
      'chinh_sach_doi_tra', 'phuong_thuc_thanh_toan', 'khuyen_mai'
    ];

    let responsePayload;

    if (productIntents.includes(intent)) {
      responsePayload = await ProductHandler.handle(intent, entities);
    } else if (cartIntents.includes(intent)) {
      responsePayload = await CartHandler.handle(intent, entities, userId);
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