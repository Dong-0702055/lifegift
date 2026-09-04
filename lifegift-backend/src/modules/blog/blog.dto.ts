import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum CategoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
}

// --- DTOs cho Danh mục Bài viết ---
export class BlogCategoryDto {
  @IsString({ message: 'Tên danh mục phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @MaxLength(150, { message: 'Tên danh mục tối đa 150 ký tự' })
  name!: string;

  @IsString({ message: 'Slug phải là chuỗi' })
  @IsNotEmpty({ message: 'Slug không được để trống' })
  @MaxLength(180, { message: 'Slug tối đa 180 ký tự' })
  slug!: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @MaxLength(500, { message: 'Mô tả tối đa 500 ký tự' })
  description?: string;

  @IsOptional()
  @IsEnum(CategoryStatus, { message: 'Trạng thái không hợp lệ' })
  status?: CategoryStatus;
}

// --- DTOs cho Bài viết ---
export class BlogPostDto {
  @IsNotEmpty({ message: 'Category ID không được để trống' })
  @IsNumber({}, { message: 'Category ID phải là số' })
  categoryId!: number | string;

  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MaxLength(255, { message: 'Tiêu đề tối đa 255 ký tự' })
  title!: string;

  @IsString({ message: 'Slug phải là chuỗi' })
  @IsNotEmpty({ message: 'Slug không được để trống' })
  @MaxLength(300, { message: 'Slug tối đa 300 ký tự' })
  slug!: string;

  @IsOptional()
  @IsString({ message: 'Ảnh đại diện phải là chuỗi' })
  @MaxLength(500, { message: 'URL ảnh đại diện tối đa 500 ký tự' })
  thumbnail?: string;

  @IsOptional()
  @IsString({ message: 'Tóm tắt phải là chuỗi' })
  @MaxLength(1000, { message: 'Tóm tắt tối đa 1000 ký tự' })
  summary?: string;

  @IsOptional()
  @IsString({ message: 'Nội dung phải là chuỗi' })
  content?: string;

  @IsOptional()
  @IsEnum(PostStatus, { message: 'Trạng thái không hợp lệ' })
  status?: PostStatus;
}

// --- Params DTOs ---
export class BlogIdParamDto {
  @IsNumberString({}, { message: 'ID phải là số' })
  id!: string;
}

export class BlogCategoryIdParamDto {
  @IsNumberString({}, { message: 'Category ID phải là số' })
  categoryId!: string;
}

export class BlogSlugParamDto {
  @IsString({ message: 'Slug phải là chuỗi' })
  @IsNotEmpty({ message: 'Slug không được để trống' })
  slug!: string;
}

// --- Interfaces Response ---
export interface BlogCategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: CategoryStatus;
}

export interface BlogPostResponse {
  id: string;
  categoryId: string;
  categoryName?: string | null;
  authorId: string;
  authorName?: string | null;
  title: string;
  slug: string;
  thumbnail: string | null;
  summary: string | null;
  content: string | null;
  status: PostStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}