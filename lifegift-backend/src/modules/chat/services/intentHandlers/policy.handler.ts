// src/services/chat/intentHandlers/policy.handler.ts
import { ChatResponsePayload } from '../../chat.dto';

export class PolicyHandler {
  public static handle(intent: string): ChatResponsePayload {
    switch (intent) {
      case 'hoi_phi_ship':
        return { replyMessage: 'Phí giao hàng từ 20k-35k tùy khu vực. Đơn hàng từ 500.000đ được FREESHIP toàn quốc ạ!' };
      case 'thoi_gian_giao_hang':
        return { replyMessage: 'Nội thành giao nhanh trong 1-2 ngày. Các tỉnh thành khác khoảng 2-4 ngày làm việc ạ.' };
      case 'dia_chi_cua_hang':
        return { replyMessage: 'Địa chỉ cửa hàng LifeGift: 123 Đường Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh.' };
      case 'chinh_sach_doi_tra':
        return { replyMessage: 'Bạn được kiểm tra hàng trước khi nhận. Đổi trả miễn phí trong vòng 7 ngày nếu lỗi từ nhà sản xuất.' };
      case 'phuong_thuc_thanh_toan':
        return { replyMessage: 'LifeGift hỗ trợ thanh toán COD (nhận hàng trả tiền), chuyển khoản Ngân hàng và ví MoMo.' };
      case 'khuyen_mai':
        return { replyMessage: 'Shop đang áp dụng voucher giảm 10% cho khách hàng mới và nhiều quà tặng hấp dẫn cho đơn hàng lớn ạ!' };
      case 'huong_dan_dat_hang':
        return {
          replyMessage: 'Bạn đặt hàng theo 4 bước nhé:\n1. Chọn sản phẩm và bấm "Thêm vào giỏ hàng".\n2. Mở giỏ hàng, kiểm tra sản phẩm và số lượng rồi chọn đặt hàng.\n3. Điền tên người nhận, số điện thoại, địa chỉ giao hàng và phương thức thanh toán.\n4. Kiểm tra lại thông tin và bấm hoặc nhắn "Xác nhận đặt hàng" để hoàn tất.\n hoặc bạn có thể điền thông tin trong đoạn chat'
        };
      default:
        return { replyMessage: 'Bạn cần hỗ trợ thêm thông tin về dịch vụ của LifeGift không ạ?' };
    }
  }
}