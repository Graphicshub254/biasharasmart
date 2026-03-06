import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business, KycStatus } from '../entities/business.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { WhtLiability } from '../entities/wht-liability.entity';
import { KycReviewDto, BusinessSearchDto } from './dto/admin.dto';
import { GavaConnectService } from '../onboarding/gavaconnect.service';

export interface AuditLogEntry {
  id: string;
  action: string;
  adminName: string;
  adminRole: string;
  targetId: string;
  targetType: string;
  notes?: string;
  timestamp: string;
}

const auditLog: AuditLogEntry[] = [];

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(WhtLiability)
    private readonly whtLiabilityRepository: Repository<WhtLiability>,
    private readonly gavaConnectService: GavaConnectService,
  ) {}

  async getKycQueue(): Promise<Business[]> {
    return this.businessRepository.find({
      where: { kycStatus: KycStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }

  async reviewKyc(
    businessId: string,
    dto: KycReviewDto,
    admin: { name: string; role: string },
  ): Promise<Business> {
    const business = await this.businessRepository.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    business.kycStatus = dto.status;
    const updated = await this.businessRepository.save(business);
    this.writeAudit({
      action: `KYC_${dto.status.toUpperCase()}`,
      adminName: admin.name,
      adminRole: admin.role,
      targetId: businessId,
      targetType: 'business',
      notes: dto.notes,
    });
    return updated;
  }

  async searchBusinesses(query: BusinessSearchDto): Promise<{
    data: Business[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { search, kycStatus, paymentMode, page = 1, limit = 20 } = query;
    let qb = this.businessRepository.createQueryBuilder('b');
    if (search) {
      qb = qb.where(
        '(b.business_name ILIKE :s OR b.kra_pin ILIKE :s OR b.mpesa_paybill ILIKE :s)',
        { s: `%${search}%` },
      );
    }
    if (kycStatus) qb = qb.andWhere('b.kyc_status = :kycStatus', { kycStatus });
    if (paymentMode) qb = qb.andWhere('b.payment_mode = :paymentMode', { paymentMode });
    const [data, total] = await qb
      .orderBy('b.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit };
  }

  async getSystemHealth() {
    const results: Record<string, { status: string; latencyMs?: number; detail?: string }> = {};
    try {
      const t0 = Date.now();
      await this.businessRepository.count();
      results.database = { status: 'ok', latencyMs: Date.now() - t0 };
    } catch (e: any) {
      results.database = { status: 'error', detail: e.message };
    }
    try {
      const t0 = Date.now();
      await this.gavaConnectService.checkTcc('P051234567Z');
      results.gavaConnect = { status: 'ok', latencyMs: Date.now() - t0 };
    } catch {
      results.gavaConnect = { status: 'degraded', detail: 'Stub error' };
    }
    results.daraja = { status: 'ok', detail: 'sandbox' };
    const [businesses, invoices, payments, pendingKyc] = await Promise.all([
      this.businessRepository.count(),
      this.invoiceRepository.count(),
      this.paymentRepository.count(),
      this.businessRepository.count({ where: { kycStatus: KycStatus.PENDING } }),
    ]);
    const pendingLiabilities = await this.whtLiabilityRepository.find({
      where: { status: 'pending' as any },
    });
    const totalPendingKes = pendingLiabilities.reduce((sum, l) => sum + Number(l.amountKes), 0);
    const overdueCount = pendingLiabilities.filter(l => new Date(l.dueDate) < new Date()).length;
    const allOk = Object.values(results).every(s => s.status === 'ok');
    const anyDown = Object.values(results).some(s => s.status === 'error');
    return {
      status: anyDown ? 'down' : allOk ? 'healthy' : 'degraded',
      services: results,
      counts: { businesses, invoices, payments, pendingKyc },
      whtSummary: { totalPendingKes, overdueCount },
    };
  }

  async getBusinessDetail(businessId: string) {
    const business = await this.businessRepository.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    const [invoiceCount, paymentCount, whtLiabilities] = await Promise.all([
      this.invoiceRepository.count({ where: { businessId } }),
      this.paymentRepository.count({ where: { businessId } }),
      this.whtLiabilityRepository.find({ where: { businessId, status: 'pending' as any } }),
    ]);
    const whtPending = whtLiabilities.reduce((sum, l) => sum + Number(l.amountKes), 0);
    return { business, invoiceCount, paymentCount, whtPending };
  }

  getAuditLog(limit = 50): AuditLogEntry[] {
    return auditLog.slice(-limit).reverse();
  }

  private writeAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    auditLog.push({
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    });
    if (auditLog.length > 1000) auditLog.splice(0, auditLog.length - 1000);
  }
}
