import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ChatService } from '../services/chat.service';
import { RedisChatService } from '../redisChat.service';

export class ChatController {
  public static async handleChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { message } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message là bắt buộc và phải là chuỗi.' });
      }

      let userIdNum: number | undefined = undefined;
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const secretKey = process.env.JWT_SECRET || 'your_default_jwt_secret';
          const decoded = jwt.verify(token, secretKey) as { id?: number; userId?: number; sub?: number };
          
          userIdNum = decoded.id || decoded.userId || (decoded.sub ? Number(decoded.sub) : undefined);
        } catch (jwtError) {
          console.warn('JWT Verification Warning:', (jwtError as Error).message);
        }
      }

      if (!userIdNum) {
        const rawId = (req as any).user?.id || req.body.userId;
        userIdNum = rawId ? Number(rawId) : undefined;
      }

      const targetSessionId = userIdNum ? String(userIdNum) : (req.body.sessionId || 'guest_session');
      const history = await RedisChatService.getHistory(targetSessionId);

      const result = await ChatService.processMessage(message, userIdNum, history, targetSessionId);

      const replyMessage = result.response || result.replyMessage || result.message || '';
      
      // Lấy danh sách sản phẩm trả về từ result (nếu có)
      const productsToStore = Array.isArray(result.products) ? result.products : (result.products?.products || []);

      if (replyMessage) {
        await RedisChatService.saveMessage(targetSessionId, 'user', message);
        await RedisChatService.saveMessage(targetSessionId, 'assistant', replyMessage, productsToStore);
      }

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}