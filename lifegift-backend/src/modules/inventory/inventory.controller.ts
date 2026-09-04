import { Request, Response } from 'express';
import { InventoryService } from './inventory.service';

export class InventoryController {
  public static async getAll(req: Request, res: Response) {
    try {
      const data = await InventoryService.getAll();
      return res.status(200).json({ success: true, message: 'Lấy danh sách tồn kho thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await InventoryService.getById(id);
      return res.status(200).json({ success: true, message: 'Lấy thông tin tồn kho thành công', data });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message, data: null });
    }
  }

  public static async getByWarehouse(req: Request, res: Response) {
    try {
      const warehouseId = Number(req.params.warehouseId);
      const data = await InventoryService.getByWarehouse(warehouseId);
      return res.status(200).json({ success: true, message: 'Lấy tồn kho theo kho thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async getByProduct(req: Request, res: Response) {
    try {
      const productId = Number(req.params.productId);
      const data = await InventoryService.getByProduct(productId);
      return res.status(200).json({ success: true, message: 'Lấy tồn kho theo sản phẩm thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const data = await InventoryService.create(req.body);
      return res.status(201).json({ success: true, message: 'Tạo bản ghi tồn kho thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await InventoryService.update(id, req.body);
      return res.status(200).json({ success: true, message: 'Cập nhật tồn kho thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await InventoryService.delete(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }
}