import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Invoice } from './invoice.entity';
import { Payment } from './payment.entity';
import { VatReturn } from './vat-return.entity';

export enum BusinessType {
  SOLE_PROPRIETOR = 'sole_proprietor',
  PARTNERSHIP = 'partnership',
  LIMITED_COMPANY = 'limited_company',
}

export enum KycStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'kra_pin', length: 11, unique: true })
  kraPin!: string;

  @Column({ name: 'business_name', length: 255 })
  businessName!: string;

  @Column({
    type: 'enum',
    enum: BusinessType,
    name: 'business_type',
  })
  businessType!: BusinessType;

  @Column({ name: 'mpesa_paybill', length: 20, nullable: true })
  mpesaPaybill?: string;

  @Column({ name: 'mpesa_till', length: 20, nullable: true })
  mpesaTill?: string;

  @Column({ name: 'cu_number', length: 50, nullable: true })
  cuNumber?: string;

  @Column({ name: 'gavaconnect_id', length: 100, nullable: true })
  gavaconnectId?: string;

  @Column({
    type: 'enum',
    enum: KycStatus,
    name: 'kyc_status',
    default: KycStatus.PENDING,
  })
  kycStatus!: KycStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Invoice, (invoice) => invoice.business)
  invoices!: Invoice[];

  @OneToMany(() => Payment, (payment) => payment.business)
  payments!: Payment[];

  @OneToMany(() => VatReturn, (vatReturn) => vatReturn.business)
  vatReturns!: VatReturn[];
}
