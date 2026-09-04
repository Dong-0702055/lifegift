import prisma from '../../config/database';
import { ApplyCouponDto, CreateCouponDto, UpdateCouponDto } from './coupon.dto';

const getVietNamDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

export class CouponService {
  private static formatResponse(coupon: any) {
    return {
      id: coupon.id.toString(),
      code: coupon.code,
      name: coupon.name,
      discountType: coupon.discount_type,
      discountValue: Number(coupon.discount_value),
      minOrderValue: Number(coupon.min_order_value),
      maxDiscount: coupon.max_discount ? Number(coupon.max_discount) : null,
      usageLimit: coupon.usage_limit,
      usedCount: coupon.used_count,
      startAt: coupon.start_at,
      endAt: coupon.end_at,
      status: coupon.status,
      createdAt: coupon.created_at,
      updatedAt: coupon.updated_at,
    };
  }

  // --- CHO CLIENT (XÁC NHẬN VÀ TÍNH TIỀN GIẢM) ---
  public static async validateAndCalculate(data: ApplyCouponDto) {
    const coupon = await prisma.coupons.findUnique({
      where: { code: data.code.toUpperCase().trim() },
    });

    if (!coupon) throw new Error('Mã giảm giá không tồn tại');
    if (coupon.status !== 'ACTIVE') throw new Error('Mã giảm giá đã ngưng hoạt động');

    const now = getVietNamDateTime();
    if (now < new Date(coupon.start_at) || now > new Date(coupon.end_at)) {
      throw new Error('Mã giảm giá chưa đến đợt sử dụng hoặc đã hết hạn');
    }

    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      throw new Error('Mã giảm giá đã hết số lượt sử dụng');
    }

    if (data.subtotal < Number(coupon.min_order_value)) {
      throw new Error(`Đơn hàng tối thiểu phải từ ${Number(coupon.min_order_value).toLocaleString()}đ`);
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'PERCENTAGE') {
      discountAmount = (data.subtotal * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount && discountAmount > Number(coupon.max_discount)) {
        discountAmount = Number(coupon.max_discount);
      }
    } else {
      discountAmount = Number(coupon.discount_value);
    }

    if (discountAmount > data.subtotal) {
      discountAmount = data.subtotal;
    }

    return {
      couponId: coupon.id.toString(),
      code: coupon.code,
      name: coupon.name,
      discountAmount,
    };
  }

  // --- CHO ADMIN (QUẢN LÝ CRUD) ---
  public static async create(dto: CreateCouponDto) {
    const formattedCode = dto.code.toUpperCase().trim();
    const existing = await prisma.coupons.findUnique({ where: { code: formattedCode } });

    if (existing) {
      throw new Error('Mã giảm giá này đã tồn tại');
    }

    if (new Date(dto.startAt) >= new Date(dto.endAt)) {
      throw new Error('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc');
    }

    const coupon = await prisma.coupons.create({
      data: {
        code: formattedCode,
        name: dto.name,
        discount_type: dto.discountType,
        discount_value: dto.discountValue,
        min_order_value: dto.minOrderValue ?? 0,
        max_discount: dto.maxDiscount ?? null,
        usage_limit: dto.usageLimit ?? null,
        start_at: new Date(dto.startAt),
        end_at: new Date(dto.endAt),
        status: dto.status ?? 'ACTIVE',
      },
    });

    return this.formatResponse(coupon);
  }

  public static async getAll() {
    const coupons = await prisma.coupons.findMany({
      orderBy: { created_at: 'desc' },
    });
    return coupons.map((c) => this.formatResponse(c));
  }

  public static async getById(id: number) {
    const coupon = await prisma.coupons.findUnique({
      where: { id: BigInt(id) },
    });
    if (!coupon) throw new Error('Mã giảm giá không tồn tại');
    return this.formatResponse(coupon);
  }

  public static async update(id: number, dto: UpdateCouponDto) {
    const coupon = await prisma.coupons.findUnique({
      where: { id: BigInt(id) },
    });

    if (!coupon) throw new Error('Mã giảm giá không tồn tại');

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.discountType) updateData.discount_type = dto.discountType;
    if (dto.discountValue !== undefined) updateData.discount_value = dto.discountValue;
    if (dto.minOrderValue !== undefined) updateData.min_order_value = dto.minOrderValue;
    if (dto.maxDiscount !== undefined) updateData.max_discount = dto.maxDiscount;
    if (dto.usageLimit !== undefined) updateData.usage_limit = dto.usageLimit;
    if (dto.startAt) updateData.start_at = new Date(dto.startAt);
    if (dto.endAt) updateData.end_at = new Date(dto.endAt);
    if (dto.status) updateData.status = dto.status;

    const updated = await prisma.coupons.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return this.formatResponse(updated);
  }

  public static async delete(id: number) {
    const coupon = await prisma.coupons.findUnique({
      where: { id: BigInt(id) },
    });

    if (!coupon) throw new Error('Mã giảm giá không tồn tại');

    // Check xem mã đã từng được sử dụng chưa
    const used = await prisma.coupon_usages.findFirst({
      where: { coupon_id: BigInt(id) },
    });

    if (used) {
      throw new Error('Không thể xóa mã giảm giá đã có lượt sử dụng. Bạn có thể chuyển trạng thái sang INACTIVE');
    }

    await prisma.coupons.delete({
      where: { id: BigInt(id) },
    });

    return true;
  }
}