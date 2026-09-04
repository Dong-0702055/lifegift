import { IsEnum, IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export enum InventoryTransactionType {
  IMPORT = 'IMPORT',
  SALE = 'SALE',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
}

export class InventoryTransactionRequestDto {
  @IsNotEmpty({ message: 'inventoryId không được để trống' })
  inventoryId!: number;

  @IsNotEmpty({ message: 'transactionType không được để trống' })
  @IsEnum(InventoryTransactionType, { message: 'Loại giao dịch không hợp lệ' })
  transactionType!: InventoryTransactionType;

  @IsNotEmpty({ message: 'quantity không được để trống' })
  @IsInt({ message: 'quantity phải là số nguyên' })
  @Min(1, { message: 'Số lượng giao dịch phải lớn hơn 0' })
  quantity!: number;

  @IsOptional()
  @IsString({ message: 'referenceType phải là chuỗi' })
  @MaxLength(50, { message: 'referenceType tối đa 50 ký tự' })
  referenceType?: string;

  @IsOptional()
  referenceId?: number;

  @IsOptional()
  @IsString({ message: 'note phải là chuỗi' })
  @MaxLength(500, { message: 'Ghi chú tối đa 500 ký tự' })
  note?: string;
}

export class TransactionIdParamDto {
  @IsNumberString({}, { message: 'ID phải là số nguyên' })
  id!: string;
}

export interface InventoryTransactionResponse {
  id: string;
  inventoryId: string;
  warehouseId: string;
  productId: string;
  transactionType: string;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: Date;
}