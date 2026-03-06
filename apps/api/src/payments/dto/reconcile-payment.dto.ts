import { IsUUID, IsString, IsNumber, Min } from 'class-validator';

export class ReconcilePaymentDto {
  @IsUUID()
  businessId!: string;

  @IsUUID()
  invoiceId!: string;

  @IsString()
  mpesaCode!: string;

  @IsNumber()
  @Min(1)
  amountKes!: number;

  @IsString()
  phone!: string;
}
