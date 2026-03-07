import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarbonController } from './carbon.controller';
import { CarbonService } from './carbon.service';
import { GreenAsset } from '../entities/green-asset.entity';
import { MrvReading } from '../entities/mrv-reading.entity';
import { CarbonDividend } from '../entities/carbon-dividend.entity';
import { Business } from '../entities/business.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GreenAsset, MrvReading, CarbonDividend, Business]),
  ],
  controllers: [CarbonController],
  providers: [CarbonService],
  exports: [CarbonService],
})
export class CarbonModule {}
