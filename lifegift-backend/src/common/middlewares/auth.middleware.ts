import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { JwtService } from '../utils/jwt.util';

// 1. Filter xác thực Token (tương đương JwtAuthenticationFilter)
export const authenticateJwt = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Không có token -> Cho qua để Route handler hoặc middleware phân quyền xử lý
  }

  const token = authHeader.substring(7);

  try {
    const decoded = JwtService.verifyToken(token) as any;
const username = decoded?.username || decoded?.sub;

    if (username) {
      // Truy vấn user kèm bảng trung gian user_roles và bảng roles
      const user = await prisma.users.findUnique({
        where: { username },
        include: {
          user_roles: {
            include: {
              roles: true,
            },
          },
        },
      });

      if (user && user.status === 'ACTIVE') {
        // Trích xuất mảng tên role từ mối quan hệ nhiều-nhiều
        const roles = user.user_roles.map((ur) => ur.roles.name);

        req.user = {
          id: user.id,
          username: user.username,
          roles: roles,
          status: user.status,
        };
      }
    }
  } catch (error) {
    // Token hết hạn hoặc không hợp lệ -> Không gán req.user
  }

  next();
};

// 2. Middleware yêu cầu đăng nhập (tương đương authenticated())
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Access token is missing or invalid',
      data: null,
    });
  }
  next();
};

// 3. Middleware kiểm tra Role (tương đương hasRole / hasAnyRole)
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required',
        data: null,
      });
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to perform this action',
        data: null,
      });
    }

    next();
  };
};