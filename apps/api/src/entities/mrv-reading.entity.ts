import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Business } from './business.entity';
import { GreenAsset } from './green-asset.entity';

@Entity('mrv_readings')
export class MrvReading {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'asset_id' })
  assetId!: string;

  @ManyToOne(() => GreenAsset)
  @JoinColumn({ name: 'asset_id' })
  asset!: GreenAsset;

  @Column({ name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'reading_date', type: 'date' })
  readingDate!: string;

  @Column({ name: 'kwh_generated', type: 'numeric', precision: 10, scale: 3, nullable: true })
  kwhGenerated?: number;

  @Column({ name: 'ev_km_charged', type: 'numeric', precision: 10, scale: 2, nullable: true })
  evKmCharged?: number;

  @Column({ name: 'clean_cooking_meals', type: 'int', nullable: true })
  cleanCookingMeals?: number;

  @Column({ name: 'carbon_kg_avoided', type: 'numeric', precision: 10, scale: 3, nullable: true })
  carbonKgAvoided?: number;

  @Column({ default: false })
  verified!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
