import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VatReturn } from '../entities/vat-return.entity';
import { Invoice } from '../entities/invoice.entity';
import { Ledger } from '../entities/ledger.entity';
import { VatService } from './vat.service';
import { VatController } from './vat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VatReturn, Invoice, Ledger])],
  providers: [VatService],
  controllers: [VatController],
  exports: [VatService],
})
export class VatModule {}
