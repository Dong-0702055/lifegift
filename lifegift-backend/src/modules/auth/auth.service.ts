import prisma from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
} from './auth.dto';

export class AuthService {
  private static getVietNamDateTime(): Date {
    const now = new Date();
    return new Date(now.getTime() + 7 * 60 * 60 * 1000);
  }

  private static generateAccessToken(payload: { id: string; username: string; roles: string[] }): string {
    const secret = process.env.JWT_SECRET || 'secret';
    const options: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, secret, options);
  }

  private static generateRefreshToken(payload: { id: string; username: string }): string {
    const secret = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
    const options: SignOptions = {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, secret, options);
  }

  // Helper tính thời gian hết hạn của Refresh Token (mặc định 7 ngày)
  private static getRefreshTokenExpiryDate(): Date {
    const now = this.getVietNamDateTime();
    now.setDate(now.getDate() + 7);
    return now;
  }

  // 1. Đăng ký tài khoản
  public static async register(data: RegisterRequest): Promise<RegisterResponse> {
    const existingUsername = await prisma.users.findUnique({
      where: { username: data.username },
    });
    if (existingUsername) throw new Error('Username đã tồn tại');

    if (data.email) {
      const existingEmail = await prisma.users.findFirst({
        where: { email: data.email },
      });
      if (existingEmail) throw new Error('Email đã được sử dụng');
    }

    if (data.phone) {
      const existingPhone = await prisma.users.findFirst({
        where: { phone: data.phone },
      });
      if (existingPhone) throw new Error('Số điện thoại đã được sử dụng');
    }

    const customerRole = await prisma.roles.findFirst({
      where: { name: 'CUSTOMER' },
    });
    if (!customerRole) throw new Error('Role CUSTOMER chưa tồn tại');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const nowLocal = this.getVietNamDateTime();

    const savedUser = await prisma.$transaction(async (tx) => {
      const newUser = await tx.users.create({
        data: {
          username: data.username,
          password: hashedPassword,
          full_name: data.fullName,
          phone: data.phone,
          email: data.email || null,
          status: 'ACTIVE',
          created_at: nowLocal,
          updated_at: nowLocal,
        },
      });

      await tx.user_roles.create({
        data: {
          user_id: newUser.id,
          role_id: customerRole.id,
        },
      });

      return newUser;
    });

    return {
      id: savedUser.id.toString(),
      username: savedUser.username,
      fullName: savedUser.full_name,
      phone: savedUser.phone,
      email: savedUser.email,
      status: savedUser.status,
      createdAt: savedUser.created_at,
    };
  }

  // 2. Đăng nhập
  // 2. Đăng nhập
public static async login(data: LoginRequest): Promise<LoginResponse> {
  const user = await prisma.users.findUnique({
    where: { username: data.username },
    include: {
      user_roles: {
        include: {
          roles: true,
        },
      },
    },
  });

  if (!user) throw new Error('Username hoặc password không chính xác');
  if (user.status !== 'ACTIVE') throw new Error('Tài khoản đang bị khóa hoặc không hoạt động');

  const isPasswordMatch = await bcrypt.compare(data.password, user.password);
  if (!isPasswordMatch) throw new Error('Username hoặc password không chính xác');

  // --- KIỂM TRA GIỚI HẠN PHIÊN ĐĂNG NHẬP ---
  const activeSessionsCount = await prisma.user_refresh_tokens.count({
    where: { user_id: user.id },
  });

  if (activeSessionsCount >= 5) {
    throw new Error('Tài khoản đã đăng nhập quá nhiều nơi. Vui lòng đăng xuất ở thiết bị khác trước khi tiếp tục.');
  }
  // ----------------------------------------

  const roles = user.user_roles.map((ur) => ur.roles.name);
  const payload = { id: user.id.toString(), username: user.username, roles };

  const accessToken = this.generateAccessToken(payload);
  const refreshToken = this.generateRefreshToken({ id: payload.id, username: payload.username });

  // Lưu Refresh Token vào bảng user_refresh_tokens
  await prisma.user_refresh_tokens.create({
    data: {
      user_id: user.id,
      refresh_token: refreshToken,
      expires_at: this.getRefreshTokenExpiryDate(),
      created_at: this.getVietNamDateTime(),
    },
  });

  return {
    id: user.id.toString(),
    username: user.username,
    fullName: user.full_name,
    phone: user.phone,
    email: user.email,
    status: user.status,
    roles: roles,
    accessToken,
    refreshToken,
  };
}

  // 3. Làm mới Access Token bằng Refresh Token
  public static async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
    let userId: bigint;

    try {
      const decoded: any = jwt.verify(data.refreshToken, refreshSecret);
      if (!decoded || !decoded.id) throw new Error();
      userId = BigInt(decoded.id);
    } catch (err) {
      throw new Error('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    // Kiểm tra token có tồn tại trong Database hay không
    const storedToken = await prisma.user_refresh_tokens.findUnique({
      where: { refresh_token: data.refreshToken },
    });

    if (!storedToken) {
      throw new Error('Refresh token không tồn tại hoặc đã bị đăng xuất');
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_roles: {
          include: {
            roles: true,
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new Error('Người dùng không tồn tại hoặc tài khoản bị khóa');
    }

    const roles = user.user_roles.map((ur) => ur.roles.name);
    const payload = { id: user.id.toString(), username: user.username, roles };

    const newAccessToken = this.generateAccessToken(payload);
    const newRefreshToken = this.generateRefreshToken({ id: payload.id, username: payload.username });

    // Cập nhật token mới vào DB (Xóa token cũ, lưu token mới - Refresh Token Rotation)
    await prisma.$transaction([
      prisma.user_refresh_tokens.delete({
        where: { id: storedToken.id },
      }),
      prisma.user_refresh_tokens.create({
        data: {
          user_id: user.id,
          refresh_token: newRefreshToken,
          expires_at: this.getRefreshTokenExpiryDate(),
          created_at: this.getVietNamDateTime(),
        },
      }),
    ]);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // 4. Đăng xuất
  public static async logout(data: LogoutRequest): Promise<void> {
    try {
      // Xóa token tương ứng trong database
      await prisma.user_refresh_tokens.deleteMany({
        where: { refresh_token: data.refreshToken },
      });
    } catch (err) {
      return;
    }
  }
}