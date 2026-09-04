import { Request, Response } from 'express';
import { SupplierService } from './supplier.service';

export class SupplierController {
  public static async getAll(req: Request, res: Response) {
    try {
      const data = await SupplierService.getAll();
      return res.status(200).json({ success: true, message: 'Lấy danh sách nhà cung cấp thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await SupplierService.getById(id);
      return res.status(200).json({ success: true, message: 'Lấy chi tiết nhà cung cấp thành công', data });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message, data: null });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const data = await SupplierService.create(req.body);
      return res.status(201).json({ success: true, message: 'Tạo nhà cung cấp thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await SupplierService.update(id, req.body);
      return res.status(200).json({ success: true, message: 'Cập nhật nhà cung cấp thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await SupplierService.delete(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }
}