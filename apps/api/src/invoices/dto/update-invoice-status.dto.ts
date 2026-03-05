import { IsEnum } from 'class-validator';
import { InvoiceStatus } from '../../entities/invoice.entity';

export class UpdateInvoiceStatusDto {
  @IsEnum(InvoiceStatus)
  status!: InvoiceStatus;
}
