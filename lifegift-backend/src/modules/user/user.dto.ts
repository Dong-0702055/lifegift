import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// 1. Response DTO
export interface UserResponse {
  id: string;
  username: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  roles: string[];
}

// 2. DTO Cập nhật thông tin User
export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @MaxLength(150, { message: 'Họ tên tối đa 150 ký tự' })
  fullName?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^(0|\+84)[0-9]{9,10}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(150, { message: 'Email tối đa 150 ký tự' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'URL Avatar phải là chuỗi ký tự' })
  avatar?: string;
}

// 3. DTO Đổi mật khẩu
export class ChangePasswordDto {
  @IsString({ message: 'Mật khẩu cũ phải là chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống' })
  oldPassword!: string;

  @IsString({ message: 'Mật khẩu mới phải là chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  @MaxLength(100, { message: 'Mật khẩu mới tối đa 100 ký tự' })
  newPassword!: string;
}

// 4. DTO Validate Param ID
export class UserIdParamDto {
  @IsNumberString({}, { message: 'ID người dùng phải là một số nguyên' })
  id!: string;
}