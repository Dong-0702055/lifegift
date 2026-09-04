import { IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export enum SupplierStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateSupplierDto {
  @IsString({ message: 'Mã nhà cung cấp phải là chuỗi' })
  @IsNotEmpty({ message: 'Mã nhà cung cấp không được để trống' })
  @MaxLength(50, { message: 'Mã nhà cung cấp tối đa 50 ký tự' })
  code!: string;

  @IsString({ message: 'Tên nhà cung cấp phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên nhà cung cấp không được để trống' })
  @MaxLength(200, { message: 'Tên nhà cung cấp tối đa 200 ký tự' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @MaxLength(20, { message: 'Số điện thoại tối đa 20 ký tự' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(150, { message: 'Email tối đa 150 ký tự' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  @MaxLength(255, { message: 'Địa chỉ tối đa 255 ký tự' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Mã số thuế phải là chuỗi' })
  @MaxLength(50, { message: 'Mã số thuế tối đa 50 ký tự' })
  taxCode?: string;

  @IsOptional()
  @IsEnum(SupplierStatus, { message: 'Trạng thái không hợp lệ' })
  status?: SupplierStatus;
}

export class UpdateSupplierDto {
  @IsOptional()
  @IsString({ message: 'Tên nhà cung cấp phải là chuỗi' })
  @MaxLength(200, { message: 'Tên nhà cung cấp tối đa 200 ký tự' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @MaxLength(20, { message: 'Số điện thoại tối đa 20 ký tự' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(150, { message: 'Email tối đa 150 ký tự' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  @MaxLength(255, { message: 'Địa chỉ tối đa 255 ký tự' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Mã số thuế phải là chuỗi' })
  @MaxLength(50, { message: 'Mã số thuế tối đa 50 ký tự' })
  taxCode?: string;

  @IsOptional()
  @IsEnum(SupplierStatus, { message: 'Trạng thái không hợp lệ' })
  status?: SupplierStatus;
}

export class SupplierIdParamDto {
  @IsNumberString({}, { message: 'ID phải là số' })
  id!: string;
}

export interface SupplierResponse {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxCode: string | null;
  status: SupplierStatus;
  createdAt: Date;
  updatedAt: Date;
}