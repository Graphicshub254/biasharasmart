import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Business } from './business.entity';

@Entity('green_assets')
export class GreenAsset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'asset_type', length: 50 })
  assetType!: string; // SOLAR | EV | CLEAN_COOKING | WIND

  @Column({ name: 'asset_name', length: 255 })
  assetName!: string;

  @Column({ name: 'capacity_kw', type: 'numeric', precision: 10, scale: 2, nullable: true })
  capacityKw?: number;

  @Column({ name: 'installation_date', type: 'date', nullable: true })
  installationDate?: string;

  @Column({ name: 'etims_item_code', length: 50, nullable: true })
  etimsItemCode?: string;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
