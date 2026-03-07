import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CarbonService } from './carbon.service';

@Controller('carbon')
export class CarbonController {
  constructor(private readonly carbonService: CarbonService) {}

  @Get(':businessId')
  getDashboardSummary(@Param('businessId') businessId: string) {
    return this.carbonService.getDashboardSummary(businessId);
  }

  @Post(':businessId/assets')
  registerAsset(@Param('businessId') businessId: string, @Body() data: any) {
    return this.carbonService.registerAsset(businessId, data);
  }

  @Get(':businessId/assets')
  getAssets(@Param('businessId') businessId: string) {
    return this.carbonService.getAssets(businessId);
  }

  @Post(':businessId/readings')
  logReading(@Param('businessId') businessId: string, @Body() data: any) {
    return this.carbonService.logReading(businessId, data);
  }

  @Get(':businessId/dividends')
  getDividends(@Param('businessId') businessId: string) {
    return this.carbonService.getDividends(businessId);
  }

  @Post(':businessId/calculate')
  calculateMonthlyDividend(
    @Param('businessId') businessId: string,
    @Body('month') month: number,
    @Body('year') year: number,
  ) {
    return this.carbonService.calculateMonthlyDividend(businessId, month, year);
  }
}
