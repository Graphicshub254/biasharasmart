import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { Employee } from '../entities/employee.entity';
import { PayrollRun } from '../entities/payroll-run.entity';
import { Ledger } from '../entities/ledger.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, PayrollRun, Ledger])],
  controllers: [PayrollController],
  providers: [PayrollService],
})
export class PayrollModule {}
