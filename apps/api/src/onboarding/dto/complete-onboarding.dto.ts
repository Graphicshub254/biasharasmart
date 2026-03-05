import { IsEnum, IsOptional, IsString, Length, Matches, IsUrl } from 'class-validator';
import { BusinessType } from '../../entities/business.entity';

export class CompleteOnboardingDto {
  @IsEnum(BusinessType)
  businessType!: BusinessType;

  @IsString()
  @Length(11, 11)
  @Matches(/^[AP]\d{9}[A-Z]$/, { message: 'Invalid KRA PIN format' })
  kraPin!: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  @Length(5, 10)
  paybill?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['paybill', 'till'])
  paybillType?: 'paybill' | 'till';

  @IsString()
  @IsUrl()
  kycDocumentUrl!: string;
}
