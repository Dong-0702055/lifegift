import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export enum CategoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CategoryDto {
  @IsString({ message: 'Tên danh mục phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @MaxLength(150, { message: 'Tên danh mục tối đa 150 ký tự' })
  name!: string;

  @IsString({ message: 'Slug phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Slug không được để trống' })
  @MaxLength(180, { message: 'Slug tối đa 180 ký tự' })
  slug!: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'URL hình ảnh phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'URL hình ảnh tối đa 500 ký tự' })
  imageUrl?: string;

  @IsOptional()
  parentId?: number | string;

  @IsOptional()
  @IsEnum(CategoryStatus, { message: 'Trạng thái không hợp lệ' })
  status?: CategoryStatus;
}

export interface CategoryResponse {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}