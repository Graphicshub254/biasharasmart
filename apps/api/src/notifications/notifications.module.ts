import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationToken } from '../entities/notification-token.entity';
import { Business } from '../entities/business.entity';
import { WhtLiability } from '../entities/wht-liability.entity';
import { Invoice } from '../entities/invoice.entity';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationToken, Business, WhtLiability, Invoice]),
    OnboardingModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
