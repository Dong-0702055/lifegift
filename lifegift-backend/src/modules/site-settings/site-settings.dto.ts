import { IsEmail, IsInt, IsNotEmpty, IsString, Min, MaxLength } from 'class-validator';

export class UpdateSiteSettingsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phonePrimary!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phoneSecondary!: string;

  @IsEmail()
  @MaxLength(150)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mapQuery!: string;

  @IsInt()
  @Min(0)
  hanoiFee!: number;

  @IsInt()
  @Min(0)
  majorCityFee!: number;

  @IsInt()
  @Min(0)
  otherProvinceFee!: number;

  @IsInt()
  @Min(0)
  freeShippingThreshold!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  bankName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  bankAccount!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  bankOwner!: string;
}