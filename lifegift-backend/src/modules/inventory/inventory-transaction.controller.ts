import { Request, Response } from 'express';
import { InventoryTransactionService } from './inventory-transaction.service';

export class InventoryTransactionController {
  public static async getAll(req: Request, res: Response) {
    try {
      const data = await InventoryTransactionService.getAll();
      return res.status(200).json({ success: true, message: 'Lấy danh sách giao dịch kho thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await InventoryTransactionService.getById(id);
      return res.status(200).json({ success: true, message: 'Lấy thông tin giao dịch kho thành công', data });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message, data: null });
    }
  }

  public static async getByInventory(req: Request, res: Response) {
    try {
      const inventoryId = Number(req.params.inventoryId);
      const data = await InventoryTransactionService.getByInventory(inventoryId);
      return res.status(200).json({ success: true, message: 'Lấy lịch sử giao dịch theo kho thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const data = await InventoryTransactionService.create(req.body, userId);
      return res.status(201).json({ success: true, message: 'Tạo giao dịch kho thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await InventoryTransactionService.update(id, req.body);
      return res.status(200).json({ success: true, message: 'Cập nhật giao dịch kho thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await InventoryTransactionService.delete(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }
}