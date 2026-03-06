import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Business } from './business.entity';
import { PayrollRun } from './payroll-run.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId!: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'full_name', length: 255 })
  fullName!: string;

  @Column({ length: 20 })
  phone!: string;

  @Column({ name: 'id_number', length: 20, unique: true, nullable: true })
  idNumber?: string;

  @Column({ name: 'daily_rate_kes', type: 'numeric', precision: 10, scale: 2, default: 0 })
  dailyRateKes!: number;

  @Column({ name: 'employment_type', length: 20, default: 'casual' })
  employmentType!: string; // 'casual' | 'permanent'

  @Column({ name: 'nssf_number', length: 20, nullable: true })
  nssfNumber?: string;

  @Column({ name: 'nhif_number', length: 20, nullable: true })
  nhifNumber?: string;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => PayrollRun, (run) => run.employee)
  payrollRuns!: PayrollRun[];
}
