import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(':businessId/pl')
  async getProfitAndLoss(
    @Param('businessId') businessId: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();
    return this.reportsService.getProfitAndLoss(businessId, currentMonth, currentYear);
  }

  @Get(':businessId/kra')
  async getKraReconciliation(
    @Param('businessId') businessId: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();
    return this.reportsService.getKraReconciliation(businessId, currentMonth, currentYear);
  }

  @Get(':businessId/wht')
  async getWhtStatement(
    @Param('businessId') businessId: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();
    return this.reportsService.getWhtStatement(businessId, currentMonth, currentYear);
  }
}
