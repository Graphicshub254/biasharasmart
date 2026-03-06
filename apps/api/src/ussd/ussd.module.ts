import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../entities/business.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { VatReturn } from '../entities/vat-return.entity';
import { UssdController } from './ussd.controller';
import { UssdService } from './ussd.service';
import { PaymentsModule } from '../payments/payments.module';
import { ScoreModule } from '../score/score.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business, Invoice, Payment, VatReturn]),
    PaymentsModule,
    ScoreModule,
  ],
  controllers: [UssdController],
  providers: [UssdService],
})
export class UssdModule {}
