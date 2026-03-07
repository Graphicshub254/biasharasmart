import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Business } from './business.entity';

export enum FraudEventType {
  SIM_SWAP = 'SIM_SWAP',
  ANOMALY = 'ANOMALY',
  VAULT_TRIGGERED = 'VAULT_TRIGGERED',
  LARGE_TRANSACTION = 'LARGE_TRANSACTION',
}

export enum FraudSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('fraud_events')
export class FraudEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'event_type',
  })
  eventType!: FraudEventType;

  @Column({
    type: 'varchar',
    length: 20,
    default: FraudSeverity.MEDIUM,
  })
  severity!: FraudSeverity;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: any;

  @Column({ type: 'boolean', default: false })
  resolved!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
