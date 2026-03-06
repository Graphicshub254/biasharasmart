import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Business } from './business.entity';
import { Employee } from './employee.entity';

@Entity('payroll_runs')
export class PayrollRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId!: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @ManyToOne(() => Employee, (employee) => employee.payrollRuns)
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @Column({ name: 'run_date', type: 'date' })
  runDate!: Date;

  @Column({ name: 'days_worked', type: 'numeric', precision: 4, scale: 1, default: 1 })
  daysWorked!: number;

  @Column({ name: 'gross_kes', type: 'numeric', precision: 12, scale: 2 })
  grossKes!: number;

  @Column({ name: 'shif_deduction_kes', type: 'numeric', precision: 10, scale: 2, default: 0 })
  shifDeductionKes!: number;

  @Column({ name: 'nssf_deduction_kes', type: 'numeric', precision: 10, scale: 2, default: 0 })
  nssfDeductionKes!: number;

  @Column({ name: 'net_kes', type: 'numeric', precision: 12, scale: 2 })
  netKes!: number;

  @Column({ name: 'mpesa_ref', length: 50, nullable: true })
  mpesaRef?: string;

  @Column({ length: 20, default: 'pending' })
  status!: string; // 'pending' | 'paid' | 'failed'

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
