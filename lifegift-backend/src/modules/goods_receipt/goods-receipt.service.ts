import prisma from '../../config/database';
import { InventoryTransactionType } from '../inventory/inventory-transaction.dto';
import { PurchaseOrderStatus } from '../purchase/purchase.dto';
import { CreateGoodsReceiptDto, GoodsReceiptResponse } from './goods-receipt.dto';

const getVietNamDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

export class GoodsReceiptService {
  private static generateReceiptCode(): string {
    const timestamp = Date.now();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `GR-${timestamp}-${random}`;
  }

  private static mapToResponse(gr: any): GoodsReceiptResponse {
    return {
      id: gr.id.toString(),
      receiptCode: gr.receipt_code,
      purchaseOrderId: gr.purchase_order_id.toString(),
      purchaseCode: gr.purchase_orders?.purchase_code || '',
      warehouseId: gr.warehouse_id.toString(),
      warehouseName: gr.warehouses?.name || '',
      receivedBy: gr.received_by.toString(),
      receivedByName: gr.users?.full_name || '',
      totalAmount: Number(gr.total_amount),
      note: gr.note || null,
      receivedAt: gr.received_at,
    };
  }

  public static async getAll(): Promise<GoodsReceiptResponse[]> {
    const receipts = await prisma.goods_receipts.findMany({
      include: {
        purchase_orders: true,
        warehouses: true,
        users: true,
      },
      orderBy: { received_at: 'desc' },
    });
    return receipts.map(this.mapToResponse);
  }

  public static async getById(id: number): Promise<GoodsReceiptResponse> {
    const gr = await prisma.goods_receipts.findUnique({
      where: { id: BigInt(id) },
      include: {
        purchase_orders: true,
        warehouses: true,
        users: true,
      },
    });
    if (!gr) throw new Error('Phiếu nhập kho không tồn tại');
    return this.mapToResponse(gr);
  }

  public static async create(data: CreateGoodsReceiptDto, userId: number): Promise<GoodsReceiptResponse> {
    return await prisma.$transaction(async (txPrisma) => {
      const poId = BigInt(data.purchaseOrderId);

      // 1. Kiểm tra tồn tại của Purchase Order
      const po = await txPrisma.purchase_orders.findUnique({
        where: { id: poId },
        include: { purchase_order_items: true },
      });

      if (!po) throw new Error('Đơn nhập hàng không tồn tại');
      if (po.status === PurchaseOrderStatus.RECEIVED) {
        throw new Error('Đơn nhập hàng này đã được nhập kho trước đó');
      }
      if (po.status === PurchaseOrderStatus.CANCELLED) {
        throw new Error('Đơn nhập hàng này đã bị hủy, không thể nhập kho');
      }

      const now = getVietNamDateTime();
      const receiptCode = this.generateReceiptCode();

      // 2. TỰ ĐỘNG LẤY TỔNG TIỀN TỪ PURCHASE ORDER
      const calculatedTotalAmount = Number(po.total_amount);

      // 3. Cập nhật tồn kho (inventories) & Tạo giao dịch kho (inventory_transactions)
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
            reference_type: 'GOODS_RECEIPT',
            reference_id: po.id,
            note: `Nhập kho từ phiếu nhập ${receiptCode} (Đơn PO: ${po.purchase_code})`,
            created_by: BigInt(userId),
            created_at: now,
          },
        });
      }

      // 4. Cập nhật trạng thái Purchase Order thành RECEIVED
      await txPrisma.purchase_orders.update({
        where: { id: poId },
        data: {
          status: PurchaseOrderStatus.RECEIVED,
          updated_at: now,
        },
      });

      // 5. Tạo Phiếu nhập kho (goods_receipts)
      const createdGr = await txPrisma.goods_receipts.create({
        data: {
          receipt_code: receiptCode,
          purchase_order_id: poId,
          warehouse_id: po.warehouse_id,
          received_by: BigInt(userId),
          total_amount: calculatedTotalAmount, // Lấy tự động từ PO
          note: data.note || null,
          received_at: now,
        },
        include: {
          purchase_orders: true,
          warehouses: true,
          users: true,
        },
      });

      return this.mapToResponse(createdGr);
    });
  }
}