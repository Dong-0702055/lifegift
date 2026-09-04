import { Request, Response } from 'express';
import { PurchaseOrderService } from './purchase.service';

export class PurchaseOrderController {
  public static async getAll(req: Request, res: Response) {
    try {
      const data = await PurchaseOrderService.getAll();
      return res.status(200).json({ success: true, message: 'Lấy danh sách đơn nhập hàng thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await PurchaseOrderService.getById(id);
      return res.status(200).json({ success: true, message: 'Lấy chi tiết đơn nhập hàng thành công', data });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message, data: null });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const data = await PurchaseOrderService.create(req.body);
      return res.status(201).json({ success: true, message: 'Tạo đơn nhập hàng thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async updateStatus(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.id;
      const data = await PurchaseOrderService.updateStatus(id, req.body, userId);
      return res.status(200).json({ success: true, message: 'Cập nhật trạng thái đơn nhập thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await PurchaseOrderService.delete(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }
}