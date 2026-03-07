import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FraudService } from './fraud.service';
import { FraudController } from './fraud.controller';
import { Business } from '../entities/business.entity';
import { Payment } from '../entities/payment.entity';
import { FraudEvent } from '../entities/fraud-event.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business, Payment, FraudEvent]),
    NotificationsModule,
  ],
  controllers: [FraudController],
  providers: [FraudService],
  exports: [FraudService],
})
export class FraudModule {}
