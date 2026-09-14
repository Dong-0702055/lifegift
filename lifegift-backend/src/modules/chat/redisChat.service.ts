import redis from '../../config/redisClient';

export interface ChatMessageItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
  products?: any[]; // Danh sách sản phẩm được trả về từ tin nhắn trước
}

const MAX_HISTORY_SIZE = 50;
const SESSION_TIMEOUT_SECONDS = 30 * 60;

export class RedisChatService {
  static async getHistory(userId: string): Promise<ChatMessageItem[]> {
    const key = `chat:history:${userId}`;
    const rawHistory = await redis.lrange(key, 0, -1);
    return rawHistory.map((item) => JSON.parse(item) as ChatMessageItem);
  }

  static async saveMessage(
    userId: string,
    role: 'user' | 'assistant',
    content: string,
    products?: any[]
  ): Promise<void> {
    const key = `chat:history:${userId}`;
    const messageData: ChatMessageItem = { role, content, products };

    await redis.rpush(key, JSON.stringify(messageData));
    await redis.ltrim(key, -MAX_HISTORY_SIZE, -1);
    await redis.expire(key, SESSION_TIMEOUT_SECONDS);
  }

  static async clearHistory(userId: string): Promise<void> {
    const key = `chat:history:${userId}`;
    await redis.del(key);
  }
}