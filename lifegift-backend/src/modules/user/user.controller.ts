import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';

export class UserController {
  public static async createAdminUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.createAdminUser(req.body);
      return res.status(201).json({ success: true, message: 'Tạo tài khoản thành công', data: user });
    } catch (error) {
      next(error);
    }
  }

  public static async updateAdminUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.updateAdminUser(
        String(req.params.id),
        req.body,
        String((req as any).user.id),
      );
      return res.status(200).json({ success: true, message: 'Cập nhật tài khoản thành công', data: user });
    } catch (error) {
      next(error);
    }
  }

  public static async deactivateAdminUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.deactivateAdminUser(String(req.params.id), String((req as any).user.id));
      return res.status(200).json({ success: true, message: 'Đã khóa tài khoản', data: user });
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserService.getAll();
      return res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const user = await UserService.getById(id);
      return res.status(200).json(user);
    } catch (error: any) {
      return res.status(404).json({
        message: error.message || 'Resource not found',
      });
    }
  }
}