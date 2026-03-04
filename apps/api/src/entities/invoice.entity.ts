import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Business } from './business.entity';
import { Payment } from './payment.entity';

export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING_KRA = 'pending_kra',
  ISSUED = 'issued',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, (business) => business.invoices)
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'customer_name', length: 255, nullable: true })
  customerName?: string;

  @Column({ name: 'customer_phone', length: 20, nullable: true })
  customerPhone?: string;

  @Column({ type: 'jsonb', name: 'line_items', default: [] })
  lineItems!: any[];

  @Column({ name: 'subtotal_kes', type: 'numeric', precision: 15, scale: 2 })
  subtotalKes!: number;

  @Column({ name: 'vat_amount_kes', type: 'numeric', precision: 15, scale: 2, default: 0 })
  vatAmountKes!: number;

  @Column({ name: 'total_kes', type: 'numeric', precision: 15, scale: 2 })
  totalKes!: number;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status!: InvoiceStatus;

  @Column({ name: 'cu_number', length: 100, nullable: true })
  cuNumber?: string;

  @Column({ name: 'offline_queued', default: false })
  offlineQueued!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments!: Payment[];
}
