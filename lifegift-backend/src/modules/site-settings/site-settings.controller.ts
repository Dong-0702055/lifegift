import { Request, Response } from 'express';
import { SiteSettingsService } from './site-settings.service';

export class SiteSettingsController {
  public static async get(req: Request, res: Response) {
    try {
      const data = await SiteSettingsService.get();
      return res.status(200).json({ success: true, message: 'Lấy cấu hình cửa hàng thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const data = await SiteSettingsService.update(req.body);
      return res.status(200).json({ success: true, message: 'Cập nhật cấu hình cửa hàng thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }
}