import { Request, Response } from 'express';
import { AgencyLeadService } from './agency-lead.service';

export class AgencyLeadController {
  public static async create(req: Request, res: Response) {
    try {
      const data = await AgencyLeadService.create(req.body);
      return res.status(201).json({ success: true, message: 'Đã nhận đăng ký đại lý', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async getAll(req: Request, res: Response) {
    try {
      const data = await AgencyLeadService.getAll();
      return res.status(200).json({ success: true, message: 'Lấy danh sách đăng ký đại lý thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async updateStatus(req: Request, res: Response) {
    try {
      const data = await AgencyLeadService.updateStatus(String(req.params.id), req.body);
      return res.status(200).json({ success: true, message: 'Cập nhật trạng thái đại lý thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }
}