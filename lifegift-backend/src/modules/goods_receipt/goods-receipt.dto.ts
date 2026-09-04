import { IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGoodsReceiptDto {
  @IsNotEmpty({ message: 'purchaseOrderId không được để trống' })
  @IsInt({ message: 'purchaseOrderId phải là số nguyên' })
  purchaseOrderId!: number;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  @MaxLength(500, { message: 'Ghi chú tối đa 500 ký tự' })
  note?: string;
}

export class GoodsReceiptIdParamDto {
  @IsNumberString({}, { message: 'ID phải là số' })
  id!: string;
}

export interface GoodsReceiptResponse {
  id: string;
  receiptCode: string;
  purchaseOrderId: string;
  purchaseCode?: string;
  warehouseId: string;
  warehouseName?: string;
  receivedBy: string;
  receivedByName?: string;
  totalAmount: number;
  note: string | null;
  receivedAt: Date;
}