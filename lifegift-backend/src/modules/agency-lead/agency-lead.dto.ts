import { IsIn, IsNotEmpty, IsNumberString, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export const AGENCY_LEAD_STATUSES = ['PENDING', 'ACTIVE', 'INACTIVE', 'REJECTED'] as const;

export class CreateAgencyLeadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName!: string;

  @IsString()
  @Matches(/^(0|\+84)[0-9]{9,10}$/)
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  area!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}

export class UpdateAgencyLeadStatusDto {
  @IsString()
  @IsIn(AGENCY_LEAD_STATUSES)
  status!: (typeof AGENCY_LEAD_STATUSES)[number];
}

export class AgencyLeadIdParamDto {
  @IsNumberString()
  id!: string;
}