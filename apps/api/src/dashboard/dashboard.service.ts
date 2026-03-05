import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Business } from '../entities/business.entity';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { GavaConnectService } from '../onboarding/gavaconnect.service';
import { DashboardSummary } from '@biasharasmart/shared-types';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Business)
    private businessRepo: Repository<Business>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    private gavaConnect: GavaConnectService,
  ) {}

  async getSummary(businessId?: string): Promise<DashboardSummary> {
    let business: Business | null = null;
    if (businessId) {
      business = await this.businessRepo.findOne({ where: { id: businessId } });
    } else {
      business = await this.businessRepo.findOne({ where: {}, order: { createdAt: 'ASC' } });
    }

    if (!business) {
      return this.getMockData();
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Revenue
    const thisMonthPaid = await this.invoiceRepo.find({
      where: {
        businessId: business.id,
        status: InvoiceStatus.PAID,
        updatedAt: Between(startOfMonth, now),
      }
    });
    const thisMonthTotal = thisMonthPaid.reduce((sum, inv) => sum + Number(inv.totalKes), 0);

    const lastMonthPaid = await this.invoiceRepo.find({
      where: {
        businessId: business.id,
        status: InvoiceStatus.PAID,
        updatedAt: Between(startOfLastMonth, endOfLastMonth),
      }
    });
    const lastMonthTotal = lastMonthPaid.reduce((sum, inv) => sum + Number(inv.totalKes), 0);

    const trend = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    // Invoices
    const invoiceCounts = await this.invoiceRepo.createQueryBuilder('invoice')
      .select('status')
      .addSelect('COUNT(*)', 'count')
      .where('invoice.business_id = :businessId', { businessId: business.id })
      .groupBy('status')
      .getRawMany();

    const totalInvoices = invoiceCounts.reduce((sum, item) => sum + parseInt(item.count), 0);
    const pendingInvoices = invoiceCounts
      .filter(item => [InvoiceStatus.PENDING_KRA, InvoiceStatus.DRAFT].includes(item.status))
      .reduce((sum, item) => sum + parseInt(item.count), 0);
    const overdueInvoices = invoiceCounts
      .filter(item => item.status === InvoiceStatus.OVERDUE)
      .reduce((sum, item) => sum + parseInt(item.count), 0);

    // Payments
    const todayPayments = await this.paymentRepo.find({
      where: {
        businessId: business.id,
        status: PaymentStatus.CONFIRMED,
        createdAt: Between(startOfToday, now),
      }
    });
    const todayCount = todayPayments.length;
    const todayTotal = todayPayments.reduce((sum, p) => sum + Number(p.amountKes), 0);

    // TCC
    const tccData = await this.gavaConnect.checkTcc(business.kraPin);
    const expiryDate = new Date(tccData.expiryDate);
    const daysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Recent Transactions (mix of invoices and payments)
    const recentInvoices = await this.invoiceRepo.find({
      where: { businessId: business.id },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const recentPayments = await this.paymentRepo.find({
      where: { businessId: business.id },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const recentTransactions: DashboardSummary['recentTransactions'] = [
      ...recentInvoices.map(inv => ({
        id: inv.id,
        description: `Invoice to ${inv.customerName || 'Walk-in Customer'}`,
        amount: Number(inv.totalKes),
        type: 'debit' as const,
        date: inv.createdAt.toISOString(),
      })),
      ...recentPayments.map(p => ({
        id: p.id,
        description: `Payment from ${p.phoneNumber || 'M-Pesa'}`,
        amount: Number(p.amountKes),
        type: 'credit' as const,
        date: p.createdAt.toISOString(),
      })),
    ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

    return {
      business: {
        id: business.id,
        name: business.businessName,
        kraPin: business.kraPin,
        kycStatus: business.kycStatus,
      },
      revenue: {
        thisMonth: thisMonthTotal,
        lastMonth: lastMonthTotal,
        trend,
      },
      invoices: {
        total: totalInvoices,
        pending: pendingInvoices,
        overdue: overdueInvoices,
      },
      payments: {
        todayCount,
        todayTotal,
      },
      tcc: {
        status: tccData.status,
        daysRemaining,
      },
      recentTransactions,
    };
  }

  private getMockData(): DashboardSummary {
    return {
      business: {
        id: 'mock-uuid',
        name: 'Biashara Smart Demo',
        kraPin: 'P000000000A',
        kycStatus: 'approved',
      },
      revenue: {
        thisMonth: 1250000.00,
        lastMonth: 980000.00,
        trend: 27.5,
      },
      invoices: {
        total: 42,
        pending: 5,
        overdue: 2,
      },
      payments: {
        todayCount: 12,
        todayTotal: 85000.00,
      },
      tcc: {
        status: 'compliant',
        daysRemaining: 45,
      },
      recentTransactions: [
        { id: '1', description: 'Invoice to Safari Lodge', amount: 45000.00, type: 'debit', date: new Date().toISOString() },
        { id: '2', description: 'Payment from 254712345678', amount: 12000.00, type: 'credit', date: new Date().toISOString() },
        { id: '3', description: 'Invoice to Tech Hub', amount: 8500.00, type: 'debit', date: new Date(Date.now() - 86400000).toISOString() },
      ],
    };
  }
}
