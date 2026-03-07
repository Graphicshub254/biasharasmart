# GEMINI.md — Task Brief: T3.3
## Task: Biashara Fraud Shield — transaction secrets, SIM-swap detection, Vault Mode, anomaly flagging

## Environment rules
- Same as all previous tasks

## Pre-checks

```powershell
wsl -d Ubuntu -- bash -c "python3 -c \"import json,pathlib; d=json.loads(pathlib.Path('/home/bishop/projects/biasharasmart/progress.txt').read_text(encoding='utf-8-sig')); print(d['tasks']['T3.2']['status'])\""
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -5"
```

## DB migration

```sql
-- Fraud events table
CREATE TABLE IF NOT EXISTS fraud_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  event_type VARCHAR(50) NOT NULL, -- SIM_SWAP | ANOMALY | VAULT_TRIGGERED | LARGE_TRANSACTION
  severity VARCHAR(20) DEFAULT 'medium', -- low | medium | high | critical
  description TEXT,
  metadata JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add vault_mode to businesses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='businesses' AND column_name='vault_mode'
  ) THEN
    ALTER TABLE businesses ADD COLUMN vault_mode BOOLEAN DEFAULT FALSE;
    ALTER TABLE businesses ADD COLUMN vault_triggered_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add transaction_secret to businesses (3-digit code)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='businesses' AND column_name='transaction_secret'
  ) THEN
    ALTER TABLE businesses ADD COLUMN transaction_secret VARCHAR(3);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fraud_events_business_id ON fraud_events(business_id);
CREATE INDEX IF NOT EXISTS idx_fraud_events_event_type ON fraud_events(event_type);
CREATE INDEX IF NOT EXISTS idx_fraud_events_resolved ON fraud_events(resolved);
```

## What to build

| File | What |
|---|---|
| `apps/api/src/fraud/fraud.module.ts` | Fraud Shield module |
| `apps/api/src/fraud/fraud.controller.ts` | Fraud endpoints |
| `apps/api/src/fraud/fraud.service.ts` | Detection logic |
| `apps/api/src/entities/fraud-event.entity.ts` | FraudEvent entity |
| `apps/mobile/app/security/index.tsx` | Security settings screen |

## Fraud detection rules

### 1. Transaction secret validation
Every STK push must include a 3-digit secret that the merchant set. Validates customer is genuine:
```typescript
async validateTransactionSecret(businessId: string, secret: string): Promise<boolean> {
  const business = await this.businessRepo.findOne({ where: { id: businessId } });
  return business?.transactionSecret === secret;
}
```

### 2. Large transaction anomaly
Flag any single payment > 3x the business's average payment:
```typescript
async checkTransactionAnomaly(businessId: string, amountKes: number): Promise<boolean> {
  const recent = await this.paymentRepo.find({
    where: { businessId, status: PaymentStatus.CONFIRMED },
    order: { createdAt: 'DESC' },
    take: 20,
  });
  if (recent.length < 5) return false; // not enough history

  const avg = recent.reduce((s, p) => s + Number(p.amountKes), 0) / recent.length;
  const isAnomaly = amountKes > avg * 3;

  if (isAnomaly) {
    await this.logFraudEvent(businessId, 'ANOMALY', 'high',
      `Transaction KES ${amountKes} is ${(amountKes/avg).toFixed(1)}x avg (KES ${avg.toFixed(0)})`
    );
  }
  return isAnomaly;
}
```

### 3. SIM-swap detection (stub)
Called when Daraja webhook comes from different phone than registered:
```typescript
async detectSimSwap(businessId: string, currentPhone: string): Promise<void> {
  const business = await this.businessRepo.findOne({ where: { id: businessId } });
  // In production: check against Safaricom SIM-swap API
  // In sandbox: flag if phone changes from registered mpesaTill
  this.logger.warn(`SIM-swap check for ${businessId}: phone ${currentPhone}`);
}
```

### 4. Vault Mode
24-hour withdrawal freeze triggered automatically on suspicious activity:
```typescript
async triggerVaultMode(businessId: string, reason: string): Promise<void> {
  await this.businessRepo.update(businessId, {
    vaultMode: true,
    vaultTriggeredAt: new Date(),
  });

  await this.logFraudEvent(businessId, 'VAULT_TRIGGERED', 'critical', reason);

  // Send push notification
  await this.notificationsService.sendNotificationForBusiness(
    businessId,
    'VAULT_MODE',
    0,
    '🔒 Vault Mode activated — withdrawals frozen for 24hrs. Contact support if this was not you.'
  );
}

async checkVaultExpiry(): Promise<void> {
  // Auto-release vault after 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await this.businessRepo.update(
    { vaultMode: true, vaultTriggeredAt: LessThan(yesterday) },
    { vaultMode: false, vaultTriggeredAt: null as any }
  );
}
```

### 5. Wire fraud checks into payments service

After T3.3 is built, add to `initiateGatewayPayment` in payments.service.ts:
```typescript
// Check anomaly
const isAnomaly = await this.fraudService.checkTransactionAnomaly(invoice.businessId, total);
if (isAnomaly) {
  // Still process but flag it
  this.logger.warn(`Anomaly flagged for invoice ${dto.invoiceId}`);
}

// Check vault mode
const business = await this.businessRepo.findOne({ where: { id: invoice.businessId } });
if (business?.vaultMode) {
  throw new ForbiddenException('Vault Mode active — payments frozen. Contact support.');
}
```

## API endpoints

```typescript
@Controller('fraud')
@UseGuards(AdminGuard) // admin only
export class FraudController {
  @Get('events/:businessId')
  getFraudEvents(@Param('businessId') businessId: string) { ... }

  @Post('vault/:businessId/trigger')
  triggerVault(@Param('businessId') businessId: string, @Body('reason') reason: string) { ... }

  @Post('vault/:businessId/release')
  releaseVault(@Param('businessId') businessId: string) { ... }

  @Post('secret/:businessId')
  setTransactionSecret(@Param('businessId') businessId: string, @Body('secret') secret: string) { ... }

  @Get('status/:businessId')
  getFraudStatus(@Param('businessId') businessId: string) { ... }
}
```

Also add public endpoint (no admin guard):
```typescript
@Get('public/vault-status/:businessId')
getVaultStatus(@Param('businessId') businessId: string) {
  // Returns only { vaultMode: boolean } — safe to expose to mobile
}
```

## Mobile security screen

### app/security/index.tsx
- Header "Security"
- Vault Mode card:
  - Status: Active (red) | Inactive (green)
  - "Activate Vault" button (triggers 24hr freeze)
  - "Release Vault" button (only if active)
- Transaction Secret card:
  - Current 3-digit code display (masked: ***)
  - "Change Secret" → input new 3-digit code
- Recent Fraud Events list:
  - Each event: type, severity badge, description, date
  - Empty state: "No suspicious activity detected"

Wire into More tab:
```typescript
{ label: 'Security', icon: 'security', route: '/security' }
```

## Build and test

```powershell
# Test fraud status
wsl -d Ubuntu -- bash -c "curl -s http://localhost:3000/api/fraud/public/vault-status/7951dda8-a30e-4928-8350-b6c5662154a8 | python3 -m json.tool"

# Set transaction secret (admin)
wsl -d Ubuntu -- bash -c "python3 -c \"import json; open('/tmp/secret.json','w').write(json.dumps({'secret':'742'}))\""
wsl -d Ubuntu -- bash -c "curl -s -X POST http://localhost:3000/api/fraud/secret/7951dda8-a30e-4928-8350-b6c5662154a8 -H 'x-admin-token: admin-operator-token-dev' -H 'Content-Type: application/json' -d @/tmp/secret.json | python3 -m json.tool"

# Trigger vault mode
wsl -d Ubuntu -- bash -c "python3 -c \"import json; open('/tmp/vault.json','w').write(json.dumps({'reason':'Test vault trigger'}))\""
wsl -d Ubuntu -- bash -c "curl -s -X POST http://localhost:3000/api/fraud/vault/7951dda8-a30e-4928-8350-b6c5662154a8/trigger -H 'x-admin-token: admin-operator-token-dev' -H 'Content-Type: application/json' -d @/tmp/vault.json | python3 -m json.tool"

# Verify vault active
wsl -d Ubuntu -- bash -c "curl -s http://localhost:3000/api/fraud/public/vault-status/7951dda8-a30e-4928-8350-b6c5662154a8 | python3 -m json.tool"
```

## Exit criteria
- [ ] fraud_events table + vault_mode + transaction_secret columns created
- [ ] Large transaction anomaly detection working (>3x avg = flag)
- [ ] Vault Mode triggers and freezes payments
- [ ] Vault auto-releases after 24 hours (cron)
- [ ] Transaction secret set + validated
- [ ] Fraud checks wired into initiateGatewayPayment
- [ ] Security screen shows vault status + recent events
- [ ] API build + mobile tsc: zero errors

## On completion

```powershell
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$raw = [System.IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)
$d = $raw | ConvertFrom-Json
$d.tasks.'T3.3'.status = "complete"
$d.tasks.'T3.3'.notes = "T3.3 COMPLETE: Fraud Shield. Anomaly detection (3x avg), Vault Mode 24hr freeze, transaction secret, SIM-swap stub, fraud events log. Security screen. Fraud checks wired into gateway payment flow."
$d.current_task = "T3.4"
[System.IO.File]::WriteAllText($p, ($d | ConvertTo-Json -Depth 10), [System.Text.Encoding]::UTF8)
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git add -A && git --no-pager commit -m 'T3.3: Fraud Shield — anomaly detection + Vault Mode + transaction secret + security screen'"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git push origin main"
Write-Host "T3.3 COMPLETE"
```
