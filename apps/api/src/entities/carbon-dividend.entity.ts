import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Business } from './business.entity';

@Entity('carbon_dividends')
@Unique(['businessId', 'periodMonth', 'periodYear'])
export class CarbonDividend {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'period_month', type: 'int' })
  periodMonth!: number;

  @Column({ name: 'period_year', type: 'int' })
  periodYear!: number;

  @Column({ name: 'total_kwh', type: 'numeric', precision: 12, scale: 3, default: 0 })
  totalKwh!: number;

  @Column({ name: 'carbon_kg_avoided', type: 'numeric', precision: 12, scale: 3, default: 0 })
  carbonKgAvoided!: number;

  @Column({ name: 'dividend_kes', type: 'numeric', precision: 12, scale: 2, default: 0 })
  dividendKes!: number;

  @Column({ length: 20, default: 'pending' })
  status!: string; // pending | verified | paid

  @Column({ name: 'kncr_ref', length: 100, nullable: true })
  kncrRef?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
