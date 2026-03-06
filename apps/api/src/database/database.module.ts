import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Business } from '../entities/business.entity';
import { Ledger } from '../entities/ledger.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { VatReturn } from '../entities/vat-return.entity';
import { WhtLiability } from '../entities/wht-liability.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.getOrThrow<TypeOrmModuleOptions>('database'),
    }),
    TypeOrmModule.forFeature([Business, Ledger, Invoice, Payment, VatReturn, WhtLiability]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
