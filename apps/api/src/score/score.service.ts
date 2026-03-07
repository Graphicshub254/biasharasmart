import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between } from 'typeorm';
import { Business } from '../entities/business.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { WhtLiability, WhtLiabilityStatus } from '../entities/wht-liability.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { GREEN_SCORE_MULTIPLIER } from '@biasharasmart/shared-types';

@Injectable()
export class ScoreService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(WhtLiability)
    private readonly whtLiabilityRepo: Repository<WhtLiability>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async calculateScore(businessId: string): Promise<{
    total: number;
    breakdown: {
      consistency: number;
      taxHygiene: number;
      growth: number;
      greenMultiplier: number;
    };
    nextMilestone: number;
    loanEligible: boolean;
  }> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException(`Business ${businessId} not found`);
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Consistency: invoices in last 30 days (max 50 = 400pts)
    const recentInvoices = await this.invoiceRepo.count({
      where: { businessId, createdAt: MoreThan(thirtyDaysAgo) },
    });
    const consistency = Math.min(400, Math.round((recentInvoices / 50) * 400));

    // Tax Hygiene: paid on time vs overdue
    const allLiabilities = await this.whtLiabilityRepo.find({ where: { businessId } });
    const paidOnTime = allLiabilities.filter(l => l.status === WhtLiabilityStatus.PAID).length;
    const overdue = allLiabilities.filter(l => l.status === WhtLiabilityStatus.OVERDUE).length;
    const total_liabilities = allLiabilities.length;
    const hygieneRatio = total_liabilities > 0 ? (paidOnTime / total_liabilities) : 1;
    const taxHygiene = Math.round(hygieneRatio * 300) - (overdue * 30);
    const taxHygieneFinal = Math.max(0, Math.min(300, taxHygiene));

    // Growth: this month vs last month revenue
    const thisMonthPayments = await this.paymentRepo.find({
      where: { businessId, status: PaymentStatus.CONFIRMED, createdAt: MoreThan(firstOfMonth) },
    });
    const lastMonthPayments = await this.paymentRepo.find({
      where: { businessId, status: PaymentStatus.CONFIRMED, createdAt: Between(firstOfLastMonth, firstOfMonth) },
    });
    const thisRevenue = thisMonthPayments.reduce((s, p) => s + Number(p.amountKes), 0);
    const lastRevenue = lastMonthPayments.reduce((s, p) => s + Number(p.amountKes), 0);
    const growthRatio = lastRevenue > 0 ? Math.min(2, thisRevenue / lastRevenue) : (thisRevenue > 0 ? 1 : 0);
    const growth = Math.round(growthRatio * 150); // max 300 at 2x growth

    const greenMultiplier = business.greenMultiplierActive ? GREEN_SCORE_MULTIPLIER : 0;
    const total = Math.min(1000, consistency + taxHygieneFinal + growth + greenMultiplier);

    // Check for milestone milestones: 400, 600, 800
    const oldScore = business.biaScore;
    const milestones = [400, 600, 800];
    for (const milestone of milestones) {
      if (oldScore < milestone && total >= milestone) {
        await this.notificationsService.sendPush(
          businessId,
          'Score Milestone Hit! 🎯',
          `🎯 Biashara Score hit ${total}! You're now eligible for Co-op Bank loans.`,
          { type: 'SCORE_MILESTONE', score: total, milestone }
        );
        break; // only notify for the highest milestone hit in this calc
      }
    }

    // Save to business
    await this.businessRepo.update(businessId, { biaScore: total });

    return {
      total,
      breakdown: { consistency, taxHygiene: taxHygieneFinal, growth, greenMultiplier },
      nextMilestone: total < 400 ? 400 : total < 600 ? 600 : total < 800 ? 800 : 1000,
      loanEligible: total >= 600,
    };
  }
}
