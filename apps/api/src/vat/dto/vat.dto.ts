import { IsNumber, IsUUID, Min, Max, IsOptional } from 'class-validator';

export class CalculateVatDto {
  @IsNumber()
  @Min(1)
  @Max(12)
  @IsOptional()
  month?: number;

  @IsNumber()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  year?: number;
}

export class VatReturnResponseDto {
  id!: string;
  businessId!: string;
  periodMonth!: number;
  periodYear!: number;
  outputVatKes!: number;
  inputVatKes!: number;
  netVatKes!: number;
  status!: string;
  gavaconnectAcknowledgement?: string;
  submittedAt?: Date;
  createdAt!: Date;
}
