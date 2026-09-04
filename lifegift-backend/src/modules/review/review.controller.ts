import { Request, Response } from 'express';
import { ReviewService } from './review.service';
import { ReviewStatus } from './review.dto';

export class ReviewController {
  // Public: Xem đánh giá sản phẩm
  public static async getProductReviews(req: Request, res: Response) {
    try {
      const productId = Number(req.params.productId);
      const data = await ReviewService.getByProductId(productId);
      return res.status(200).json({ success: true, message: 'Lấy danh sách đánh giá thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  // User: Gửi đánh giá mới
  public static async createReview(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data = await ReviewService.create(userId, req.body);
      return res.status(201).json({ success: true, message: 'Gửi đánh giá thành công, vui lòng chờ duyệt', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  // Admin: Lấy tất cả đánh giá
  public static async getAllReviews(req: Request, res: Response) {
    try {
      const status = req.query.status as ReviewStatus;
      const data = await ReviewService.getAllForAdmin(status);
      return res.status(200).json({ success: true, message: 'Lấy danh sách đánh giá thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  // Admin: Cập nhật trạng thái đánh giá (APPROVED, HIDDEN, PENDING)
  public static async updateReviewStatus(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await ReviewService.updateStatus(id, req.body);
      return res.status(200).json({ success: true, message: 'Cập nhật trạng thái đánh giá thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }
}