import { Request, Response } from 'express';
import { BrandService } from './brand.service';

export class BrandController {
  public static async getBrands(req: Request, res: Response) {
    try {
      const data = await BrandService.getActiveBrands();
      return res.status(200).json({ success: true, message: 'Lấy danh sách thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async getBrand(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await BrandService.getById(id);
      return res.status(200).json({ success: true, message: 'Lấy thông tin thành công', data });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message, data: null });
    }
  }

  public static async createBrand(req: Request, res: Response) {
    try {
      const data = await BrandService.create(req.body);
      return res.status(201).json({ success: true, message: 'Tạo thương hiệu thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async updateBrand(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await BrandService.update(id, req.body);
      return res.status(200).json({ success: true, message: 'Cập nhật thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async deactivateBrand(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await BrandService.deactivate(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }
}