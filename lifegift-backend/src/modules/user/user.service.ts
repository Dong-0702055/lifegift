import prisma from '../../config/database';
import { UserResponse } from './user.dto';

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
}