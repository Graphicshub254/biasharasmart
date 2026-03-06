import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import { NotificationToken } from '../entities/notification-token.entity';
import { WhtLiability, WhtLiabilityStatus } from '../entities/wht-liability.entity';
import { Business } from '../entities/business.entity';
import { GavaConnectService } from '../onboarding/gavaconnect.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo = new Expo();

  constructor(
    @InjectRepository(NotificationToken)
    private readonly tokenRepo: Repository<NotificationToken>,
    @InjectRepository(WhtLiability)
    private readonly whtLiabilityRepo: Repository<WhtLiability>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    private readonly gavaConnectService: GavaConnectService,
  ) {}

  async registerToken(businessId: string, expoToken: string, deviceId?: string) {
    let token = await this.tokenRepo.findOne({ where: { expoToken } });
    if (token) {
      token.businessId = businessId;
      token.deviceId = deviceId;
    } else {
      token = this.tokenRepo.create({ businessId, expoToken, deviceId });
    }
    return this.tokenRepo.save(token);
  }

  async sendPush(businessId: string, title: string, body: string, data?: any) {
    const tokens = await this.tokenRepo.find({ where: { businessId } });
    const messages: ExpoPushMessage[] = [];

    for (const token of tokens) {
      if (!Expo.isExpoPushToken(token.expoToken)) {
        this.logger.warn(`Invalid Expo push token: ${token.expoToken}`);
        continue;
      }
      messages.push({
        to: token.expoToken,
        sound: 'default',
        title,
        body,
        data: data ?? {},
      });
    }

    if (messages.length === 0) return;

    try {
      const chunks = this.expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        await this.expo.sendPushNotificationsAsync(chunk);
      }
    } catch (err) {
      this.logger.error('Push send failed', err);
    }
  }

  @Cron('0 5 * * *') // 8AM EAT
  async checkWhtDeadlines() {
    this.logger.log('Checking WHT deadlines...');
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const threeDaysOut = new Date();
    threeDaysOut.setDate(threeDaysOut.getDate() + 3);

    // Find liabilities due tomorrow
    const dueTomorrow = await this.whtLiabilityRepo.find({
      where: { 
        status: WhtLiabilityStatus.PENDING, 
        dueDate: Between(now, tomorrow) 
      },
    });

    // Find liabilities due in 3 days
    const dueIn3Days = await this.whtLiabilityRepo.find({
      where: { 
        status: WhtLiabilityStatus.PENDING, 
        dueDate: Between(tomorrow, threeDaysOut) 
      },
    });

    // Find overdue liabilities
    const overdue = await this.whtLiabilityRepo.find({
      where: {
        status: WhtLiabilityStatus.PENDING,
        dueDate: LessThan(now)
      }
    });

    for (const liability of dueTomorrow) {
      await this.sendPush(
        liability.businessId,
        'WHT Deadline Alert',
        `🚨 KES ${liability.amountKes} WHT due TOMORROW. Pay immediately.`,
        { type: 'WHT_DEADLINE_1DAY', liabilityId: liability.id }
      );
    }

    for (const liability of dueIn3Days) {
      await this.sendPush(
        liability.businessId,
        'WHT Deadline Alert',
        `⚠️ KES ${liability.amountKes} WHT due in 3 days. Pay now to avoid KRA penalties.`,
        { type: 'WHT_DEADLINE_3DAYS', liabilityId: liability.id }
      );
    }

    for (const liability of overdue) {
      await this.sendPush(
        liability.businessId,
        'WHT Overdue',
        `❌ KES ${liability.amountKes} WHT is OVERDUE. KRA penalties may apply.`,
        { type: 'WHT_OVERDUE', liabilityId: liability.id }
      );
    }

    // Check TCC for all businesses (limited to first 100 for safety in this task)
    const businesses = await this.businessRepo.find({ take: 100 });
    for (const b of businesses) {
      try {
        const tcc = await this.gavaConnectService.checkTcc(b.kraPin);
        const expiry = new Date(tcc.expiryDate);
        const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysRemaining === 30) {
          await this.sendPush(
            b.id,
            'TCC Expiring Soon',
            '⚠️ Your Tax Compliance Certificate expires in 30 days. Renew on iTax.',
            { type: 'TCC_EXPIRY_30DAYS', expiryDate: tcc.expiryDate }
          );
        }
      } catch (err) {
        this.logger.error(`Failed TCC check for ${b.kraPin}`, err);
      }
    }
  }

  async sendTestNotification(businessId: string) {
    return this.sendPush(
      businessId,
      'Test Notification',
      'This is a test notification from BiasharaSmart API.',
      { type: 'TEST' }
    );
  }
}
