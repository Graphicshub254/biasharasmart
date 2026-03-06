import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { DarajaPaymentsService } from './daraja.service';
import { DatabaseModule } from '../database/database.module';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
  imports: [
    HttpModule,
    DatabaseModule,
    OnboardingModule,
  ],
  providers: [PaymentsService, DarajaPaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
