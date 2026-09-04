import { Request, Response } from 'express';
import { CouponService } from './coupon.service';

export class CouponController {
  // Client áp dụng mã
  public static async apply(req: Request, res: Response) {
    try {
      const data = await CouponService.validateAndCalculate(req.body);
      return res.status(200).json({
        success: true,
        message: 'Áp dụng mã giảm giá thành công',
        data,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  // Admin tạo mới
  public static async create(req: Request, res: Response) {
    try {
      const data = await CouponService.create(req.body);
      return res.status(201).json({ success: true, message: 'Tạo mã giảm giá thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  // Admin lấy danh sách
  public static async getAll(req: Request, res: Response) {
    try {
      const data = await CouponService.getAll();
      return res.status(200).json({ success: true, message: 'Lấy danh sách mã giảm giá thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  // Admin/User lấy chi tiết
  public static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await CouponService.getById(id);
      return res.status(200).json({ success: true, message: 'Lấy chi tiết mã giảm giá thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  // Admin cập nhật
  public static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await CouponService.update(id, req.body);
      return res.status(200).json({ success: true, message: 'Cập nhật mã giảm giá thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  // Admin xóa
  public static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await CouponService.delete(id);
      return res.status(200).json({ success: true, message: 'Xóa mã giảm giá thành công', data: null });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }
}