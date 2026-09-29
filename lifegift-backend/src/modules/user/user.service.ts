import prisma from '../../config/database';
import bcrypt from 'bcryptjs';
import { users_status } from '@prisma/client';
import { CreateAdminUserDto, UpdateAdminUserDto, UserResponse } from './user.dto';

export class UserService {
  // Chuyển đổi Model Prisma -> Response DTO
  private static toResponse(user: any): UserResponse {
    return {
      id: user.id.toString(),
      username: user.username,
      fullName: user.full_name,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      roles: user.user_roles ? user.user_roles.map((ur: any) => ur.roles.name) : [],
    };
  }

  // Lấy toàn bộ danh sách User
  public static async getAll(): Promise<UserResponse[]> {
    const users = await prisma.users.findMany({
      include: {
        user_roles: {
          include: {
            roles: true,
          },
        },
      },
    });

    return users.map((user) => this.toResponse(user));
  }

  // Lấy User theo ID
  public static async getById(id: number | bigint): Promise<UserResponse> {
    const user = await prisma.users.findUnique({
      where: { id: BigInt(id) },
      include: {
        user_roles: {
          include: {
            roles: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(`Không tìm thấy người dùng: ${id}`);
    }

    return this.toResponse(user);
  }

  public static async createAdminUser(data: CreateAdminUserDto): Promise<UserResponse> {
    const username = data.username.trim();
    if (await prisma.users.findUnique({ where: { username } })) throw new Error('Tên đăng nhập đã tồn tại');
    if (data.email && (await prisma.users.findUnique({ where: { email: data.email.trim() } })))
      throw new Error('Email đã được sử dụng');
    if (data.phone && (await prisma.users.findUnique({ where: { phone: data.phone.trim() } })))
      throw new Error('Số điện thoại đã được sử dụng');

    const role = await prisma.roles.findUnique({ where: { name: data.role } });
    if (!role) throw new Error(`Role ${data.role} chưa được cấu hình trong database`);
    const password = await bcrypt.hash(data.password, 10);
    const now = new Date();

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.users.create({
        data: {
          username,
          password,
          full_name: data.fullName.trim(),
          phone: data.phone?.trim() || null,
          email: data.email?.trim() || null,
          status: users_status.ACTIVE,
          created_at: now,
          updated_at: now,
        },
      });
      await tx.user_roles.create({ data: { user_id: created.id, role_id: role.id } });
      return tx.users.findUnique({
        where: { id: created.id },
        include: { user_roles: { include: { roles: true } } },
      });
    });

    if (!user) throw new Error('Không thể tạo tài khoản');
    return this.toResponse(user);
  }

  public static async updateAdminUser(
    id: string,
    data: UpdateAdminUserDto,
    actorId: string,
  ): Promise<UserResponse> {
    const userId = BigInt(id);
    const current = await prisma.users.findUnique({
      where: { id: userId },
      include: { user_roles: { include: { roles: true } } },
    });
    if (!current) throw new Error('Không tìm thấy người dùng');

    if (data.email && data.email.trim() !== current.email) {
      const duplicate = await prisma.users.findUnique({ where: { email: data.email.trim() } });
      if (duplicate) throw new Error('Email đã được sử dụng');
    }
    if (data.phone && data.phone.trim() !== current.phone) {
      const duplicate = await prisma.users.findUnique({ where: { phone: data.phone.trim() } });
      if (duplicate) throw new Error('Số điện thoại đã được sử dụng');
    }

    const currentRole = current.user_roles[0]?.roles.name;
    const nextRole = data.role || currentRole;
    const nextStatus = data.status as users_status | undefined;
    const selfUpdate = current.id.toString() === actorId;
    if (selfUpdate && (nextRole !== 'ADMIN' || (nextStatus && nextStatus !== users_status.ACTIVE)))
      throw new Error('Không thể tự hạ quyền hoặc khóa tài khoản đang đăng nhập');

    const isAdmin = current.user_roles.some((userRole) => userRole.roles.name === 'ADMIN');
    const willLoseAdmin = isAdmin && (nextRole !== 'ADMIN' || nextStatus !== undefined && nextStatus !== users_status.ACTIVE);
    if (willLoseAdmin) {
      const activeAdmins = await prisma.users.count({
        where: { status: users_status.ACTIVE, user_roles: { some: { roles: { name: 'ADMIN' } } } },
      });
      if (activeAdmins <= 1) throw new Error('Không thể khóa hoặc hạ quyền quản trị viên cuối cùng');
    }

    const role = data.role ? await prisma.roles.findUnique({ where: { name: data.role } }) : null;
    if (data.role && !role) throw new Error(`Role ${data.role} chưa được cấu hình trong database`);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: userId },
        data: {
          ...(data.fullName !== undefined ? { full_name: data.fullName.trim() } : {}),
          ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
          ...(data.email !== undefined ? { email: data.email?.trim() || null } : {}),
          ...(nextStatus ? { status: nextStatus } : {}),
          updated_at: new Date(),
        },
      });
      if (role) {
        await tx.user_roles.deleteMany({ where: { user_id: userId } });
        await tx.user_roles.create({ data: { user_id: userId, role_id: role.id } });
      }
      return tx.users.findUnique({
        where: { id: userId },
        include: { user_roles: { include: { roles: true } } },
      });
    });

    if (!updated) throw new Error('Không thể cập nhật người dùng');
    return this.toResponse(updated);
  }

  public static async deactivateAdminUser(id: string, actorId: string): Promise<UserResponse> {
    return this.updateAdminUser(id, { status: users_status.INACTIVE }, actorId);
  }
}