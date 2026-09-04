import prisma from '../../config/database';
import { CreateSupplierDto, SupplierResponse, SupplierStatus, UpdateSupplierDto } from './supplier.dto';

const getVietNamDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

export class SupplierService {
  private static mapToResponse(supplier: any): SupplierResponse {
    return {
      id: supplier.id.toString(),
      code: supplier.code,
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      taxCode: supplier.tax_code,
      status: supplier.status as SupplierStatus,
      createdAt: supplier.created_at,
      updatedAt: supplier.updated_at,
    };
  }

  public static async getAll(): Promise<SupplierResponse[]> {
    const suppliers = await prisma.suppliers.findMany({
      orderBy: { created_at: 'desc' },
    });
    return suppliers.map(this.mapToResponse);
  }

  public static async getById(id: number): Promise<SupplierResponse> {
    const supplier = await prisma.suppliers.findUnique({
      where: { id: BigInt(id) },
    });
    if (!supplier) throw new Error('Nhà cung cấp không tồn tại');
    return this.mapToResponse(supplier);
  }

  public static async create(data: CreateSupplierDto): Promise<SupplierResponse> {
    const existingCode = await prisma.suppliers.findUnique({
      where: { code: data.code },
    });
    if (existingCode) throw new Error('Mã nhà cung cấp đã tồn tại');

    const now = getVietNamDateTime();
    const created = await prisma.suppliers.create({
      data: {
        code: data.code,
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        tax_code: data.taxCode || null,
        status: data.status || SupplierStatus.ACTIVE,
        created_at: now,
        updated_at: now,
      },
    });

    return this.mapToResponse(created);
  }

  public static async update(id: number, data: UpdateSupplierDto): Promise<SupplierResponse> {
    const supplier = await prisma.suppliers.findUnique({
      where: { id: BigInt(id) },
    });
    if (!supplier) throw new Error('Nhà cung cấp không tồn tại');

    const now = getVietNamDateTime();
    const updated = await prisma.suppliers.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.taxCode !== undefined && { tax_code: data.taxCode }),
        ...(data.status && { status: data.status }),
        updated_at: now,
      },
    });

    return this.mapToResponse(updated);
  }

  public static async delete(id: number): Promise<void> {
    const supplierId = BigInt(id);

    const supplier = await prisma.suppliers.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new Error('Nhà cung cấp không tồn tại');

    // Kiểm tra ràng buộc xem nhà cung cấp đã được dùng trong Đơn nhập hàng chưa
    const poCount = await prisma.purchase_orders.count({
      where: { supplier_id: supplierId },
    });
    if (poCount > 0) {
      throw new Error('Không thể xóa nhà cung cấp đã có đơn nhập hàng phát sinh');
    }

    await prisma.suppliers.delete({
      where: { id: supplierId },
    });
  }
}