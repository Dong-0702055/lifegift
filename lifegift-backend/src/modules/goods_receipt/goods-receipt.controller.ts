import { Request, Response } from 'express';
import { GoodsReceiptService } from './goods-receipt.service';

export class GoodsReceiptController {
  public static async getAll(req: Request, res: Response) {
    try {
      const data = await GoodsReceiptService.getAll();
      return res.status(200).json({ success: true, message: 'Lấy danh sách phiếu nhập kho thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await GoodsReceiptService.getById(id);
      return res.status(200).json({ success: true, message: 'Lấy chi tiết phiếu nhập kho thành công', data });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message, data: null });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) throw new Error('Không tìm thấy thông tin người dùng thực hiện');

      const data = await GoodsReceiptService.create(req.body, Number(userId));
      return res.status(201).json({ success: true, message: 'Tạo phiếu nhập kho thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }
}