import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register')
  register(@Body() dto: { businessId: string; expoToken: string; deviceId?: string }) {
    return this.notificationsService.registerToken(dto.businessId, dto.expoToken, dto.deviceId);
  }

  @Post('test/:businessId')
  testPush(@Param('businessId') businessId: string) {
    return this.notificationsService.sendTestNotification(businessId);
  }

  @Get('trigger-cron')
  triggerCron() {
    // Manual trigger for testing
    return this.notificationsService.checkWhtDeadlines();
  }
}
