import prisma from '../../config/database';
import { WarehouseDto, WarehouseResponse, WarehouseStatus } from './warehouse.dto';

const getVietNamDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

export class WarehouseService {
  private static mapToResponse(warehouse: any): WarehouseResponse {
    return {
      id: warehouse.id.toString(),
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address,
      status: warehouse.status,
      createdAt: warehouse.created_at,
      updatedAt: warehouse.updated_at,
    };
  }

  // 1. Lấy danh sách các kho đang hoạt động (ACTIVE)
  public static async getActiveWarehouses(): Promise<WarehouseResponse[]> {
    const warehouses = await prisma.warehouses.findMany({
      where: { status: WarehouseStatus.ACTIVE },
      orderBy: { name: 'asc' },
    });
    return warehouses.map((w) => this.mapToResponse(w));
  }

  // 2. Lấy thông tin chi tiết 1 kho theo ID
  public static async getById(id: number): Promise<WarehouseResponse> {
    const warehouse = await prisma.warehouses.findUnique({
      where: { id },
    });
    if (!warehouse) throw new Error('Không tìm thấy kho');
    return this.mapToResponse(warehouse);
  }

  // 3. Tạo kho hàng mới
  public static async create(data: WarehouseDto): Promise<WarehouseResponse> {
    const code = data.code.trim();

    const existingCode = await prisma.warehouses.findFirst({
      where: { code: { equals: code } },
    });
    if (existingCode) throw new Error('Mã kho đã tồn tại');

    const now = getVietNamDateTime();

    const created = await prisma.warehouses.create({
      data: {
        code,
        name: data.name.trim(),
        address: data.address || null,
        status: data.status || WarehouseStatus.ACTIVE,
        created_at: now,
        updated_at: now,
      },
    });

    return this.mapToResponse(created);
  }

  // 4. Cập nhật thông tin kho hàng
  public static async update(id: number, data: WarehouseDto): Promise<WarehouseResponse> {
    const warehouse = await prisma.warehouses.findUnique({ where: { id } });
    if (!warehouse) throw new Error('Không tìm thấy kho');

    const code = data.code.trim();

    if (warehouse.code.toLowerCase() !== code.toLowerCase()) {
      const existingCode = await prisma.warehouses.findFirst({
        where: { code: { equals: code } },
      });
      if (existingCode) throw new Error('Mã kho đã tồn tại');
    }

    const now = getVietNamDateTime();

    const updated = await prisma.warehouses.update({
      where: { id },
      data: {
        code,
        name: data.name.trim(),
        address: data.address || null,
        status: data.status || warehouse.status,
        updated_at: now,
      },
    });

    return this.mapToResponse(updated);
  }

  // 5. Vô hiệu hóa kho hàng (INACTIVE - Soft Delete)
  public static async deactivate(id: number): Promise<void> {
    const warehouse = await prisma.warehouses.findUnique({ where: { id } });
    if (!warehouse) throw new Error('Không tìm thấy kho');

    await prisma.warehouses.update({
      where: { id },
      data: {
        status: WarehouseStatus.INACTIVE,
        updated_at: getVietNamDateTime(),
      },
    });
  }

  // 6. Kích hoạt lại kho hàng (ACTIVE)
  public static async activate(id: number): Promise<void> {
    const warehouse = await prisma.warehouses.findUnique({ where: { id } });
    if (!warehouse) throw new Error('Không tìm thấy kho');

    await prisma.warehouses.update({
      where: { id },
      data: {
        status: WarehouseStatus.ACTIVE,
        updated_at: getVietNamDateTime(),
      },
    });
  }
}