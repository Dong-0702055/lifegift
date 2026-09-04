import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      return res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công',
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Đăng ký thất bại',
      });
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Đăng nhập thất bại',
      });
    }
  }

  public static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.refreshToken(req.body);
      return res.status(200).json({
        success: true,
        message: 'Cấp lại token thành công',
        data: result,
      });
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Refresh token không hợp lệ',
      });
    }
  }
  public static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await AuthService.logout(req.body);
      return res.status(200).json({
        success: true,
        message: 'Đăng xuất thành công',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Đăng xuất thất bại',
      });
    }
  }
}