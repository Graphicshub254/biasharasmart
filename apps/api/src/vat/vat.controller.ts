import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { VatService } from './vat.service';
import { CalculateVatDto } from './dto/vat.dto';

@Controller('vat')
export class VatController {
  constructor(private readonly vatService: VatService) {}

  @Get(':businessId')
  listVatReturns(
    @Param('businessId') businessId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.vatService.listVatReturns(businessId, page ? Number(page) : 1, limit ? Number(limit) : 10);
  }

  @Get(':businessId/current')
  getCurrentDraft(@Param('businessId') businessId: string) {
    return this.vatService.getCurrentDraft(businessId);
  }

  @Post(':businessId/calculate')
  calculateVat(
    @Param('businessId') businessId: string,
    @Body() dto?: CalculateVatDto,
  ) {
    // If no body provided, default to current month
    const now = new Date();
    const month = dto?.month || now.getMonth() + 1;
    const year = dto?.year || now.getFullYear();
    return this.vatService.calculateVatForPeriod(businessId, month, year);
  }

  @Post(':id/submit')
  submitVatReturn(@Param('id') id: string) {
    return this.vatService.submitVatReturn(id);
  }

  @Get('detail/:id')
  getVatReturn(@Param('id') id: string) {
    return this.vatService.getVatReturn(id);
  }

  @Get('detail/:id/invoices')
  async getVatReturnInvoices(@Param('id') id: string) {
    const vatReturn = await this.vatService.getVatReturn(id);
    return this.vatService.getInvoicesForPeriod(
      vatReturn.businessId,
      vatReturn.periodMonth,
      vatReturn.periodYear,
    );
  }
}
