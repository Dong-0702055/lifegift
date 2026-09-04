import { IsInt, IsNotEmpty, IsNumberString, Min } from 'class-validator';

export class AddCartItemRequestDto {
  @IsNotEmpty({ message: 'Product ID không được để trống' })
  @IsInt({ message: 'productId phải là số nguyên' })
  productId!: number;

  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @IsInt({ message: 'quantity phải là số nguyên' })
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  quantity!: number;
}

export class UpdateCartItemRequestDto {
  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @IsInt({ message: 'quantity phải là số nguyên' })
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  quantity!: number;
}

export class CartItemIdParamDto {
  @IsNumberString({}, { message: 'cartItemId phải là số nguyên' })
  cartItemId!: string;
}

export interface CartItemResponse {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CartResponse {
  id: string;
  userId: string;
  items: CartItemResponse[];
  totalQuantity: number;
  subtotal: number;
}