import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../entities/employee.entity';
import { PayrollRun } from '../entities/payroll-run.entity';
import { Ledger, EntryType } from '../entities/ledger.entity';
import { AddEmployeeDto, RunPayrollDto } from './dto/payroll.dto';
import { SHIF_RATE, NSSF_TIER_1_MAX, NSSF_TIER_1_RATE, NSSF_TIER_2_MAX, NSSF_TIER_2_RATE } from '@biasharasmart/shared-types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(PayrollRun)
    private payrollRunRepo: Repository<PayrollRun>,
    @InjectRepository(Ledger)
    private ledgerRepo: Repository<Ledger>,
  ) {}

  async listEmployees(businessId: string) {
    return this.employeeRepo.find({
      where: { businessId, active: true },
      order: { fullName: 'ASC' },
    });
  }

  async addEmployee(businessId: string, dto: AddEmployeeDto) {
    const employee = this.employeeRepo.create({
      ...dto,
      businessId,
    });
    return this.employeeRepo.save(employee);
  }

  async deactivateEmployee(businessId: string, id: string) {
    const employee = await this.employeeRepo.findOne({
      where: { id, businessId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    employee.active = false;
    return this.employeeRepo.save(employee);
  }

  calculateDeductions(grossKes: number): {
    shifDeduction: number;
    nssfDeduction: number;
    netKes: number;
  } {
    // SHIF: 2.75% of gross
    const shifDeduction = +(grossKes * SHIF_RATE).toFixed(2);

    // NSSF Year 4 (2026): Tier 1 + Tier 2
    let nssfDeduction = 0;
    if (grossKes <= NSSF_TIER_1_MAX) {
      nssfDeduction = +(grossKes * NSSF_TIER_1_RATE).toFixed(2);
    } else if (grossKes <= NSSF_TIER_2_MAX) {
      nssfDeduction = +(NSSF_TIER_1_MAX * NSSF_TIER_1_RATE + (grossKes - NSSF_TIER_1_MAX) * NSSF_TIER_2_RATE).toFixed(2);
    } else {
      nssfDeduction = +(NSSF_TIER_1_MAX * NSSF_TIER_1_RATE + (NSSF_TIER_2_MAX - NSSF_TIER_1_MAX) * NSSF_TIER_2_RATE).toFixed(2);
    }

    const netKes = +(grossKes - shifDeduction - nssfDeduction).toFixed(2);
    return { shifDeduction, nssfDeduction, netKes };
  }

  async runPayroll(businessId: string, dto: RunPayrollDto) {
    const results = [];

    for (const entry of dto.entries) {
      const employee = await this.employeeRepo.findOne({
        where: { id: entry.employeeId, businessId, active: true },
      });
      if (!employee) continue;

      const grossKes = +(employee.dailyRateKes * entry.daysWorked).toFixed(2);
      const { shifDeduction, nssfDeduction, netKes } = this.calculateDeductions(grossKes);

      // B2C stub (sandbox) — real Co-op Bank B2C in T4.x
      const mpesaRef = `B2C_${Date.now()}_${employee.id.slice(-6)}`;

      const run = await this.payrollRunRepo.save(
        this.payrollRunRepo.create({
          businessId,
          employeeId: employee.id,
          runDate: new Date(dto.date),
          daysWorked: entry.daysWorked,
          grossKes,
          shifDeductionKes: shifDeduction,
          nssfDeductionKes: nssfDeduction,
          netKes,
          mpesaRef,
          status: 'paid', // sandbox: always success
        })
      );

      // Write ledger entry
      await this.ledgerRepo.save({
        id: uuidv4(),
        businessId,
        entryType: EntryType.PAYROLL,
        amountKes: netKes,
        referenceId: run.id,
        checksum: `payroll_${mpesaRef}_${Date.now()}`,
        metadata: {
          employeeName: employee.fullName,
          gross: grossKes,
          shif: shifDeduction,
          nssf: nssfDeduction,
          net: netKes,
        },
      });

      results.push({
        employee: employee.fullName,
        grossKes,
        shifDeduction,
        nssfDeduction,
        netKes,
        mpesaRef,
      });
    }

    return {
      date: dto.date,
      results,
      totalNet: results.reduce((s, r) => s + r.netKes, 0),
    };
  }

  async getHistory(businessId: string) {
    return this.payrollRunRepo.find({
      where: { businessId },
      relations: ['employee'],
      order: { runDate: 'DESC', createdAt: 'DESC' },
    });
  }
}
