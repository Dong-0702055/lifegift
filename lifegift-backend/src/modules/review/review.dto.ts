import {
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

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  HIDDEN = 'HIDDEN',
}

export class CreateReviewDto {
  @IsNotEmpty({ message: 'Order ID không được để trống' })
  @IsNumber({}, { message: 'Order ID phải là số' })
  orderId!: number | string;

  @IsNotEmpty({ message: 'Product ID không được để trống' })
  @IsNumber({}, { message: 'Product ID phải là số' })
  productId!: number | string;

  @IsNotEmpty({ message: 'Điểm đánh giá không được để trống' })
  @IsNumber({}, { message: 'Điểm đánh giá phải là số' })
  @Min(1, { message: 'Đánh giá tối thiểu là 1 sao' })
  @Max(5, { message: 'Đánh giá tối đa là 5 sao' })
  rating!: number;

  @IsOptional()
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @MaxLength(200, { message: 'Tiêu đề tối đa 200 ký tự' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Nội dung phải là chuỗi' })
  content?: string;
}

export class UpdateReviewStatusDto {
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsEnum(ReviewStatus, { message: 'Trạng thái không hợp lệ' })
  status!: ReviewStatus;
}

export class ReviewIdParamDto {
  @IsNumberString({}, { message: 'ID đánh giá phải là số' })
  id!: string;
}

// BỔ SUNG: DTO dùng riêng cho param :productId trên URL
export class ReviewProductIdParamDto {
  @IsNumberString({}, { message: 'ID sản phẩm phải là một số nguyên' })
  productId!: string;
}

export interface ReviewResponse {
  id: string;
  userId: string;
  userName?: string;
  productId: string;
  orderId: string;
  rating: number;
  title: string | null;
  content: string | null;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}