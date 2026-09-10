import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ChatService } from '../services/chat.service';

export class ChatController {
  public static async handleChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { message } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message là bắt buộc và phải là chuỗi.' });
      }

      // 1. Lấy userId từ JWT Bearer Token trong Header
      let userId: number | undefined = undefined;
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const secretKey = process.env.JWT_SECRET || 'your_default_jwt_secret';
          const decoded = jwt.verify(token, secretKey) as { id?: number; userId?: number; sub?: number };
          
          // Trích xuất ID người dùng tùy thuộc vào cách bạn payload token khi login
          userId = decoded.id || decoded.userId || (decoded.sub ? Number(decoded.sub) : undefined);
        } catch (jwtError) {
          // Token hết hạn hoặc không hợp lệ -> để userId = undefined
          console.warn('JWT Verification Warning:', (jwtError as Error).message);
        }
      }

      // 2. Nếu không có Token, fallback lấy userId từ req.user (nếu dùng Passport middleware) hoặc req.body
      if (!userId) {
        userId = (req as any).user?.id || req.body.userId;
      }

      // 3. Truyền message và userId đã giải mã vào ChatService
      const result = await ChatService.processMessage(message, userId);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}