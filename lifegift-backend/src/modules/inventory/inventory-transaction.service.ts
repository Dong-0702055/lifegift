import prisma from '../../config/database';
import { InventoryTransactionRequestDto, InventoryTransactionResponse, InventoryTransactionType } from './inventory-transaction.dto';

const getVietNamDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

export class InventoryTransactionService {
  private static calculateDelta(type: InventoryTransactionType, quantity: number): number {
    switch (type) {
      case InventoryTransactionType.IMPORT:
      case InventoryTransactionType.RETURN:
      case InventoryTransactionType.TRANSFER_IN:
      case InventoryTransactionType.ADJUSTMENT:
        return quantity;
      case InventoryTransactionType.SALE:
      case InventoryTransactionType.TRANSFER_OUT:
        return -quantity;
      default:
        return 0;
    }
  }

  private static mapToResponse(tx: any): InventoryTransactionResponse {
    return {
      id: tx.id.toString(),
      inventoryId: tx.inventory_id.toString(),
      warehouseId: tx.inventories?.warehouse_id?.toString() || '',
      productId: tx.inventories?.product_id?.toString() || '',
      transactionType: tx.transaction_type,
      quantity: tx.quantity,
      referenceType: tx.reference_type || null,
      referenceId: tx.reference_id ? tx.reference_id.toString() : null,
      note: tx.note || null,
      createdBy: tx.created_by ? tx.created_by.toString() : null,
      createdAt: tx.created_at,
    };
  }

  public static async getAll(): Promise<InventoryTransactionResponse[]> {
    const list = await prisma.inventory_transactions.findMany({
      include: { inventories: true },
      orderBy: { created_at: 'desc' },
    });
    return list.map((tx) => this.mapToResponse(tx));
  }

  public static async getById(id: number): Promise<InventoryTransactionResponse> {
    const tx = await prisma.inventory_transactions.findUnique({
      where: { id },
      include: { inventories: true },
    });
    if (!tx) throw new Error('Inventory transaction không tồn tại');
    return this.mapToResponse(tx);
  }

  public static async getByInventory(inventoryId: number): Promise<InventoryTransactionResponse[]> {
    const exists = await prisma.inventories.findUnique({ where: { id: BigInt(inventoryId) } });
    if (!exists) throw new Error('Inventory không tồn tại');

    const list = await prisma.inventory_transactions.findMany({
      where: { inventory_id: BigInt(inventoryId) },
      include: { inventories: true },
      orderBy: { created_at: 'desc' },
    });
    return list.map((tx) => this.mapToResponse(tx));
  }

  public static async create(data: InventoryTransactionRequestDto, userId?: number): Promise<InventoryTransactionResponse> {
    if (data.quantity <= 0) throw new Error('Số lượng giao dịch phải lớn hơn 0');

    return await prisma.$transaction(async (txPrisma) => {
      const inv = await txPrisma.inventories.findUnique({
        where: { id: BigInt(data.inventoryId) },
      });
      if (!inv) throw new Error('Inventory không tồn tại');

      const delta = this.calculateDelta(data.transactionType, data.quantity);
      const currentQty = inv.quantity ?? 0;
      const newQty = currentQty + delta;

      if (newQty < 0) {
        throw new Error(`Không đủ tồn kho. Tồn hiện tại: ${currentQty}, số lượng xuất: ${data.quantity}`);
      }

      const reserved = inv.reserved_quantity ?? 0;
      const available = Math.max(newQty - reserved, 0);
      const now = getVietNamDateTime();

      await txPrisma.inventories.update({
        where: { id: inv.id },
        data: {
          quantity: newQty,
          available_quantity: available,
          updated_at: now,
        },
      });

      const createdTx = await txPrisma.inventory_transactions.create({
        data: {
          inventory_id: inv.id,
          transaction_type: data.transactionType,
          quantity: data.quantity,
          reference_type: data.referenceType || null,
          reference_id: data.referenceId ? BigInt(data.referenceId) : null,
          note: data.note || null,
          created_by: userId ? BigInt(userId) : null,
          created_at: now,
        },
        include: { inventories: true },
      });

      return this.mapToResponse(createdTx);
    });
  }

  public static async update(id: number, data: InventoryTransactionRequestDto): Promise<InventoryTransactionResponse> {
    if (data.quantity <= 0) throw new Error('Số lượng giao dịch phải lớn hơn 0');

    return await prisma.$transaction(async (txPrisma) => {
      const transaction = await txPrisma.inventory_transactions.findUnique({ where: { id } });
      if (!transaction) throw new Error('Inventory transaction không tồn tại');

      const oldInv = await txPrisma.inventories.findUnique({ where: { id: transaction.inventory_id } });
      if (!oldInv) throw new Error('Inventory cũ không tồn tại');

      const oldDelta = this.calculateDelta(transaction.transaction_type as InventoryTransactionType, transaction.quantity);
      const newDelta = this.calculateDelta(data.transactionType, data.quantity);
      const newInvId = BigInt(data.inventoryId);

      let targetInv: any;

      if (oldInv.id === newInvId) {
        const currentQty = oldInv.quantity ?? 0;
        const change = newDelta - oldDelta;
        const finalQty = currentQty + change;

        if (finalQty < 0) {
          throw new Error(`Không đủ tồn kho. Tồn hiện tại: ${currentQty}, số lượng xuất: ${data.quantity}, loại giao dịch: ${data.transactionType}`);
        }

        const reserved = oldInv.reserved_quantity ?? 0;
        targetInv = await txPrisma.inventories.update({
          where: { id: oldInv.id },
          data: {
            quantity: finalQty,
            available_quantity: Math.max(finalQty - reserved, 0),
            updated_at: getVietNamDateTime(),
          },
        });
      } else {
        const newInv = await txPrisma.inventories.findUnique({ where: { id: newInvId } });
        if (!newInv) throw new Error('Inventory mới không tồn tại');

        // Hoàn tác tồn kho ở inventory cũ
        const oldQty = oldInv.quantity ?? 0;
        const restoredQty = oldQty - oldDelta;
        if (restoredQty < 0) {
          throw new Error('Không thể cập nhật transaction vì tồn kho hiện tại không đủ để hoàn tác transaction cũ');
        }

        const oldReserved = oldInv.reserved_quantity ?? 0;
        await txPrisma.inventories.update({
          where: { id: oldInv.id },
          data: {
            quantity: restoredQty,
            available_quantity: Math.max(restoredQty - oldReserved, 0),
            updated_at: getVietNamDateTime(),
          },
        });

        // Áp dụng tồn kho cho inventory mới
        const newQty = newInv.quantity ?? 0;
        const finalQty = newQty + newDelta;

        if (finalQty < 0) {
          throw new Error(`Không đủ tồn kho. Tồn hiện tại: ${newQty}, số lượng xuất: ${data.quantity}, loại giao dịch: ${data.transactionType}`);
        }

        const newReserved = newInv.reserved_quantity ?? 0;
        targetInv = await txPrisma.inventories.update({
          where: { id: newInv.id },
          data: {
            quantity: finalQty,
            available_quantity: Math.max(finalQty - newReserved, 0),
            updated_at: getVietNamDateTime(),
          },
        });
      }

      const updatedTx = await txPrisma.inventory_transactions.update({
        where: { id },
        data: {
          inventory_id: targetInv.id,
          transaction_type: data.transactionType,
          quantity: data.quantity,
          reference_type: data.referenceType || null,
          reference_id: data.referenceId ? BigInt(data.referenceId) : null,
          note: data.note || null,
        },
        include: { inventories: true },
      });

      return this.mapToResponse(updatedTx);
    });
  }

  public static async delete(id: number): Promise<void> {
    return await prisma.$transaction(async (txPrisma) => {
      const transaction = await txPrisma.inventory_transactions.findUnique({ where: { id } });
      if (!transaction) throw new Error('Inventory transaction không tồn tại');

      const inv = await txPrisma.inventories.findUnique({ where: { id: transaction.inventory_id } });
      if (!inv) throw new Error('Inventory không tồn tại');

      const delta = this.calculateDelta(transaction.transaction_type as InventoryTransactionType, transaction.quantity);
      const currentQty = inv.quantity ?? 0;
      const restoredQty = currentQty - delta;

      if (restoredQty < 0) {
        throw new Error('Không thể xóa transaction vì tồn kho không đủ để hoàn tác giao dịch');
      }

      const reserved = inv.reserved_quantity ?? 0;
      await txPrisma.inventories.update({
        where: { id: inv.id },
        data: {
          quantity: restoredQty,
          available_quantity: Math.max(restoredQty - reserved, 0),
          updated_at: getVietNamDateTime(),
        },
      });

      await txPrisma.inventory_transactions.delete({ where: { id } });
    });
  }
}