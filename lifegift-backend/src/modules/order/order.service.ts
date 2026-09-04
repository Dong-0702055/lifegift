import prisma from '../../config/database';
import {
  CreateOrderRequestDto,
  OrderResponse,
  OrderItemResponse,
  OrderStatus,
} from './order.dto';
import { order_status_history_status, inventory_transactions_transaction_type } from '@prisma/client';
import { PaymentService } from '../payment/payment.service';

const getVietNamDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

export class OrderService {
  private static generateOrderCode(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `ORD-${date}-${random}`;
  }

  private static toItemResponse(item: any): OrderItemResponse {
    return {
      id: item.id.toString(),
      orderId: item.order_id ? item.order_id.toString() : '',
      productId: item.product_id ? item.product_id.toString() : '',
      productName: item.product_name,
      sku: item.sku,
      unitPrice: Number(item.unit_price),
      quantity: item.quantity,
      subtotal: Number(item.subtotal),
    };
  }

  private static async toOrderResponse(order: any): Promise<OrderResponse> {
    const items = (order.order_items || []).map((item: any) => this.toItemResponse(item));
    const latestPayment = await PaymentService.getLatestByOrderId(Number(order.id));

    return {
      id: order.id.toString(),
      orderCode: order.order_code,
      userId: order.user_id ? order.user_id.toString() : '',
      warehouseId: order.warehouse_id ? order.warehouse_id.toString() : '',
      receiverName: order.receiver_name,
      receiverPhone: order.receiver_phone,
      shippingProvince: order.shipping_province,
      shippingDistrict: order.shipping_district,
      shippingWard: order.shipping_ward,
      shippingAddress: order.shipping_address,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shipping_fee),
      discountAmount: Number(order.discount_amount),
      totalAmount: Number(order.total_amount),
      orderStatus: order.order_status as OrderStatus,
      payment: latestPayment,
      note: order.note,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items,
    };
  }

  private static validateStatusTransition(current: OrderStatus, next: OrderStatus): void {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPING],
      [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [OrderStatus.RETURN_REQUESTED],
      [OrderStatus.RETURN_REQUESTED]: [OrderStatus.RETURNED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.RETURNED]: [],
      [OrderStatus.REFUND_REQUESTED]: [OrderStatus.RETURNED, OrderStatus.CANCELLED],
    };

    if (!transitions[current]?.includes(next)) {
      throw new Error(`Không thể chuyển trạng thái từ ${current} sang ${next}`);
    }
  }

  public static async create(userId: number, request: CreateOrderRequestDto): Promise<OrderResponse> {
    if (!request.cartItemIds || request.cartItemIds.length === 0) {
      throw new Error('Phải chọn ít nhất một sản phẩm để checkout');
    }

    const uId = BigInt(userId);
    const warehouseId = BigInt(request.warehouseId);

    const createdOrder = await prisma.$transaction(async (tx) => {
      const warehouse = await tx.warehouses.findUnique({ where: { id: warehouseId } });
      if (!warehouse) throw new Error('Warehouse không tồn tại');

      const cart = await tx.carts.findFirst({ where: { user_id: uId } });
      if (!cart) throw new Error('Giỏ hàng không tồn tại');

      const bigIntCartItemIds = request.cartItemIds.map((id) => BigInt(id));
      const cartItems = await tx.cart_items.findMany({
        where: { id: { in: bigIntCartItemIds }, cart_id: cart.id },
        include: { products: true },
      });

      if (cartItems.length !== request.cartItemIds.length) {
        throw new Error('Một hoặc nhiều sản phẩm không tồn tại trong giỏ hàng');
      }

      let subtotal = 0;
      const orderItemsData: any[] = [];

      for (const cartItem of cartItems) {
        const product = cartItem.products;
        if (!product || product.status !== 'ACTIVE') {
          throw new Error(`Sản phẩm không còn hoạt động: ${product?.name || cartItem.product_id}`);
        }

        const quantity = cartItem.quantity;
        if (!quantity || quantity <= 0) {
          throw new Error(`Số lượng sản phẩm không hợp lệ: ${product.name}`);
        }

        const inventory = await tx.inventories.findFirst({
          where: { warehouse_id: warehouseId, product_id: product.id },
        });

        if (!inventory) {
          throw new Error(`Sản phẩm ${product.name} không tồn tại trong kho ${warehouseId}`);
        }

        const availableQuantity = inventory.available_quantity ?? 0;
        if (availableQuantity < quantity) {
          throw new Error(
            `Không đủ tồn kho cho sản phẩm ${product.name}. Tồn khả dụng: ${availableQuantity}, yêu cầu: ${quantity}`
          );
        }

        const currentReserved = inventory.reserved_quantity ?? 0;
        const currentTotal = inventory.quantity ?? 0;
        const updatedReserved = currentReserved + quantity;
        const updatedAvailable = currentTotal - updatedReserved;

        await tx.inventories.update({
          where: { id: inventory.id },
          data: {
            reserved_quantity: updatedReserved,
            available_quantity: updatedAvailable,
            updated_at: getVietNamDateTime(),
          },
        });

        const salePrice = product.sale_price ? Number(product.sale_price) : 0;
        const price = product.price ? Number(product.price) : 0;
        const unitPrice = salePrice > 0 ? salePrice : price;

        if (unitPrice <= 0) {
          throw new Error(`Sản phẩm chưa có giá hợp lệ: ${product.name}`);
        }

        const itemSubtotal = unitPrice * quantity;
        subtotal += itemSubtotal;

        orderItemsData.push({
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          unit_price: unitPrice,
          quantity,
          subtotal: itemSubtotal,
        });
      }

      const shippingFee = request.shippingFee ?? 0;
      if (shippingFee < 0) throw new Error('Phí vận chuyển không được âm');

      // --- XỬ LÝ LOGIC COUPON ---
      let calculatedDiscountAmount = 0;
      let appliedCoupon: any = null;

      if (request.couponCode) {
        appliedCoupon = await tx.coupons.findUnique({
          where: { code: request.couponCode.toUpperCase().trim() },
        });

        const nowTime = getVietNamDateTime();

        if (!appliedCoupon) {
          throw new Error('Mã giảm giá không tồn tại');
        }
        if (appliedCoupon.status !== 'ACTIVE') {
          throw new Error('Mã giảm giá không hoạt động');
        }
        if (nowTime < new Date(appliedCoupon.start_at) || nowTime > new Date(appliedCoupon.end_at)) {
          throw new Error('Mã giảm giá chưa đến đợt áp dụng hoặc đã hết hạn');
        }
        if (appliedCoupon.usage_limit !== null && appliedCoupon.used_count >= appliedCoupon.usage_limit) {
          throw new Error('Mã giảm giá đã hết lượt sử dụng');
        }
        if (subtotal < Number(appliedCoupon.min_order_value)) {
          throw new Error(
            `Đơn hàng chưa đạt giá trị tối thiểu (${Number(appliedCoupon.min_order_value).toLocaleString()}đ) để áp dụng mã này`
          );
        }

        // Tính toán số tiền giảm
        if (appliedCoupon.discount_type === 'PERCENTAGE') {
          calculatedDiscountAmount = (subtotal * Number(appliedCoupon.discount_value)) / 100;
          if (appliedCoupon.max_discount && calculatedDiscountAmount > Number(appliedCoupon.max_discount)) {
            calculatedDiscountAmount = Number(appliedCoupon.max_discount);
          }
        } else if (appliedCoupon.discount_type === 'FIXED_AMOUNT') {
          calculatedDiscountAmount = Number(appliedCoupon.discount_value);
        }

        if (calculatedDiscountAmount > subtotal) {
          calculatedDiscountAmount = subtotal;
        }
      }

      let totalAmount = subtotal + shippingFee - calculatedDiscountAmount;
      if (totalAmount < 0) totalAmount = 0;

      const now = getVietNamDateTime();
      const order = await tx.orders.create({
        data: {
          order_code: this.generateOrderCode(),
          user_id: uId,
          warehouse_id: warehouseId,
          receiver_name: request.receiverName,
          receiver_phone: request.receiverPhone,
          shipping_province: request.shippingProvince,
          shipping_district: request.shippingDistrict,
          shipping_ward: request.shippingWard,
          shipping_address: request.shippingAddress,
          subtotal,
          shipping_fee: shippingFee,
          discount_amount: calculatedDiscountAmount,
          total_amount: totalAmount,
          order_status: OrderStatus.PENDING,
          note: request.note,
          created_at: now,
          updated_at: now,
          order_items: {
            create: orderItemsData,
          },
        },
        include: {
          order_items: true,
        },
      });

      // --- LƯU LỊCH SỬ SỬ DỤNG COUPON & CẬP NHẬT SO LƯỢNG DÙNG ---
      if (appliedCoupon) {
        await tx.coupon_usages.create({
          data: {
            coupon_id: appliedCoupon.id,
            user_id: uId,
            order_id: order.id,
            discount_amount: calculatedDiscountAmount,
            used_at: now,
          },
        });

        await tx.coupons.update({
          where: { id: appliedCoupon.id },
          data: {
            used_count: { increment: 1 },
          },
        });
      }

      // Tạo lịch sử trạng thái
      await tx.order_status_history.create({
        data: {
          order_id: order.id,
          status: OrderStatus.PENDING as order_status_history_status,
          note: 'Đơn hàng được tạo',
          changed_by: uId,
          created_at: now,
        },
      });

      // Tạo thông tin thanh toán (Payment)
      if (request.payment) {
        await PaymentService.createForOrder(order, request.payment, tx);
      }

      // Xóa các sản phẩm đã đặt khỏi giỏ hàng
      await tx.cart_items.deleteMany({
        where: { id: { in: bigIntCartItemIds } },
      });

      return order;
    });

    return await this.toOrderResponse(createdOrder);
  }

  public static async getAll(): Promise<OrderResponse[]> {
    const orders = await prisma.orders.findMany({
      orderBy: { created_at: 'desc' },
      include: { order_items: true },
    });
    return Promise.all(orders.map((order) => this.toOrderResponse(order)));
  }

  public static async getMyOrders(userId: number): Promise<OrderResponse[]> {
    const orders = await prisma.orders.findMany({
      where: { user_id: BigInt(userId) },
      orderBy: { created_at: 'desc' },
      include: { order_items: true },
    });
    return Promise.all(orders.map((order) => this.toOrderResponse(order)));
  }

  public static async getById(orderId: number): Promise<OrderResponse> {
    const order = await prisma.orders.findUnique({
      where: { id: BigInt(orderId) },
      include: { order_items: true },
    });
    if (!order) throw new Error('Order không tồn tại');
    return this.toOrderResponse(order);
  }

  public static async updateStatus(
    userId: number,
    orderId: number,
    newStatus: OrderStatus,
    note?: string
  ): Promise<OrderResponse> {
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({
        where: { id: BigInt(orderId) },
        include: { order_items: true },
      });

      if (!order) throw new Error('Order không tồn tại');

      const currentStatus = order.order_status as OrderStatus;
      if (currentStatus === newStatus) {
        throw new Error(`Đơn hàng đã ở trạng thái ${newStatus}`);
      }

      this.validateStatusTransition(currentStatus, newStatus);

      if (newStatus === OrderStatus.PROCESSING) {
        await this.processInventoryOutbound(tx, order);
      }

      // Khi CANCELLED: Giải phóng kho & Hoàn trả lượt dùng Coupon (nếu có)
      if (newStatus === OrderStatus.CANCELLED) {
        await this.releaseReservedInventory(tx, order);
        await this.rollbackCouponUsage(tx, order.id);
      }

      if (newStatus === OrderStatus.RETURNED) {
        await this.processInventoryReturn(tx, order);
      }

      await PaymentService.handleOrderStatusChange(order, currentStatus, newStatus, tx);

      const now = getVietNamDateTime();
      const updated = await tx.orders.update({
        where: { id: order.id },
        data: {
          order_status: newStatus,
          updated_at: now,
        },
        include: { order_items: true },
      });

      await tx.order_status_history.create({
        data: {
          order_id: order.id,
          status: newStatus as order_status_history_status,
          note: note || `Chuyển trạng thái sang ${newStatus}`,
          changed_by: BigInt(userId),
          created_at: now,
        },
      });

      return updated;
    });

    return await this.toOrderResponse(updatedOrder);
  }

  // --- HELPER HOÀN TRẢ COUPON KHI HỦY ĐƠN ---
  private static async rollbackCouponUsage(tx: any, orderId: bigint): Promise<void> {
    const usage = await tx.coupon_usages.findFirst({
      where: { order_id: orderId },
    });

    if (usage) {
      await tx.coupons.update({
        where: { id: usage.coupon_id },
        data: { used_count: { decrement: 1 } },
      });

      await tx.coupon_usages.delete({
        where: { id: usage.id },
      });
    }
  }

  // --- PRIVATE HELPER METHODS CHO INVENTORY TRANSACTIONS ---
  private static async processInventoryOutbound(tx: any, order: any): Promise<void> {
    if (!order.warehouse_id) throw new Error('Đơn hàng chưa xác định kho');

    for (const item of order.order_items) {
      const inventory = await tx.inventories.findFirst({
        where: { warehouse_id: order.warehouse_id, product_id: item.product_id },
      });

      if (!inventory) {
        throw new Error(`Không tìm thấy inventory cho sản phẩm ${item.product_name}`);
      }

      const totalQuantity = inventory.quantity ?? 0;
      const reservedQuantity = inventory.reserved_quantity ?? 0;
      const orderQuantity = item.quantity;

      if (totalQuantity < orderQuantity) {
        throw new Error(
          `Số lượng tồn kho không đủ để xuất sản phẩm ${item.product_name}. Tồn kho: ${totalQuantity}, cần: ${orderQuantity}`
        );
      }

      const newTotal = totalQuantity - orderQuantity;
      const newReserved = Math.max(0, reservedQuantity - orderQuantity);
      const newAvailable = newTotal - newReserved;

      await tx.inventories.update({
        where: { id: inventory.id },
        data: {
          quantity: newTotal,
          reserved_quantity: newReserved,
          available_quantity: newAvailable,
          updated_at: getVietNamDateTime(),
        },
      });

      await tx.inventory_transactions.create({
        data: {
          inventory_id: inventory.id,
          transaction_type: inventory_transactions_transaction_type.SALE,
          quantity: orderQuantity,
          reference_type: 'ORDER',
          reference_id: order.id,
          note: `Xuất kho cho đơn hàng #${order.id} - ${item.product_name}`,
          created_at: getVietNamDateTime(),
        },
      });
    }
  }

  private static async releaseReservedInventory(tx: any, order: any): Promise<void> {
    if (!order.warehouse_id) throw new Error('Đơn hàng chưa xác định kho');

    for (const item of order.order_items) {
      const inventory = await tx.inventories.findFirst({
        where: { warehouse_id: order.warehouse_id, product_id: item.product_id },
      });

      if (inventory) {
        const reserved = inventory.reserved_quantity ?? 0;
        const total = inventory.quantity ?? 0;
        const updatedReserved = Math.max(0, reserved - item.quantity);
        const updatedAvailable = total - updatedReserved;

        await tx.inventories.update({
          where: { id: inventory.id },
          data: {
            reserved_quantity: updatedReserved,
            available_quantity: updatedAvailable,
            updated_at: getVietNamDateTime(),
          },
        });
      }
    }
  }

  private static async processInventoryReturn(tx: any, order: any): Promise<void> {
    if (!order.warehouse_id) throw new Error('Đơn hàng chưa xác định kho');

    for (const item of order.order_items) {
      const inventory = await tx.inventories.findFirst({
        where: { warehouse_id: order.warehouse_id, product_id: item.product_id },
      });

      if (!inventory) {
        throw new Error(`Không tìm thấy inventory cho sản phẩm ${item.product_name}`);
      }

      const newTotal = (inventory.quantity ?? 0) + item.quantity;
      const reserved = inventory.reserved_quantity ?? 0;
      const newAvailable = newTotal - reserved;

      await tx.inventories.update({
        where: { id: inventory.id },
        data: {
          quantity: newTotal,
          available_quantity: newAvailable,
          updated_at: getVietNamDateTime(),
        },
      });

      await tx.inventory_transactions.create({
        data: {
          inventory_id: inventory.id,
          transaction_type: inventory_transactions_transaction_type.RETURN,
          quantity: item.quantity,
          reference_type: 'ORDER',
          reference_id: order.id,
          note: `Hoàn kho đơn hàng #${order.id} - ${item.product_name}`,
          created_at: getVietNamDateTime(),
        },
      });
    }
  }
}