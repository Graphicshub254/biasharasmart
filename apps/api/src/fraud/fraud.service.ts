import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Business } from '../entities/business.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { FraudEvent, FraudEventType, FraudSeverity } from '../entities/fraud-event.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(FraudEvent)
    private readonly fraudEventRepo: Repository<FraudEvent>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async validateTransactionSecret(businessId: string, secret: string): Promise<boolean> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    return business?.transactionSecret === secret;
  }

  async checkTransactionAnomaly(businessId: string, amountKes: number): Promise<boolean> {
    const recent = await this.paymentRepo.find({
      where: { businessId, status: PaymentStatus.CONFIRMED },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    if (recent.length < 5) return false; // not enough history

    const avg = recent.reduce((s, p) => s + Number(p.amountKes), 0) / recent.length;
    const isAnomaly = amountKes > avg * 3;

    if (isAnomaly) {
      await this.logFraudEvent(businessId, FraudEventType.ANOMALY, FraudSeverity.HIGH,
        `Transaction KES ${amountKes} is ${(amountKes/avg).toFixed(1)}x avg (KES ${avg.toFixed(0)})`
      );
    }
    return isAnomaly;
  }

  async detectSimSwap(businessId: string, currentPhone: string): Promise<void> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    // In production: check against Safaricom SIM-swap API
    // In sandbox: flag if phone changes from registered mpesaTill
    this.logger.warn(`SIM-swap check for ${businessId}: phone ${currentPhone}`);
    
    if (business && business.mpesaTill && business.mpesaTill !== currentPhone) {
        await this.logFraudEvent(businessId, FraudEventType.SIM_SWAP, FraudSeverity.MEDIUM, 
            `Potential SIM-swap: phone ${currentPhone} differs from registered till ${business.mpesaTill}`);
    }
  }

  async triggerVaultMode(businessId: string, reason: string): Promise<void> {
    await this.businessRepo.update(businessId, {
      vaultMode: true,
      vaultTriggeredAt: new Date(),
    });

    await this.logFraudEvent(businessId, FraudEventType.VAULT_TRIGGERED, FraudSeverity.CRITICAL, reason);

    // Send push notification
    await this.notificationsService.sendPush(
      businessId,
      'VAULT_MODE',
      '🔒 Vault Mode activated — withdrawals frozen for 24hrs. Contact support if this was not you.',
      { type: 'VAULT_MODE' }
    );
  }

  async releaseVault(businessId: string): Promise<void> {
    await this.businessRepo.update(businessId, {
      vaultMode: false,
      vaultTriggeredAt: null as any,
    });
  }

  @Cron('0 * * * *') // Every hour
  async checkVaultExpiry(): Promise<void> {
    // Auto-release vault after 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.businessRepo.update(
      { vaultMode: true, vaultTriggeredAt: LessThan(yesterday) },
      { vaultMode: false, vaultTriggeredAt: null as any }
    );
  }

  async logFraudEvent(businessId: string, eventType: FraudEventType, severity: FraudSeverity, description: string, metadata: any = {}): Promise<void> {
    const event = this.fraudEventRepo.create({
      businessId,
      eventType,
      severity,
      description,
      metadata,
    });
    await this.fraudEventRepo.save(event);
  }

  async getFraudEvents(businessId: string): Promise<FraudEvent[]> {
    return this.fraudEventRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async setTransactionSecret(businessId: string, secret: string): Promise<void> {
    await this.businessRepo.update(businessId, { transactionSecret: secret });
  }

  async getVaultStatus(businessId: string): Promise<{ vaultMode: boolean, vaultTriggeredAt?: Date }> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    return {
      vaultMode: business?.vaultMode || false,
      vaultTriggeredAt: business?.vaultTriggeredAt,
    };
  }
}
