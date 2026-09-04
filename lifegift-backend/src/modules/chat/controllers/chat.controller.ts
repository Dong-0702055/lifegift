// import { Request, Response, NextFunction } from 'express';
// import { PrismaClient } from '@prisma/client';
// import { AliasResolverService } from '../services/aliasResolver.service';

// const prisma = new PrismaClient();
// const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

// const serializeData = (data: any) => {
//   return JSON.parse(
//     JSON.stringify(data, (_, value) =>
//       typeof value === 'bigint' ? value.toString() : value
//     )
//   );
// };

// export class ChatController {
//   public static async handleChat(req: Request, res: Response, next: NextFunction) {
//     try {
//       const { message } = req.body;

//       if (!message || typeof message !== 'string') {
//         return res.status(400).json({ error: 'Message là bắt buộc và phải là chuỗi.' });
//       }

//       // 1. Gọi Python AI Service bằng fetch
//       let intent = 'fallback';
//       let confidence = 0;

//       try {
//         const response = await fetch(`${AI_SERVICE_URL}/predict-intent`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ text: message }),
//         });

//         if (response.ok) {
//           const aiData: any = await response.json();
//           intent = aiData.intent;
//           confidence = aiData.confidence;
//         }
//       } catch (aiError) {
//         console.error('Lỗi kết nối AI Service:', aiError);
//       }

//       // 2. Bóc tách Entity & Alias từ câu văn bản
//       const entities = await AliasResolverService.resolveEntities(message);

//       let replyMessage = '';
//       let productsData: any[] = [];

//       // 3. Logic theo Intent
//       switch (intent) {
//         case 'kiem_tra_ton_kho':
//           if (entities.productId) {
//             const product = await prisma.products.findUnique({
//               where: { id: entities.productId },
//               include: { inventories: true },
//             });

//             const totalStock = product?.inventories?.reduce((acc, inv) => acc + inv.quantity, 0) || 0;
//             replyMessage = totalStock > 0 
//               ? `Sản phẩm ${product?.name} hiện còn hàng (${totalStock} sản phẩm).`
//               : `Rất tiếc, sản phẩm ${product?.name} hiện tại đã hết hàng.`;
//             productsData = product ? [product] : [];
//           } else if (entities.categoryId || entities.brandId) {
//             productsData = await prisma.products.findMany({
//               where: {
//                 ...(entities.categoryId && { category_id: entities.categoryId }),
//                 ...(entities.brandId && { brand_id: entities.brandId }),
//               },
//               include: { inventories: true },
//               take: 5,
//             });

//             if (productsData.length > 0) {
//               replyMessage = `Dạ shop vẫn còn hàng ạ! Dưới đây là các sản phẩm phù hợp với yêu cầu:`;
//             } else {
//               replyMessage = `Hiện tại các sản phẩm thuộc tiêu chí này đã hết hàng.`;
//             }
//           } else {
//             replyMessage = 'Bạn muốn kiểm tra tồn kho của sản phẩm hoặc loại mặt hàng nào ạ?';
//           }
//           break;

//         case 'tim_kiem_san_pham':
//         case 'chi_tiet_san_pham':
//           if (entities.productId) {
//             const product = await prisma.products.findUnique({
//               where: { id: entities.productId },
//               include: { inventories: true },
//             });
//             productsData = product ? [product] : [];
//             replyMessage = product ? `Thông tin sản phẩm ${product.name}:` : 'Không tìm thấy sản phẩm.';
//           } else if (entities.brandId || entities.categoryId) {
//             productsData = await prisma.products.findMany({
//               where: {
//                 ...(entities.brandId && { brand_id: entities.brandId }),
//                 ...(entities.categoryId && { category_id: entities.categoryId }),
//               },
//               include: { inventories: true },
//               take: 5,
//             });
//             replyMessage = productsData.length > 0
//               ? `Dưới đây là danh sách sản phẩm gợi ý:`
//               : `Rất tiếc, shop chưa có sản phẩm phù hợp với yêu cầu này.`;
//           } else {
//             productsData = await prisma.products.findMany({ 
//               take: 5,
//               include: { inventories: true }
//             });
//             replyMessage = 'Dưới đây là các sản phẩm nổi bật tại shop:';
//           }
//           break;

//         case 'tim_san_pham_theo_gia':
//           if (entities.extractedPrice) {
//             const minPrice = entities.extractedPrice * 0.8;
//             const maxPrice = entities.extractedPrice * 1.2;

//             productsData = await prisma.products.findMany({
//               where: {
//                 ...(entities.categoryId && { category_id: entities.categoryId }),
//                 ...(entities.brandId && { brand_id: entities.brandId }),
//                 price: { gte: minPrice, lte: maxPrice },
//               },
//               include: { inventories: true },
//               take: 5,
//             });

//             replyMessage = productsData.length > 0
//               ? `Shop tìm thấy ${productsData.length} sản phẩm tầm giá ${entities.extractedPrice.toLocaleString('vi-VN')}đ phù hợp:`
//               : `Hiện tại shop không có sản phẩm nào trong tầm giá khoảng ${entities.extractedPrice.toLocaleString('vi-VN')}đ.`;
//           } else {
//             replyMessage = 'Bạn muốn tìm sản phẩm trong khoảng giá bao nhiêu ạ?';
//           }
//           break;

//         default:
//           // Xử lý an toàn: Nếu nhận diện được Thương hiệu hoặc Danh mục nhưng Intent rơi vào Fallback
//           if (entities.brandId || entities.categoryId) {
//             productsData = await prisma.products.findMany({
//               where: {
//                 ...(entities.brandId && { brand_id: entities.brandId }),
//                 ...(entities.categoryId && { category_id: entities.categoryId }),
//               },
//               include: { inventories: true },
//               take: 5,
//             });

//             if (productsData.length > 0) {
//               replyMessage = `Shop tìm thấy các sản phẩm phù hợp dành cho bạn:`;
//               break;
//             }
//           }
//           replyMessage = `
//                     Cảm ơn bạn đã ghé thăm LifeGift! 🌿
//                     Shop chuyên cung cấp các sản phẩm nông sản và đặc sản Việt Nam chất lượng,
//                     nguồn gốc rõ ràng, giá cả hợp lý và giao hàng trên toàn quốc.
//                     Bạn đang tìm sản phẩm gì hoặc cần shop tư vấn theo nhu cầu
//                     và ngân sách của mình ạ? 😊
//                 `;
//           break;
//       }

//       return res.status(200).json(
//         serializeData({
//           message,
//           intent: { name: intent, confidence },
//           entities,
//           products: productsData,
//           response: replyMessage,
//         })
//       );
//     } catch (error) {
//       next(error);
//     }
//   }
// }
// src/controllers/chat.controller.ts
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