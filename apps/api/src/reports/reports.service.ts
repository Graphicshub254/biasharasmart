import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { WhtLiability, WhtLiabilityStatus } from '../entities/wht-liability.entity';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(WhtLiability)
    private readonly whtLiabilityRepo: Repository<WhtLiability>,
  ) {}

  async getProfitAndLoss(businessId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Revenue: confirmed payments in period
    const payments = await this.paymentRepo.find({
      where: { businessId, status: PaymentStatus.CONFIRMED, resolvedAt: Between(startDate, endDate) },
    });
    const revenue = payments.reduce((s, p) => s + Number(p.amountKes), 0);

    // VAT collected: from paid invoices updated in period
    const invoices = await this.invoiceRepo.find({
      where: { businessId, status: InvoiceStatus.PAID, updatedAt: Between(startDate, endDate) },
    });
    const vatCollected = invoices.reduce((s, i) => s + Number(i.vatAmountKes), 0);

    // WHT deducted: from confirmed payments
    const whtDeducted = payments.reduce((s, p) => s + Number(p.whtAmountKes), 0);

    // Net revenue
    const netRevenue = +(revenue - whtDeducted).toFixed(2);

    return {
      period: { month, year },
      revenue,
      vatCollected,
      whtDeducted,
      netRevenue,
      invoiceCount: invoices.length,
      paymentCount: payments.length,
      generatedAt: new Date().toISOString(),
    };
  }

  async getKraReconciliation(businessId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Match each invoice to its M-Pesa payment and CU number
    const invoices = await this.invoiceRepo.find({
      where: { businessId, updatedAt: Between(startDate, endDate) },
      order: { createdAt: 'ASC' },
    });

    const rows = await Promise.all(
      invoices.map(async (inv) => {
        const payment = await this.paymentRepo.findOne({
          where: { invoiceId: inv.id, status: PaymentStatus.CONFIRMED },
        });
        return {
          invoiceRef: inv.id.slice(-8).toUpperCase(),
          cuNumber: inv.cuNumber ?? 'UNREGISTERED',
          status: inv.status,
          totalKes: Number(inv.totalKes),
          vatKes: Number(inv.vatAmountKes),
          mpesaCode: payment?.mpesaCode ?? 'UNPAID',
          paymentDate: payment?.resolvedAt ?? null,
        };
      }),
    );

    const totalVatDue = rows.reduce((s, r) => s + r.vatKes, 0);
    const unregistered = rows.filter((r) => r.cuNumber === 'UNREGISTERED').length;

    return {
      period: { month, year },
      rows,
      totalVatDue,
      unregistered,
      generatedAt: new Date().toISOString(),
    };
  }

  async getWhtStatement(businessId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const liabilities = await this.whtLiabilityRepo.find({
      where: { businessId, createdAt: Between(startDate, endDate) },
      order: { dueDate: 'ASC' },
      relations: ['payment'],
    });

    const rows = liabilities.map((l) => ({
      id: l.id,
      paymentId: l.paymentId,
      amountKes: Number(l.amountKes),
      dueDate: l.dueDate,
      status: l.status,
      mpesaCode: l.payment?.mpesaCode ?? 'N/A',
      createdAt: l.createdAt,
    }));

    const totalOwed = rows
      .filter((r) => r.status === WhtLiabilityStatus.PENDING || r.status === WhtLiabilityStatus.OVERDUE)
      .reduce((s, r) => s + r.amountKes, 0);

    const totalPaid = rows
      .filter((r) => r.status === WhtLiabilityStatus.PAID)
      .reduce((s, r) => s + r.amountKes, 0);

    return {
      period: { month, year },
      rows,
      totalOwed,
      totalPaid,
      generatedAt: new Date().toISOString(),
    };
  }
}
