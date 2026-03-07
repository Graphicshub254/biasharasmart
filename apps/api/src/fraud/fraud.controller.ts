import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { FraudService } from './fraud.service';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('fraud')
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get('events/:businessId')
  @UseGuards(AdminGuard)
  getFraudEvents(@Param('businessId') businessId: string) {
    return this.fraudService.getFraudEvents(businessId);
  }

  @Post('vault/:businessId/trigger')
  @UseGuards(AdminGuard)
  triggerVault(@Param('businessId') businessId: string, @Body('reason') reason: string) {
    return this.fraudService.triggerVaultMode(businessId, reason);
  }

  @Post('vault/:businessId/release')
  @UseGuards(AdminGuard)
  releaseVault(@Param('businessId') businessId: string) {
    return this.fraudService.releaseVault(businessId);
  }

  @Post('secret/:businessId')
  @UseGuards(AdminGuard)
  setTransactionSecret(@Param('businessId') businessId: string, @Body('secret') secret: string) {
    return this.fraudService.setTransactionSecret(businessId, secret);
  }

  @Get('status/:businessId')
  @UseGuards(AdminGuard)
  getFraudStatus(@Param('businessId') businessId: string) {
    return this.fraudService.getVaultStatus(businessId);
  }

  // Mobile-facing public endpoints
  @Get('public/vault-status/:businessId')
  getVaultStatus(@Param('businessId') businessId: string) {
    return this.fraudService.getVaultStatus(businessId);
  }

  @Get('public/events/:businessId')
  getPublicEvents(@Param('businessId') businessId: string) {
    return this.fraudService.getFraudEvents(businessId);
  }

  @Post('public/vault/:businessId/trigger')
  triggerPublicVault(@Param('businessId') businessId: string, @Body('reason') reason: string) {
    return this.fraudService.triggerVaultMode(businessId, reason);
  }

  @Post('public/vault/:businessId/release')
  releasePublicVault(@Param('businessId') businessId: string) {
    return this.fraudService.releaseVault(businessId);
  }

  @Post('public/secret/:businessId')
  setPublicTransactionSecret(@Param('businessId') businessId: string, @Body('secret') secret: string) {
    return this.fraudService.setTransactionSecret(businessId, secret);
  }
}
