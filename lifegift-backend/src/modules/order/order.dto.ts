
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';

import { Type } from 'class-transformer';

import { PaymentRequestDto, PaymentResponse } from '../payment/payment.dto';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RETURN_REQUESTED = 'RETURN_REQUESTED',
  RETURNED = 'RETURNED',
  REFUND_REQUESTED = 'REFUND_REQUESTED',
}


export class CreateOrderRequestDto {
  @IsNotEmpty({ message: 'Warehouse ID không được để trống' })
  @IsInt({ message: 'warehouseId phải là số nguyên' })
  @Min(1, { message: 'Warehouse ID phải lớn hơn 0' })
  warehouseId!: number;

  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  @IsString()
  @MaxLength(150, { message: 'Tên người nhận tối đa 150 ký tự' })
  receiverName!: string;

  @IsNotEmpty({ message: 'Số điện thoại người nhận không được để trống' })
  @IsString()
  @MaxLength(20, { message: 'Số điện thoại tối đa 20 ký tự' })
  receiverPhone!: string;

  @IsNotEmpty({ message: 'Tỉnh/Thành phố không được để trống' })
  @IsString()
  @MaxLength(100, { message: 'Tỉnh/Thành phố tối đa 100 ký tự' })
  shippingProvince!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Quận/Huyện tối đa 100 ký tự' })
  shippingDistrict?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Phường/Xã tối đa 100 ký tự' })
  shippingWard?: string;

  @IsNotEmpty({ message: 'Địa chỉ giao hàng không được để trống' })
  @IsString()
  @MaxLength(255, { message: 'Địa chỉ tối đa 255 ký tự' })
  shippingAddress!: string;

  @IsOptional()
  @IsNumber({}, { message: 'shippingFee phải là số' })
  @Min(0, { message: 'Phí vận chuyển không được âm' })
  shippingFee: number = 0;

  @IsOptional()
  @IsString({ message: 'Mã coupon phải là chuỗi' })
  couponCode?: string;

  @IsOptional()
  @IsNumber({}, { message: 'discountAmount phải là số' })
  @Min(0, { message: 'Giảm giá không được âm' })
  discountAmount: number = 0;

  @IsNotEmpty({ message: 'Thông tin thanh toán không được để trống' })
  @ValidateNested()
  @Type(() => PaymentRequestDto)
  payment!: PaymentRequestDto;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Ghi chú tối đa 500 ký tự' })
  note?: string;

  @ArrayNotEmpty({ message: 'Đơn hàng phải có ít nhất một sản phẩm' })
  @IsInt({ each: true, message: 'cartItemIds phải là danh sách các số nguyên' })
  cartItemIds!: number[];
}

export class UpdateOrderStatusDto {
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsEnum(OrderStatus, { message: 'Trạng thái không hợp lệ' })
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class OrderIdParamDto {
  @IsNumberString({}, { message: 'orderId phải là số' })
  id!: string;
}

export interface OrderItemResponse {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderResponse {
  id: string;
  orderCode: string;
  userId: string;
  warehouseId: string;
  receiverName: string;
  receiverPhone: string;
  shippingProvince: string;
  shippingDistrict?: string;
  shippingWard?: string;
  shippingAddress: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  payment: PaymentResponse;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemResponse[];
}