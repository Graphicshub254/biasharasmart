import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Business } from './business.entity';
import { Invoice } from './invoice.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
  REVERSED = 'reversed',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, (business) => business.payments)
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'invoice_id', nullable: true })
  invoiceId?: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments)
  @JoinColumn({ name: 'invoice_id' })
  invoice?: Invoice;

  @Column({ name: 'mpesa_transaction_id', length: 50, unique: true, nullable: true })
  mpesaTransactionId?: string;

  @Column({ name: 'amount_kes', type: 'numeric', precision: 15, scale: 2 })
  amountKes!: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({ name: 'phone_number', length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ name: 'idempotency_key', length: 100, unique: true })
  idempotencyKey!: string;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
