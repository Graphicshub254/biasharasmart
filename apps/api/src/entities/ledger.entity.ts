import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

export enum EntryType {
  INVOICE_ISSUED = 'invoice_issued',
  PAYMENT_RECEIVED = 'payment_received',
  VAT_COMPUTED = 'vat_computed',
  REFUND = 'refund',
  PAYROLL = 'payroll',
}

@Entity('ledger')
export class Ledger {
  @PrimaryColumn('uuid')
  readonly id!: string;

  @PrimaryColumn('uuid', { name: 'business_id' })
  readonly businessId!: string;

  @Column({
    type: 'enum',
    enum: EntryType,
    name: 'entry_type',
  })
  readonly entryType!: EntryType;

  @Column({ name: 'amount_kes', type: 'numeric', precision: 15, scale: 2 })
  readonly amountKes!: number;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  readonly referenceId?: string;

  @Column({ length: 64 })
  readonly checksum!: string;

  @Column({ name: 'previous_checksum', length: 64, nullable: true })
  readonly previousChecksum?: string;

  @Column({ type: 'jsonb', default: {} })
  readonly metadata!: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  readonly createdAt!: Date;
}
