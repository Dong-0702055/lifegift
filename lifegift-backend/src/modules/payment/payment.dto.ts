import {
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export enum PaymentMethod {
  COD = 'COD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export class PaymentRequestDto {
  @IsNotEmpty({
    message: 'Phương thức thanh toán không được để trống',
  })
  @IsEnum(PaymentMethod, {
    message: 'Phương thức thanh toán không hợp lệ',
  })
  paymentMethod!: PaymentMethod;
}

export class OrderIdParamDto {
  @IsNumberString({}, {
    message: 'orderId phải là số',
  })
  orderId!: string;
}

export class PaymentQueryDto {
  @IsOptional()
  @IsString()
  transactionCode?: string;
}

export interface PaymentResponse {
  id: string;
  orderId: string;
  orderCode: string;
  paymentMethod: PaymentMethod;
  transactionCode?: string;
  amount: number;
  status: PaymentStatus;
  paidAt?: Date;
  createdAt?: Date;
}