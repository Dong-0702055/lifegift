// src/services/chat/intentHandlers/converse.handler.ts
import { ChatResponsePayload } from '../../chat.dto';

export class ConverseHandler {
  public static handle(intent: string): ChatResponsePayload {
    switch (intent) {
      case 'chao_hoi':
        return { replyMessage: 'Xin chào! Cửa hàng nông sản LifeGift có thể hỗ trợ gì cho bạn hôm nay? 😊' };
      case 'tam_biet':
        return { replyMessage: 'Cảm ơn bạn đã quan tâm đến LifeGift. Hẹn gặp lại bạn lần sau nhé! 👋' };
      case 'cam_on':
        return { replyMessage: 'Dạ không có gì ạ! Cần thêm thông tin gì bạn cứ nhắn shop nhé. ❤️' };
      case 'khong_hieu':
      default:
        return { replyMessage: 'Dạ shop chưa hiểu rõ ý bạn lắm. Bạn cần tư vấn về sản phẩm, giá cả hay chính sách mua hàng ạ?' };
    }
  }
}