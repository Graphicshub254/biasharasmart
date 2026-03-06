import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../entities/business.entity';
import { TccController } from './tcc.controller';
import { TccService } from './tcc.service';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business]),
    OnboardingModule,
  ],
  controllers: [TccController],
  providers: [TccService],
  exports: [TccService],
})
export class TccModule {}
