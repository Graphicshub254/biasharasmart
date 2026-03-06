import { IsUUID, Matches } from 'class-validator';

export class InitiatePaymentDto {
  @IsUUID()
  invoiceId!: string;

  @Matches(/^254[0-9]{9}$/, {
    message: 'Phone number must be in the format 254XXXXXXXXX',
  })
  phone!: string;
}
