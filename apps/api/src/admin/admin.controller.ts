import { Controller, Get, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { Roles, AdminRole } from './decorators/roles.decorator';
import { KycReviewDto, BusinessSearchDto } from './dto/admin.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  @Roles(AdminRole.VIEWER)
  getHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('kyc-queue')
  @Roles(AdminRole.OPERATOR)
  getKycQueue() {
    return this.adminService.getKycQueue();
  }

  @Patch('kyc/:businessId')
  @Roles(AdminRole.OPERATOR)
  reviewKyc(
    @Param('businessId') businessId: string,
    @Body() dto: KycReviewDto,
    @Request() req: any,
  ) {
    return this.adminService.reviewKyc(businessId, dto, req.admin);
  }

  @Get('businesses')
  @Roles(AdminRole.AUDITOR)
  searchBusinesses(@Query() query: BusinessSearchDto) {
    return this.adminService.searchBusinesses(query);
  }

  @Get('businesses/:businessId')
  @Roles(AdminRole.AUDITOR)
  getBusinessDetail(@Param('businessId') businessId: string) {
    return this.adminService.getBusinessDetail(businessId);
  }

  @Get('audit-log')
  @Roles(AdminRole.AUDITOR)
  getAuditLog() {
    return this.adminService.getAuditLog(100);
  }
}
