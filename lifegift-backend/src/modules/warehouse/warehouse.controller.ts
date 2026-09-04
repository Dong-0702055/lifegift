import { Request, Response } from 'express';
import { WarehouseService } from './warehouse.service';

export class WarehouseController {
  public static async getWarehouses(req: Request, res: Response) {
    try {
      const data = await WarehouseService.getActiveWarehouses();
      return res.status(200).json({ success: true, message: 'Lấy danh sách kho thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async getWarehouse(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await WarehouseService.getById(id);
      return res.status(200).json({ success: true, message: 'Lấy thông tin kho thành công', data });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message, data: null });
    }
  }

  public static async createWarehouse(req: Request, res: Response) {
    try {
      const data = await WarehouseService.create(req.body);
      return res.status(201).json({ success: true, message: 'Tạo kho hàng thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async updateWarehouse(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await WarehouseService.update(id, req.body);
      return res.status(200).json({ success: true, message: 'Cập nhật kho hàng thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async deactivateWarehouse(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await WarehouseService.deactivate(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async activateWarehouse(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await WarehouseService.activate(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }
}