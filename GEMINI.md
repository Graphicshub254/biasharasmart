# GEMINI.md — Task Brief: T1.6
## Task: Install admin console files + wire into app.module.ts + test

## Environment rules
- Windows PowerShell host, WSL Ubuntu guest
- All Linux commands: `wsl -d Ubuntu -- <cmd>`
- Yarn binary: `/home/bishop/.npm-global/bin/yarn`
- Always use git --no-pager
- Always use \pset pager off for psql
- Never use find /, heredoc, or interactive shells

## Pre-checks

```powershell
# 1. T1.5 complete
wsl -d Ubuntu -- bash -c "python3 -c \"import json,pathlib; d=json.loads(pathlib.Path('/home/bishop/projects/biasharasmart/progress.txt').read_text(encoding='utf-8-sig')); print(d['tasks']['T1.5']['status'])\""
```

```powershell
# 2. Build clean
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -5"
```

## Step 1 — Create admin directory

```powershell
wsl -d Ubuntu -- bash -c "mkdir -p /home/bishop/projects/biasharasmart/apps/api/src/admin/guards /home/bishop/projects/biasharasmart/apps/api/src/admin/decorators /home/bishop/projects/biasharasmart/apps/api/src/admin/dto"
```

## Step 2 — Write the 6 admin files using write_file tool

Write these files EXACTLY as provided. Use write_file tool — do NOT use heredoc.

### File 1: apps/api/src/admin/decorators/roles.decorator.ts

```typescript
import { SetMetadata } from '@nestjs/common';

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  OPERATOR = 'operator',
  AUDITOR = 'auditor',
  VIEWER = 'viewer',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
```

### File 2: apps/api/src/admin/guards/admin.guard.ts

```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole, ROLES_KEY } from '../decorators/roles.decorator';

const ADMIN_TOKENS: Record<string, { role: AdminRole; name: string }> = {
  'admin-super-token-dev': { role: AdminRole.SUPER_ADMIN, name: 'Super Admin' },
  'admin-operator-token-dev': { role: AdminRole.OPERATOR, name: 'Operator' },
  'admin-auditor-token-dev': { role: AdminRole.AUDITOR, name: 'Auditor' },
  'admin-viewer-token-dev': { role: AdminRole.VIEWER, name: 'Viewer' },
};

const ROLE_HIERARCHY: Record<AdminRole, number> = {
  [AdminRole.SUPER_ADMIN]: 4,
  [AdminRole.OPERATOR]: 3,
  [AdminRole.AUDITOR]: 2,
  [AdminRole.VIEWER]: 1,
};

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-admin-token'];

    if (!token) throw new UnauthorizedException('Admin token required');

    const admin = ADMIN_TOKENS[token];
    if (!admin) throw new UnauthorizedException('Invalid admin token');

    request.admin = admin;

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const adminLevel = ROLE_HIERARCHY[admin.role];
    const minRequired = Math.min(...requiredRoles.map(r => ROLE_HIERARCHY[r]));

    if (adminLevel < minRequired) {
      throw new UnauthorizedException(`Requires role: ${requiredRoles.join(' or ')}`);
    }

    return true;
  }
}
```

### File 3: apps/api/src/admin/dto/admin.dto.ts

```typescript
import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { KycStatus } from '../../entities/business.entity';

export class KycReviewDto {
  @IsEnum(KycStatus)
  status!: KycStatus.APPROVED | KycStatus.REJECTED;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BusinessSearchDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(KycStatus)
  kycStatus?: KycStatus;

  @IsOptional()
  @IsString()
  paymentMode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}
```

### File 4: apps/api/src/admin/admin.service.ts

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business, KycStatus } from '../entities/business.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { WhtLiability } from '../entities/wht-liability.entity';
import { KycReviewDto, BusinessSearchDto } from './dto/admin.dto';
import { GavaConnectService } from '../onboarding/gavaconnect.service';

export interface AuditLogEntry {
  id: string;
  action: string;
  adminName: string;
  adminRole: string;
  targetId: string;
  targetType: string;
  notes?: string;
  timestamp: string;
}

const auditLog: AuditLogEntry[] = [];

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(WhtLiability)
    private readonly whtLiabilityRepository: Repository<WhtLiability>,
    private readonly gavaConnectService: GavaConnectService,
  ) {}

  async getKycQueue(): Promise<Business[]> {
    return this.businessRepository.find({
      where: { kycStatus: KycStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }

  async reviewKyc(
    businessId: string,
    dto: KycReviewDto,
    admin: { name: string; role: string },
  ): Promise<Business> {
    const business = await this.businessRepository.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    business.kycStatus = dto.status;
    const updated = await this.businessRepository.save(business);
    this.writeAudit({
      action: `KYC_${dto.status.toUpperCase()}`,
      adminName: admin.name,
      adminRole: admin.role,
      targetId: businessId,
      targetType: 'business',
      notes: dto.notes,
    });
    return updated;
  }

  async searchBusinesses(query: BusinessSearchDto): Promise<{
    data: Business[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { search, kycStatus, paymentMode, page = 1, limit = 20 } = query;
    let qb = this.businessRepository.createQueryBuilder('b');
    if (search) {
      qb = qb.where(
        '(b.business_name ILIKE :s OR b.kra_pin ILIKE :s OR b.mpesa_paybill ILIKE :s)',
        { s: `%${search}%` },
      );
    }
    if (kycStatus) qb = qb.andWhere('b.kyc_status = :kycStatus', { kycStatus });
    if (paymentMode) qb = qb.andWhere('b.payment_mode = :paymentMode', { paymentMode });
    const [data, total] = await qb
      .orderBy('b.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit };
  }

  async getSystemHealth() {
    const results: Record<string, { status: string; latencyMs?: number; detail?: string }> = {};
    try {
      const t0 = Date.now();
      await this.businessRepository.count();
      results.database = { status: 'ok', latencyMs: Date.now() - t0 };
    } catch (e: any) {
      results.database = { status: 'error', detail: e.message };
    }
    try {
      const t0 = Date.now();
      await this.gavaConnectService.checkTcc('P051234567Z');
      results.gavaConnect = { status: 'ok', latencyMs: Date.now() - t0 };
    } catch {
      results.gavaConnect = { status: 'degraded', detail: 'Stub error' };
    }
    results.daraja = { status: 'ok', detail: 'sandbox' };
    const [businesses, invoices, payments, pendingKyc] = await Promise.all([
      this.businessRepository.count(),
      this.invoiceRepository.count(),
      this.paymentRepository.count(),
      this.businessRepository.count({ where: { kycStatus: KycStatus.PENDING } }),
    ]);
    const pendingLiabilities = await this.whtLiabilityRepository.find({
      where: { status: 'pending' as any },
    });
    const totalPendingKes = pendingLiabilities.reduce((sum, l) => sum + Number(l.amountKes), 0);
    const overdueCount = pendingLiabilities.filter(l => new Date(l.dueDate) < new Date()).length;
    const allOk = Object.values(results).every(s => s.status === 'ok');
    const anyDown = Object.values(results).some(s => s.status === 'error');
    return {
      status: anyDown ? 'down' : allOk ? 'healthy' : 'degraded',
      services: results,
      counts: { businesses, invoices, payments, pendingKyc },
      whtSummary: { totalPendingKes, overdueCount },
    };
  }

  async getBusinessDetail(businessId: string) {
    const business = await this.businessRepository.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    const [invoiceCount, paymentCount, whtLiabilities] = await Promise.all([
      this.invoiceRepository.count({ where: { businessId } }),
      this.paymentRepository.count({ where: { businessId } }),
      this.whtLiabilityRepository.find({ where: { businessId, status: 'pending' as any } }),
    ]);
    const whtPending = whtLiabilities.reduce((sum, l) => sum + Number(l.amountKes), 0);
    return { business, invoiceCount, paymentCount, whtPending };
  }

  getAuditLog(limit = 50): AuditLogEntry[] {
    return auditLog.slice(-limit).reverse();
  }

  private writeAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    auditLog.push({
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    });
    if (auditLog.length > 1000) auditLog.splice(0, auditLog.length - 1000);
  }
}
```

### File 5: apps/api/src/admin/admin.controller.ts

```typescript
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
```

### File 6: apps/api/src/admin/admin.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../entities/business.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { WhtLiability } from '../entities/wht-liability.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business, Invoice, Payment, WhtLiability]),
    OnboardingModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
```

## Step 3 — Wire AdminModule into app.module.ts

Read current app.module.ts:
```powershell
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/api/src/app.module.ts"
```

Add to imports array: `AdminModule`
Add to imports at top: `import { AdminModule } from './admin/admin.module';`

## Step 4 — Check GavaConnectService exports

```powershell
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/api/src/onboarding/onboarding.module.ts"
```

If GavaConnectService is not in exports array, add it.

## Step 5 — Build

```powershell
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -10"
```

Zero errors required.

## Step 6 — Test all endpoints

Start API:
```powershell
Start-Job -ScriptBlock { wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api start:dev 2>&1" }
Start-Sleep -Seconds 25
```

Test health (viewer token):
```powershell
wsl -d Ubuntu -- bash -c "curl -s http://localhost:3000/api/admin/health -H 'x-admin-token: admin-viewer-token-dev' | python3 -m json.tool"
```

Expected: { status: 'healthy', services: {database: ok, gavaConnect: ok, daraja: ok}, counts: {...} }

Test KYC queue (operator token):
```powershell
wsl -d Ubuntu -- bash -c "curl -s http://localhost:3000/api/admin/kyc-queue -H 'x-admin-token: admin-operator-token-dev' | python3 -m json.tool"
```

Expected: array of pending businesses (Habari Logistics Ltd should be there)

Test business search (auditor token):
```powershell
wsl -d Ubuntu -- bash -c "curl -s 'http://localhost:3000/api/admin/businesses?search=Maji' -H 'x-admin-token: admin-auditor-token-dev' | python3 -m json.tool"
```

Expected: { data: [{businessName: 'Maji Safi Vendors', ...}], total: 1 }

Test RBAC — viewer trying operator endpoint (should get 401):
```powershell
wsl -d Ubuntu -- bash -c "curl -s http://localhost:3000/api/admin/kyc-queue -H 'x-admin-token: admin-viewer-token-dev' | python3 -m json.tool"
```

Expected: { statusCode: 401, message: 'Requires role: operator...' }

Test KYC review — approve Habari Logistics:
```powershell
wsl -d Ubuntu -- bash -c "HID=\$(curl -s 'http://localhost:3000/api/admin/businesses?search=Habari' -H 'x-admin-token: admin-auditor-token-dev' | python3 -c 'import json,sys; print(json.load(sys.stdin)[\"data\"][0][\"id\"])') && python3 -c \"import json; open('/tmp/kyc.json','w').write(json.dumps({'status':'approved','notes':'Documents verified'}))\" && curl -s -X PATCH http://localhost:3000/api/admin/kyc/\$HID -H 'x-admin-token: admin-operator-token-dev' -H 'Content-Type: application/json' -d @/tmp/kyc.json | python3 -m json.tool | grep kyc_status"
```

Expected: "kyc_status": "approved"

Test audit log:
```powershell
wsl -d Ubuntu -- bash -c "curl -s http://localhost:3000/api/admin/audit-log -H 'x-admin-token: admin-auditor-token-dev' | python3 -m json.tool | head -20"
```

Expected: array with KYC_APPROVED entry

## Exit criteria — ALL must pass

- [ ] GET /api/admin/health returns healthy status with all services
- [ ] GET /api/admin/kyc-queue returns pending businesses
- [ ] PATCH /api/admin/kyc/:id approves/rejects and writes audit log
- [ ] GET /api/admin/businesses?search= returns filtered results
- [ ] GET /api/admin/businesses/:id returns detail with counts
- [ ] GET /api/admin/audit-log returns audit entries
- [ ] Viewer token rejected on operator endpoints (401)
- [ ] No token returns 401
- [ ] API build: zero errors

## Do NOT do
- Do not build mobile admin screens — admin is API only in Phase 1
- Do not use real JWT — token map is intentional for now
- Do not use find /
- Do not use heredoc

## On completion

```powershell
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$raw = [System.IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)
$d = $raw | ConvertFrom-Json
$d.tasks.'T1.6'.status = "complete"
$d.tasks.'T1.6'.notes = "T1.6 COMPLETE: Admin console. RBAC (super_admin/operator/auditor/viewer). KYC queue+review. Business search+detail. System health. In-memory audit log. All endpoints tested. API build clean."
$d.current_task = "T2.1"
$d.current_phase = 2
[System.IO.File]::WriteAllText($p, ($d | ConvertTo-Json -Depth 10), [System.Text.Encoding]::UTF8)
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git add -A && git --no-pager commit -m 'T1.6: Admin console — RBAC, KYC queue, business search, system health, audit log'"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git push origin main"
Write-Host "T1.6 COMPLETE — PHASE 1 DONE"
```