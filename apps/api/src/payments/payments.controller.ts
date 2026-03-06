import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ReconcilePaymentDto } from './dto/reconcile-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('gateway/initiate')
  async initiateGateway(@Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiateGatewayPayment(dto);
  }

  @Post('legacy/reconcile')
  async reconcileLegacy(@Body() dto: ReconcilePaymentDto) {
    return this.paymentsService.reconcileLegacyPayment(dto);
  }

  @Post('webhook/daraja')
  @HttpCode(HttpStatus.OK)
  async handleDarajaWebhook(@Body() body: any) {
    return this.paymentsService.handleDarajaWebhook(body);
  }

  @Get('wht-summary/:businessId')
  async getWhtSummary(@Param('businessId') businessId: string) {
    return this.paymentsService.getWhtSummary(businessId);
  }

  @Get(':businessId')
  async listPayments(@Param('businessId') businessId: string) {
    return this.paymentsService.listPayments(businessId);
  }
}
