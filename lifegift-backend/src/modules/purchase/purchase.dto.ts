import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  ORDERED = 'ORDERED',
  PARTIAL_RECEIVED = 'PARTIAL_RECEIVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export class PurchaseOrderItemRequestDto {
  @IsNotEmpty({ message: 'productId không được để trống' })
  @IsInt({ message: 'productId phải là số nguyên' })
  productId!: number;

  @IsNotEmpty({ message: 'quantity không được để trống' })
  @IsInt({ message: 'quantity phải là số nguyên' })
  @Min(1, { message: 'Số lượng nhập phải lớn hơn 0' })
  quantity!: number;

  @IsNotEmpty({ message: 'unitCost không được để trống' })
  @IsNumber({}, { message: 'unitCost phải là số' })
  @Min(0, { message: 'Đơn giá không được nhỏ hơn 0' })
  unitCost!: number;
}

export class CreatePurchaseOrderDto {
  @IsNotEmpty({ message: 'supplierId không được để trống' })
  @IsInt({ message: 'supplierId phải là số nguyên' })
  supplierId!: number;

  @IsNotEmpty({ message: 'warehouseId không được để trống' })
  @IsInt({ message: 'warehouseId phải là số nguyên' })
  warehouseId!: number;

  @IsOptional()
  orderedAt?: Date;

  @IsOptional()
  expectedAt?: Date;

  @IsArray({ message: 'Danh sách sản phẩm phải là một mảng' })
  @ArrayMinSize(1, { message: 'Đơn nhập hàng phải có ít nhất 1 sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemRequestDto)
  items!: PurchaseOrderItemRequestDto[];
}

export class UpdatePurchaseOrderStatusDto {
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsEnum(PurchaseOrderStatus, { message: 'Trạng thái đơn hàng không hợp lệ' })
  status!: PurchaseOrderStatus;
}

export class PurchaseOrderIdParamDto {
  @IsNumberString({}, { message: 'ID phải là số' })
  id!: string;
}

export interface PurchaseOrderItemResponse {
  id: string;
  productId: string;
  productSku?: string;
  productName?: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseOrderResponse {
  id: string;
  purchaseCode: string;
  supplierId: string;
  warehouseId: string;
  totalAmount: number;
  status: PurchaseOrderStatus;
  orderedAt?: Date | null;
  expectedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: PurchaseOrderItemResponse[];
}