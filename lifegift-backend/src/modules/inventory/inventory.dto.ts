import { IsInt, IsNotEmpty, IsNumberString, Min } from 'class-validator';

export class InventoryRequestDto {
  @IsNotEmpty({ message: 'warehouseId không được để trống' })
  warehouseId!: number;

  @IsNotEmpty({ message: 'productId không được để trống' })
  productId!: number;

  @IsNotEmpty({ message: 'quantity không được để trống' })
  @IsInt({ message: 'quantity phải là số nguyên' })
  @Min(0, { message: 'Quantity không được nhỏ hơn 0' })
  quantity!: number;

  @IsNotEmpty({ message: 'minStock không được để trống' })
  @IsInt({ message: 'minStock phải là số nguyên' })
  @Min(0, { message: 'Min stock không được nhỏ hơn 0' })
  minStock!: number;
}

export class InventoryIdParamDto {
  @IsNumberString({}, { message: 'ID phải là số nguyên' })
  id!: string;
}

export class WarehouseIdParamDto {
  @IsNumberString({}, { message: 'warehouseId phải là số nguyên' })
  warehouseId!: string;
}

export class ProductIdParamDto {
  @IsNumberString({}, { message: 'productId phải là số nguyên' })
  productId!: string;
}

export interface InventoryResponse {
  id: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minStock: number;
  lowStock: boolean;
  updatedAt: Date;
}