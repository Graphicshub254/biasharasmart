import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Business } from './business.entity';
import { Payment } from './payment.entity';

export enum WhtLiabilityStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Entity('wht_liabilities')
export class WhtLiability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'payment_id', nullable: true })
  paymentId?: string;

  @ManyToOne(() => Payment)
  @JoinColumn({ name: 'payment_id' })
  payment?: Payment;

  @Column({ name: 'amount_kes', type: 'numeric', precision: 15, scale: 2 })
  amountKes!: number;

  @Column({ name: 'due_date', type: 'timestamptz' })
  dueDate!: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: WhtLiabilityStatus.PENDING,
  })
  status!: WhtLiabilityStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
