import { Controller, Get, Post, Patch, Param, Body, Query, NotFoundException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  listInvoices(@Query() query: InvoiceQueryDto) {
    return this.invoicesService.listInvoices(query);
  }

  @Post()
  createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.createInvoice(dto);
  }

  @Get(':id')
  getInvoice(@Param('id') id: string) {
    return this.invoicesService.getInvoice(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInvoiceStatusDto) {
    return this.invoicesService.updateStatus(id, dto);
  }

  @Post(':id/sync')
  syncInvoice(@Param('id') id: string) {
    return this.invoicesService.syncInvoice(id);
  }
}
