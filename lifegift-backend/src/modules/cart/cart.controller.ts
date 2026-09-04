import { Request, Response } from 'express';
import { CartService } from './cart.service';

export class CartController {
  public static async getMyCart(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data = await CartService.getMyCart(userId);
      return res.status(200).json({ success: true, message: 'Lấy thông tin giỏ hàng thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async addItem(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data = await CartService.addItem(userId, req.body);
      return res.status(200).json({ success: true, message: 'Thêm sản phẩm vào giỏ hàng thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async updateItem(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const cartItemId = Number(req.params.cartItemId);
      const data = await CartService.updateItem(userId, cartItemId, req.body);
      return res.status(200).json({ success: true, message: 'Cập nhật số lượng sản phẩm thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async removeItem(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const cartItemId = Number(req.params.cartItemId);
      const data = await CartService.removeItem(userId, cartItemId);
      return res.status(200).json({ success: true, message: 'Xóa sản phẩm khỏi giỏ hàng thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async clearCart(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      await CartService.clearCart(userId);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }
}