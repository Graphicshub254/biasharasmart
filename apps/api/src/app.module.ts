import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { TccModule } from './tcc/tcc.module';
import { AdminModule } from './admin/admin.module';
import { VatModule } from './vat/vat.module';
import { ScoreModule } from './score/score.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { PayrollModule } from './payroll/payroll.module';
import { UssdModule } from './ussd/ussd.module';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    OnboardingModule,
    DashboardModule,
    InvoicesModule,
    PaymentsModule,
    TccModule,
    AdminModule,
    VatModule,
    ScoreModule,
    NotificationsModule,
    ReportsModule,
    PayrollModule,
    UssdModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
