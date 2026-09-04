import prisma from '../../config/database';
import { InventoryTransactionType } from '../inventory/inventory-transaction.dto';
import {
  CreatePurchaseOrderDto,
  PurchaseOrderResponse,
  PurchaseOrderStatus,
  UpdatePurchaseOrderStatusDto,
} from './purchase.dto';

const getVietNamDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

export class PurchaseOrderService {
  private static generatePurchaseCode(): string {
    const timestamp = Date.now();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `PO-${timestamp}-${random}`;
  }

  private static mapToResponse(po: any): PurchaseOrderResponse {
    return {
      id: po.id.toString(),
      purchaseCode: po.purchase_code,
      supplierId: po.supplier_id.toString(),
      warehouseId: po.warehouse_id.toString(),
      totalAmount: Number(po.total_amount),
      status: po.status as PurchaseOrderStatus,
      orderedAt: po.ordered_at,
      expectedAt: po.expected_at,
      createdAt: po.created_at,
      updatedAt: po.updated_at,
      items: (po.purchase_order_items || []).map((item: any) => ({
        id: item.id.toString(),
        productId: item.product_id.toString(),
        productSku: item.products?.sku || '',
        productName: item.products?.name || '',
        quantity: item.quantity,
        unitCost: Number(item.unit_cost),
        subtotal: Number(item.subtotal),
      })),
    };
  }

  public static async getAll(): Promise<PurchaseOrderResponse[]> {
    const orders = await prisma.purchase_orders.findMany({
      include: {
        purchase_order_items: {
          include: { products: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    return orders.map(this.mapToResponse);
  }

  public static async getById(id: number): Promise<PurchaseOrderResponse> {
    const po = await prisma.purchase_orders.findUnique({
      where: { id: BigInt(id) },
      include: {
        purchase_order_items: {
          include: { products: true },
        },
      },
    });
    if (!po) throw new Error('Đơn nhập hàng không tồn tại');
    return this.mapToResponse(po);
  }

  public static async create(data: CreatePurchaseOrderDto): Promise<PurchaseOrderResponse> {
    const supplierId = BigInt(data.supplierId);
    const warehouseId = BigInt(data.warehouseId);

    const supplier = await prisma.suppliers.findUnique({ where: { id: supplierId } });
    if (!supplier) throw new Error('Nhà cung cấp không tồn tại');

    const warehouse = await prisma.warehouses.findUnique({ where: { id: warehouseId } });
    if (!warehouse) throw new Error('Kho hàng không tồn tại');
    // ktra xem san pham co ton tai trong he thong hay khong
    for (const item of data.items) {
    const productExists = await prisma.products.findUnique({
        where: { id: BigInt(item.productId) },
    });
    if (!productExists) {
        throw new Error(`Sản phẩm với ID ${item.productId} không tồn tại trong hệ thống`);
    }
    }

    let calculatedTotal = 0;
    const itemsData = data.items.map((item) => {
      const subtotal = item.quantity * item.unitCost;
      calculatedTotal += subtotal;
      return {
        product_id: BigInt(item.productId),
        quantity: item.quantity,
        unit_cost: item.unitCost,
        subtotal: subtotal,
      };
    });

    const now = getVietNamDateTime();
    const purchaseCode = this.generatePurchaseCode();

    const created = await prisma.purchase_orders.create({
      data: {
        purchase_code: purchaseCode,
        supplier_id: supplierId,
        warehouse_id: warehouseId,
        total_amount: calculatedTotal,
        status: PurchaseOrderStatus.DRAFT,
        ordered_at: data.orderedAt ? new Date(data.orderedAt) : null,
        expected_at: data.expectedAt ? new Date(data.expectedAt) : null,
        created_at: now,
        updated_at: now,
        purchase_order_items: {
          create: itemsData,
        },
      },
      include: {
        purchase_order_items: {
          include: { products: true },
        },
      },
    });

    return this.mapToResponse(created);
  }

  public static async updateStatus(
    id: number,
    data: UpdatePurchaseOrderStatusDto,
    userId?: number
  ): Promise<PurchaseOrderResponse> {
    return await prisma.$transaction(async (txPrisma) => {
      const po = await txPrisma.purchase_orders.findUnique({
        where: { id: BigInt(id) },
        include: { purchase_order_items: true },
      });

      if (!po) throw new Error('Đơn nhập hàng không tồn tại');

      if (po.status === PurchaseOrderStatus.RECEIVED) {
        throw new Error('Đơn nhập hàng đã hoàn thành, không thể thay đổi trạng thái');
      }

      if (po.status === PurchaseOrderStatus.CANCELLED) {
        throw new Error('Đơn nhập hàng đã bị hủy, không thể thay đổi trạng thái');
      }

      const now = getVietNamDateTime();

      // Trường hợp chuyển trạng thái thành RECEIVED -> Tiến hành cộng kho & ghi log giao dịch
      if (data.status === PurchaseOrderStatus.RECEIVED) {
        for (const item of po.purchase_order_items) {
          let inventory = await txPrisma.inventories.findFirst({
            where: {
              warehouse_id: po.warehouse_id,
              product_id: item.product_id,
            },
          });

          if (!inventory) {
            inventory = await txPrisma.inventories.create({
              data: {
                warehouse_id: po.warehouse_id,
                product_id: item.product_id,
                quantity: 0,
                reserved_quantity: 0,
                available_quantity: 0,
                min_stock: 0,
                updated_at: now,
              },
            });
          }

          const currentQty = inventory.quantity ?? 0;
          const newQty = currentQty + item.quantity;
          const reserved = inventory.reserved_quantity ?? 0;
          const available = Math.max(newQty - reserved, 0);

          await txPrisma.inventories.update({
            where: { id: inventory.id },
            data: {
              quantity: newQty,
              available_quantity: available,
              updated_at: now,
            },
          });

          await txPrisma.inventory_transactions.create({
            data: {
              inventory_id: inventory.id,
              transaction_type: InventoryTransactionType.IMPORT,
              quantity: item.quantity,
              reference_type: 'PURCHASE_ORDER',
              reference_id: po.id,
              note: `Nhập kho tự động từ đơn nhập hàng ${po.purchase_code}`,
              created_by: userId ? BigInt(userId) : null,
              created_at: now,
            },
          });
        }
      }

      const updatedPo = await txPrisma.purchase_orders.update({
        where: { id: BigInt(id) },
        data: {
          status: data.status,
          updated_at: now,
        },
        include: {
          purchase_order_items: {
            include: { products: true },
          },
        },
      });

      return this.mapToResponse(updatedPo);
    });
  }

  public static async delete(id: number): Promise<void> {
    const po = await prisma.purchase_orders.findUnique({ where: { id: BigInt(id) } });
    if (!po) throw new Error('Đơn nhập hàng không tồn tại');

    if (po.status === PurchaseOrderStatus.RECEIVED) {
      throw new Error('Không thể xóa đơn nhập hàng đã hoàn thành nhập kho');
    }

    await prisma.purchase_orders.delete({ where: { id: BigInt(id) } });
  }
}