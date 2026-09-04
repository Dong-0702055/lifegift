import { Request, Response } from 'express';
import { OrderService } from './order.service';
import { OrderStatus } from './order.dto';

export class OrderController {
  public static async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data = await OrderService.create(userId, req.body);
      return res.status(201).json({ success: true, message: 'Tạo đơn hàng thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async getAll(req: Request, res: Response) {
    try {
      const data = await OrderService.getAll();
      return res.status(200).json({ success: true, message: 'Lấy danh sách đơn hàng thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async getMyOrders(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data = await OrderService.getMyOrders(userId);
      return res.status(200).json({ success: true, message: 'Lấy đơn hàng của tôi thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await OrderService.getById(id);
      return res.status(200).json({ success: true, message: 'Lấy chi tiết đơn hàng thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

public static async updateStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const id = Number(req.params.id);
    const { status, note } = req.body;
    const data = await OrderService.updateStatus(userId,id,status,note);
    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
}
}