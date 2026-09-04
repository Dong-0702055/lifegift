import prisma from '../../config/database';
import { InventoryRequestDto, InventoryResponse } from './inventory.dto';

const getVietNamDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

export class InventoryService {
  private static mapToResponse(inv: any): InventoryResponse {
    const qty = inv.quantity ?? 0;
    const reserved = inv.reserved_quantity ?? 0;
    const available = Math.max(qty - reserved, 0);
    const min = inv.min_stock ?? 0;

    return {
      id: inv.id.toString(),
      warehouseId: inv.warehouse_id.toString(),
      warehouseCode: inv.warehouses?.code || '',
      warehouseName: inv.warehouses?.name || '',
      productId: inv.product_id.toString(),
      productSku: inv.products?.sku || '',
      productName: inv.products?.name || '',
      quantity: qty,
      reservedQuantity: reserved,
      availableQuantity: available,
      minStock: min,
      lowStock: qty <= min,
      updatedAt: inv.updated_at,
    };
  }

  public static async getAll(): Promise<InventoryResponse[]> {
    const list = await prisma.inventories.findMany({
      include: { warehouses: true, products: true },
    });
    return list.map((inv) => this.mapToResponse(inv));
  }

  public static async getById(id: number): Promise<InventoryResponse> {
    const inv = await prisma.inventories.findUnique({
      where: { id },
      include: { warehouses: true, products: true },
    });
    if (!inv) throw new Error('Inventory không tồn tại');
    return this.mapToResponse(inv);
  }

  public static async getByWarehouse(warehouseId: number): Promise<InventoryResponse[]> {
    const exists = await prisma.warehouses.findUnique({ where: { id: BigInt(warehouseId) } });
    if (!exists) throw new Error('Warehouse không tồn tại');

    const list = await prisma.inventories.findMany({
      where: { warehouse_id: BigInt(warehouseId) },
      include: { warehouses: true, products: true },
    });
    return list.map((inv) => this.mapToResponse(inv));
  }

  public static async getByProduct(productId: number): Promise<InventoryResponse[]> {
    const exists = await prisma.products.findUnique({ where: { id: BigInt(productId) } });
    if (!exists) throw new Error('Product không tồn tại');

    const list = await prisma.inventories.findMany({
      where: { product_id: BigInt(productId) },
      include: { warehouses: true, products: true },
    });
    return list.map((inv) => this.mapToResponse(inv));
  }

  public static async create(data: InventoryRequestDto): Promise<InventoryResponse> {
    if (data.quantity < 0) throw new Error('Số lượng tồn kho không được âm');
    if (data.minStock < 0) throw new Error('Mức tồn tối thiểu không được âm');

    const warehouseId = BigInt(data.warehouseId);
    const productId = BigInt(data.productId);

    const warehouse = await prisma.warehouses.findUnique({ where: { id: warehouseId } });
    if (!warehouse) throw new Error('Warehouse không tồn tại');

    const product = await prisma.products.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product không tồn tại');

    const existing = await prisma.inventories.findFirst({
      where: { warehouse_id: warehouseId, product_id: productId },
    });
    if (existing) throw new Error('Sản phẩm đã tồn tại trong warehouse này');

    const now = getVietNamDateTime();
    const available = Math.max(data.quantity - 0, 0);

    const created = await prisma.inventories.create({
      data: {
        warehouse_id: warehouseId,
        product_id: productId,
        quantity: data.quantity,
        reserved_quantity: 0,
        available_quantity: available,
        min_stock: data.minStock,
        updated_at: now,
      },
      include: { warehouses: true, products: true },
    });

    return this.mapToResponse(created);
  }

  public static async update(id: number, data: InventoryRequestDto): Promise<InventoryResponse> {
    const inv = await prisma.inventories.findUnique({ where: { id } });
    if (!inv) throw new Error('Inventory không tồn tại');

    const warehouseId = BigInt(data.warehouseId);
    const productId = BigInt(data.productId);

    const warehouse = await prisma.warehouses.findUnique({ where: { id: warehouseId } });
    if (!warehouse) throw new Error('Warehouse không tồn tại');

    const product = await prisma.products.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product không tồn tại');

    const existing = await prisma.inventories.findFirst({
      where: { warehouse_id: warehouseId, product_id: productId },
    });
    if (existing && Number(existing.id) !== id) {
      throw new Error('Sản phẩm đã tồn tại trong warehouse này');
    }

    if (data.quantity < 0) throw new Error('Số lượng tồn kho không được âm');
    if (data.minStock < 0) throw new Error('Mức tồn tối thiểu không được âm');

    const reserved = inv.reserved_quantity ?? 0;
    if (data.quantity < reserved) {
      throw new Error(`Số lượng tồn kho không được nhỏ hơn số lượng đã giữ. Reserved hiện tại: ${reserved}`);
    }

    const available = Math.max(data.quantity - reserved, 0);
    const now = getVietNamDateTime();

    const updated = await prisma.inventories.update({
      where: { id },
      data: {
        warehouse_id: warehouseId,
        product_id: productId,
        quantity: data.quantity,
        available_quantity: available,
        min_stock: data.minStock,
        updated_at: now,
      },
      include: { warehouses: true, products: true },
    });

    return this.mapToResponse(updated);
  }

  public static async delete(id: number): Promise<void> {
    const inv = await prisma.inventories.findUnique({ where: { id } });
    if (!inv) throw new Error('Inventory không tồn tại');

    await prisma.inventories.delete({ where: { id } });
  }
}