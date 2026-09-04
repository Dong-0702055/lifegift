import prisma from '../../config/database';
import { PaymentMethod, PaymentRequestDto, PaymentResponse, PaymentStatus } from './payment.dto';

const getVietNamDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

export class PaymentService {
  private static toResponse(payment: any): PaymentResponse {
    const order = payment.orders || payment.order;
    return {
      id: payment.id.toString(),
      orderId: payment.order_id ? payment.order_id.toString() : '',
      orderCode: order?.order_code || '',
      paymentMethod: payment.payment_method as PaymentMethod,
      transactionCode: payment.transaction_code || undefined,
      amount: Number(payment.amount),
      status: payment.status as PaymentStatus,
      paidAt: payment.paid_at || undefined,
      createdAt: payment.created_at || undefined,
    };
  }

  public static async createForOrder(order: any, request: PaymentRequestDto, txPrisma?: any): Promise<PaymentResponse> {
    const db = txPrisma || prisma;

    if (!order) {
      throw new Error('Order không được để trống');
    }
    if (!request.paymentMethod) {
      throw new Error('Phương thức thanh toán không được để trống');
    }

    const now = getVietNamDateTime();
    const payment = await db.payments.create({
      data: {
        order_id: BigInt(order.id),
        payment_method: request.paymentMethod,
        amount: order.total_amount ?? order.totalAmount,
        status: PaymentStatus.PENDING,
        created_at: now,
      },
      include: { orders: true },
    });

    return this.toResponse(payment);
  }

  public static async getLatestByOrderId(orderId: number): Promise<PaymentResponse> {
    const payment = await prisma.payments.findFirst({
      where: { order_id: BigInt(orderId) },
      orderBy: { created_at: 'desc' },
      include: { orders: true },
    });

    if (!payment) {
      throw new Error('Payment của order không tồn tại');
    }

    return this.toResponse(payment);
  }

  public static async markSuccess(orderId: number, transactionCode?: string): Promise<PaymentResponse> {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payments.findFirst({
        where: { order_id: BigInt(orderId) },
        orderBy: { created_at: 'desc' },
        include: { orders: true },
      });

      if (!payment) {
        throw new Error('Payment của order không tồn tại');
      }
      

      const order = payment.orders;

      if (!order) {
       throw new Error('Order của payment không tồn tại');
      }

      if (order.order_status === 'CANCELLED') {
       throw new Error('Không thể thanh toán đơn hàng đã bị hủy');
      }
 
      if (order.order_status === 'RETURNED') {
        throw new Error('Không thể thanh toán đơn hàng đã hoàn trả');
      }

      if (payment.status === PaymentStatus.SUCCESS) {
        throw new Error('Giao dịch này đã được thanh toán thành công trước đó');
      }

      if (payment.status === PaymentStatus.REFUNDED) {
        throw new Error('Giao dịch này đã được hoàn tiền, không thể thanh toán lại');
      }

      const now = getVietNamDateTime();
      const updatedPayment = await tx.payments.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          transaction_code: transactionCode || payment.transaction_code,
          paid_at: now,
        },
        include: { orders: true },
      });

      return this.toResponse(updatedPayment);
    });
  }

  public static async markFailed(orderId: number, transactionCode?: string): Promise<PaymentResponse> {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payments.findFirst({
        where: { order_id: BigInt(orderId) },
        orderBy: { created_at: 'desc' },
        include: { orders: true },
      });

      if (!payment) {
        throw new Error('Payment của order không tồn tại');
      }

      if (payment.status === PaymentStatus.SUCCESS) {
        throw new Error('Không thể đánh dấu FAILED cho payment đã SUCCESS');
      }
      if (payment.status === PaymentStatus.REFUNDED) {
        throw new Error('Không thể đánh dấu FAILED cho payment đã REFUNDED');
      }

      const updatedPayment = await tx.payments.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          transaction_code: transactionCode || payment.transaction_code,
        },
        include: { orders: true },
      });

      return this.toResponse(updatedPayment);
    });
  }

  public static async refund(orderId: number): Promise<PaymentResponse> {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payments.findFirst({
        where: { order_id: BigInt(orderId) },
        orderBy: { created_at: 'desc' },
        include: { orders: true },
      });

      if (!payment) {
        throw new Error('Payment của order không tồn tại');
      }
        const order = payment.orders;

        if (!order) {
        throw new Error('Order của payment không tồn tại');
        }

        if (order.order_status === 'CANCELLED') {
        throw new Error('Không thể thanh toán đơn hàng đã bị hủy');
        }

        if (order.order_status === 'RETURNED') {
        throw new Error('Không thể thanh toán đơn hàng đã hoàn trả');
        }

      const updatedPayment = await tx.payments.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REFUNDED,
        },
        include: { orders: true },
      });

      return this.toResponse(updatedPayment);
    });
  }

  public static async handleOrderStatusChange(
    order: any,
    oldStatus: string,
    newStatus: string,
    txPrisma?: any
  ): Promise<void> {
    const db = txPrisma || prisma;

    const payment = await db.payments.findFirst({
      where: { order_id: BigInt(order.id) },
      orderBy: { created_at: 'desc' },
    });

    if (!payment) {
      throw new Error('Payment của order không tồn tại');
    }

    if (newStatus === 'CANCELLED') {
      if (payment.status === PaymentStatus.SUCCESS) {
        await db.payments.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.REFUNDED },
        });
      }
      return;
    }

    if (newStatus === 'COMPLETED') {
      if (payment.payment_method === PaymentMethod.COD && payment.status === PaymentStatus.PENDING) {
        await db.payments.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            paid_at: getVietNamDateTime(),
          },
        });
      }
      return;
    }

    if (newStatus === 'RETURNED') {
      if (payment.status === PaymentStatus.SUCCESS) {
        await db.payments.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.REFUNDED,
          },
        });
      }

      return;
    }
  }
}