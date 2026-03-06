import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Business } from './business.entity';

@Entity('notification_tokens')
export class NotificationToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @Column({ name: 'expo_token', length: 200, unique: true })
  expoToken!: string;

  @Column({ name: 'device_id', length: 100, nullable: true })
  deviceId?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business!: Business;
}
