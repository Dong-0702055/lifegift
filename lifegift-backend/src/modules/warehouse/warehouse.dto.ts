import { IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export enum WarehouseStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class WarehouseDto {
  @IsString({ message: 'Mã kho phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã kho không được để trống' })
  @MaxLength(50, { message: 'Mã kho tối đa 50 ký tự' })
  code!: string;

  @IsString({ message: 'Tên kho phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên kho không được để trống' })
  @MaxLength(150, { message: 'Tên kho tối đa 150 ký tự' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  @MaxLength(255, { message: 'Địa chỉ tối đa 255 ký tự' })
  address?: string;

  @IsOptional()
  @IsEnum(WarehouseStatus, { message: 'Trạng thái kho không hợp lệ' })
  status?: WarehouseStatus;
}

export class WarehouseIdParamDto {
  @IsNumberString({}, { message: 'ID kho phải là một số nguyên' })
  id!: string;
}

export interface WarehouseResponse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}