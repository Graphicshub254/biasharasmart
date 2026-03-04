import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Business } from './business.entity';

export enum VatReturnStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  SUBMITTED = 'submitted',
  ACKNOWLEDGED = 'acknowledged',
}

@Entity('vat_returns')
@Unique(['businessId', 'periodMonth', 'periodYear'])
export class VatReturn {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, (business) => business.vatReturns)
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'period_month', type: 'integer' })
  periodMonth!: number;

  @Column({ name: 'period_year', type: 'integer' })
  periodYear!: number;

  @Column({ name: 'output_vat_kes', type: 'numeric', precision: 15, scale: 2, default: 0 })
  outputVatKes!: number;

  @Column({ name: 'input_vat_kes', type: 'numeric', precision: 15, scale: 2, default: 0 })
  inputVatKes!: number;

  @Column({ name: 'net_vat_kes', type: 'numeric', precision: 15, scale: 2, default: 0 })
  netVatKes!: number;

  @Column({
    type: 'enum',
    enum: VatReturnStatus,
    default: VatReturnStatus.DRAFT,
  })
  status!: VatReturnStatus;

  @Column({ name: 'gavaconnect_acknowledgement', length: 100, nullable: true })
  gavaconnectAcknowledgement?: string;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
