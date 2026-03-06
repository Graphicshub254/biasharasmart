import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { WhtLiability } from '../entities/wht-liability.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Payment, WhtLiability])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
