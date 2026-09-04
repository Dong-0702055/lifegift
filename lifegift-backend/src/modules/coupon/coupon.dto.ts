import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsDateString,
  IsInt,
  MaxLength,
} from 'class-validator';

export enum CouponDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum CouponStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
}

export class ApplyCouponDto {
  @IsNotEmpty({ message: 'Mã coupon không được để trống' })
  @IsString()
  code!: string;

  @IsNotEmpty({ message: 'Giá trị đơn hàng tạm tính không được để trống' })
  @IsNumber({}, { message: 'subtotal phải là số' })
  @Min(0)
  subtotal!: number;
}

export class CreateCouponDto {
  @IsNotEmpty({ message: 'Mã coupon không được để trống' })
  @IsString()
  @MaxLength(80, { message: 'Mã coupon tối đa 80 ký tự' })
  code!: string;

  @IsNotEmpty({ message: 'Tên chương trình giảm giá không được để trống' })
  @IsString()
  @MaxLength(150, { message: 'Tên tối đa 150 ký tự' })
  name!: string;

  @IsNotEmpty({ message: 'Loại giảm giá không được để trống' })
  @IsEnum(CouponDiscountType, { message: 'Loại giảm giá phải là PERCENTAGE hoặc FIXED_AMOUNT' })
  discountType!: CouponDiscountType;

  @IsNotEmpty({ message: 'Giá trị giảm không được để trống' })
  @IsNumber({}, { message: 'discountValue phải là số' })
  @Min(0, { message: 'Giá trị giảm không được âm' })
  discountValue!: number;

  @IsOptional()
  @IsNumber({}, { message: 'minOrderValue phải là số' })
  @Min(0)
  minOrderValue?: number = 0;

  @IsOptional()
  @IsNumber({}, { message: 'maxDiscount phải là số' })
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @IsInt({ message: 'usageLimit phải là số nguyên' })
  @Min(1, { message: 'Giới hạn sử dụng phải lớn hơn 0' })
  usageLimit?: number;

  @IsNotEmpty({ message: 'Ngày bắt đầu không được để trống' })
  @IsDateString({}, { message: 'startAt phải là định dạng ngày ISO hợp lệ' })
  startAt!: string;

  @IsNotEmpty({ message: 'Ngày kết thúc không được để trống' })
  @IsDateString({}, { message: 'endAt phải là định dạng ngày ISO hợp lệ' })
  endAt!: string;

  @IsOptional()
  @IsEnum(CouponStatus, { message: 'Trạng thái không hợp lệ' })
  status?: CouponStatus = CouponStatus.ACTIVE;
}

export class UpdateCouponDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsEnum(CouponDiscountType)
  discountType?: CouponDiscountType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;
}