import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';

export class UserController {
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