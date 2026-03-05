import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { GavaConnectService } from './gavaconnect.service';
import { DarajaService } from './daraja.service';
import { Business } from '../entities/business.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Business]),
  ],
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    GavaConnectService,
    DarajaService,
  ],
  exports: [OnboardingService, GavaConnectService, DarajaService],
})
export class OnboardingModule {}
