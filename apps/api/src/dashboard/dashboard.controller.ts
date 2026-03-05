import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardSummary } from '@biasharasmart/shared-types';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@Query('businessId') businessId?: string): Promise<DashboardSummary> {
    return this.dashboardService.getSummary(businessId);
  }
}
