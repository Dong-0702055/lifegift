import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum PricingType {
  FIXED_PRICE = 'FIXED_PRICE',
  CONTACT_FOR_PRICE = 'CONTACT_FOR_PRICE',
}

export enum StockStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  PRE_ORDER = 'PRE_ORDER',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT',
}

export class ProductDto {
  @IsNotEmpty({ message: 'Category không được để trống' })
  categoryId!: number | string;

  @IsOptional()
  brandId?: number | string;

  @IsString({ message: 'SKU phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'SKU không được để trống' })
  @MaxLength(80, { message: 'SKU tối đa 80 ký tự' })
  sku!: string;

  @IsString({ message: 'Tên sản phẩm phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @MaxLength(255, { message: 'Tên sản phẩm tối đa 255 ký tự' })
  name!: string;

  @IsString({ message: 'Slug phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Slug không được để trống' })
  @MaxLength(280, { message: 'Slug tối đa 280 ký tự' })
  slug!: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả ngắn phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Mô tả ngắn tối đa 500 ký tự' })
  shortDescription?: string;

  @IsNotEmpty({ message: 'Giá sản phẩm không được để trống' })
  @IsNumber({}, { message: 'Giá sản phẩm phải là số' })
  @Min(0, { message: 'Giá không được âm' })
  price!: number;

  @IsOptional()
  @IsNumber({}, { message: 'Giá khuyến mãi phải là số' })
  @Min(0, { message: 'Giá khuyến mãi không được âm' })
  salePrice?: number;

  @IsOptional()
  @IsString({ message: 'Đơn vị tính phải là chuỗi ký tự' })
  @MaxLength(50, { message: 'Đơn vị tính tối đa 50 ký tự' })
  unit?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Khối lượng phải là số' })
  @Min(0, { message: 'Khối lượng không được âm' })
  weight?: number;

  @IsOptional()
  @IsString({ message: 'Xuất xứ phải là chuỗi ký tự' })
  @MaxLength(150, { message: 'Xuất xứ tối đa 150 ký tự' })
  origin?: string;

  @IsOptional()
  @IsEnum(PricingType, { message: 'Loại định giá không hợp lệ' })
  pricingType?: PricingType;

  @IsOptional()
  @IsEnum(StockStatus, { message: 'Trạng thái kho không hợp lệ' })
  stockStatus?: StockStatus;

  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Trạng thái sản phẩm không hợp lệ' })
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean({ message: 'isFeatured phải là boolean' })
  isFeatured?: boolean;

  @IsOptional()
  @IsArray({ message: 'imageUrls phải là một mảng' })
  @IsString({ each: true, message: 'Mỗi URL hình ảnh phải là chuỗi' })
  imageUrls?: string[];
}

export class ProductIdParamDto {
  @IsNumberString({}, { message: 'ID sản phẩm phải là một số nguyên' })
  id!: string;
}
export class CategoryIdParamDto {
  @IsNumberString({}, { message: 'ID danh mục phải là một số nguyên' })
  categoryId!: string;
}

export class BrandIdParamDto {
  @IsNumberString({}, { message: 'ID thương hiệu phải là một số nguyên' })
  brandId!: string;
}

export interface ProductImageResponse {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductResponse {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  brandId: string | null;
  brandName: string | null;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  salePrice: number | null;
  unit: string;
  weight: number | null;
  origin: string | null;
  pricingType: string;
  stockStatus: string;
  status: string;
  isFeatured: boolean;
  images: ProductImageResponse[];
  createdAt: Date;
  updatedAt: Date;
}