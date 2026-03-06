import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { KycStatus } from '../../entities/business.entity';

export class KycReviewDto {
  @IsEnum(KycStatus)
  status!: KycStatus.APPROVED | KycStatus.REJECTED;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BusinessSearchDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(KycStatus)
  kycStatus?: KycStatus;

  @IsOptional()
  @IsString()
  paymentMode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}
