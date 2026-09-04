import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterRequest {
  @IsString({ message: 'Username phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Username không được để trống' })
  @MinLength(4, { message: 'Username phải có ít nhất 4 ký tự' })
  @MaxLength(50, { message: 'Username tối đa 50 ký tự' })
  username!: string;

  @IsString({ message: 'Password phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Password không được để trống' })
  @MinLength(6, { message: 'Password phải có ít nhất 6 ký tự' })
  @MaxLength(100, { message: 'Password tối đa 100 ký tự' })
  password!: string;

  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @MaxLength(150, { message: 'Họ tên tối đa 150 ký tự' })
  fullName!: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^(0|\+84)[0-9]{9,10}$/, { message: 'Số điện thoại không hợp lệ' })
  phone!: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(150, { message: 'Email tối đa 150 ký tự' })
  email?: string;
}

export class LoginRequest {
  @IsString({ message: 'Username phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Username không được để trống' })
  username!: string;

  @IsString({ message: 'Password phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Password không được để trống' })
  password!: string;
}

export class RefreshTokenRequest {
  @IsString({ message: 'RefreshToken phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'RefreshToken không được để trống' })
  refreshToken!: string;
}

export interface RegisterResponse {
  id: string;
  username: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  status: string;
  createdAt: Date;
}

export interface LoginResponse {
  id: string;
  username: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  status: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
export class LogoutRequest {
  @IsString({ message: 'RefreshToken phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'RefreshToken không được để trống' })
  refreshToken!: string;
}