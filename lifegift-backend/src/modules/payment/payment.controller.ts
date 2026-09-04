import { Request, Response } from 'express';
import { PaymentService } from './payment.service';

export class PaymentController {
  public static async getByOrderId(req: Request, res: Response) {
    try {
      const orderId = Number(req.params.orderId);
      const data = await PaymentService.getLatestByOrderId(orderId);
      return res.status(200).json({ success: true, message: 'Lấy thông tin thanh toán thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async markSuccess(req: Request, res: Response) {
    try {
      const orderId = Number(req.params.orderId);
      const transactionCode = req.query.transactionCode as string;
      const data = await PaymentService.markSuccess(orderId, transactionCode);
      return res.status(200).json({ success: true, message: 'Xác nhận thanh toán thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async markFailed(req: Request, res: Response) {
    try {
      const orderId = Number(req.params.orderId);
      const transactionCode = req.query.transactionCode as string;
      const data = await PaymentService.markFailed(orderId, transactionCode);
      return res.status(200).json({ success: true, message: 'Đánh dấu thanh toán thất bại', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async refund(req: Request, res: Response) {
    try {
      const orderId = Number(req.params.orderId);
      const data = await PaymentService.refund(orderId);
      return res.status(200).json({ success: true, message: 'Hoàn tiền thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }
}