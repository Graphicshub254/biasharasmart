# GEMINI.md — Task Brief: T1.4
## Task: M-Pesa Dual-Architecture — Legacy Reconciliation + Gateway STK Push + WHT Engine

## Environment rules
- Windows PowerShell host, WSL Ubuntu guest
- All Linux commands: `wsl -d Ubuntu -- <cmd>`
- Yarn binary: `/home/bishop/.npm-global/bin/yarn`
- Project WSL path: `/home/bishop/projects/biasharasmart`
- Write TypeScript files using write_file tool ONLY — never heredoc
- JSON payloads: write to /tmp/file.json first, then curl -d @/tmp/file.json
- Always use git --no-pager for git commands
- Always add \pset pager off to psql commands
- Never use pip, find /, or interactive shells

## Pre-checks

```powershell
# 1. Schema verified
wsl -d Ubuntu -- bash -c "psql postgresql://biasharasmart:devpass@localhost:5432/biasharasmart_dev -c '\pset pager off' -c 'SELECT payment_mode, bia_score FROM businesses LIMIT 1;'"
```
Expected: legacy | 0

```powershell
# 2. Builds clean
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -5"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/mobile tsc --noEmit 2>&1 | tail -5"
```

```powershell
# 3. Read files before writing any code
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/api/src/entities/payment.entity.ts"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/api/src/entities/wht-liability.entity.ts"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/api/src/entities/business.entity.ts"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/mobile/src/components/TransactionRow/TransactionRow.tsx"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/mobile/src/components/AlertBanner/AlertBanner.tsx"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/packages/shared-types/src/index.ts"
```

## Architecture

Two flows live in the same app:

Flow A (Legacy/Observer): Merchant keeps existing Till. App reconciles M-Pesa code manually entered, calculates 5% WHT as pending liability. Red warning shown on dashboard. Merchant must pay KRA manually within 5 days.

Flow B (Gateway/Controller): App controls STK push. WHT split automatic. No manual work for merchant.

The WHT liability pain in Flow A is the upsell trigger toward Flow B.

## Part 1 — NestJS PaymentsModule

Create directory:
```powershell
wsl -d Ubuntu -- bash -c "mkdir -p /home/bishop/projects/biasharasmart/apps/api/src/payments/dto"
```

### DTOs

apps/api/src/payments/dto/initiate-payment.dto.ts
- invoiceId: string (IsUUID)
- phone: string (Matches /^254[0-9]{9}$/)

apps/api/src/payments/dto/reconcile-payment.dto.ts
- businessId: string (IsUUID)
- invoiceId: string (IsUUID)
- mpesaCode: string (IsString)
- amountKes: number (IsNumber, Min 1)
- phone: string (IsString)

### Daraja service

apps/api/src/payments/daraja.service.ts

Separate from onboarding/daraja.service.ts — do not touch that file.

Sandbox (default when DARAJA_ENV unset):
- initiateSTKPush returns { checkoutRequestId: ws_CO_{timestamp}_{random}, responseCode: '0' }
- getAccessToken returns 'sandbox-token'

Production: implement using DARAJA_SHORTCODE, DARAJA_PASSKEY, DARAJA_BASE_URL, DARAJA_CONSUMER_KEY, DARAJA_CONSUMER_SECRET env vars.

### Payments service

apps/api/src/payments/payments.service.ts

Import WHT_RATE and WHT_REMITTANCE_DAYS from @biasharasmart/shared-types.
Inject: Payment repo, Invoice repo, Business repo, WhtLiability repo, Ledger repo, DarajaPaymentsService.

Method 1: initiateGatewayPayment(dto)
1. Fetch invoice, throw NotFoundException if missing
2. total = Number(invoice.totalKes)
3. whtAmount = +(total * WHT_RATE).toFixed(2)
4. merchantAmount = +(total - whtAmount).toFixed(2)
5. Create Payment: paymentFlow='gateway', whtStatus='pending', whtAmountKes=whtAmount, status=PENDING, idempotencyKey=gateway_{invoiceId}_{Date.now()}
6. Call darajaService.initiateSTKPush for FULL amount
7. Save checkoutRequestId as mpesaTransactionId on payment
8. Return { checkoutRequestId, whtAmountKes, merchantAmountKes, message }

Method 2: reconcileLegacyPayment(dto)
1. Check mpesaCode idempotency — throw ConflictException if already exists
2. whtAmount = +(dto.amountKes * WHT_RATE).toFixed(2)
3. Save Payment: paymentFlow='legacy', whtStatus='pending', whtAmountKes=whtAmount, mpesaCode=dto.mpesaCode, status=CONFIRMED, resolvedAt=now, idempotencyKey=legacy_{mpesaCode}
4. Write Ledger: entryType='payment_received', amountKes=dto.amountKes, checksum=legacy_{mpesaCode}_{Date.now()}, metadata={mpesaCode, whtAmount, flow:'legacy'}
5. Update invoice to PAID
6. Create WhtLiability: amountKes=whtAmount, dueDate=now+WHT_REMITTANCE_DAYS days, status=PENDING
7. Return { payment, whtLiability }

Method 3: handleDarajaWebhook(body)
1. Extract CheckoutRequestID, ResultCode, CallbackMetadata from body.Body.stkCallback
2. Find payment by mpesaTransactionId — return silently if not found
3. ResultCode===0: status=CONFIRMED, mpesaCode from metadata Item MpesaReceiptNumber, whtStatus='escrowed', resolvedAt=now, write ledger, update invoice to PAID
4. ResultCode!==0: status=FAILED
5. Save payment

Method 4: getWhtSummary(businessId)
1. Fetch business, throw NotFoundException if missing
2. Find pending WhtLiabilities, order dueDate ASC
3. Sum totalPending, count overdueCount (dueDate < now)
4. Return { totalPending, overdueCount, nextDueDate, paymentMode: business.paymentMode }

Method 5: listPayments(businessId)
- findAndCount by businessId, order createdAt DESC, take 20
- Return { data, total }

### Controller

apps/api/src/payments/payments.controller.ts

Route order is critical — define exactly in this order:
1. POST gateway/initiate
2. POST legacy/reconcile
3. POST webhook/daraja (HttpCode 200)
4. GET wht-summary/:businessId
5. GET :businessId

### Module

apps/api/src/payments/payments.module.ts

Imports: TypeOrmModule.forFeature([Payment, Invoice, Business, WhtLiability]) + OnboardingModule
Providers: PaymentsService, DarajaPaymentsService
Exports: PaymentsService

Read app.module.ts first, then add PaymentsModule to imports array.

Check how Ledger entity is registered — if it's in a DatabaseModule, import that. If not, add Ledger to forFeature array.

## Part 2 — Mobile screens

### apps/mobile/app/payments/_layout.tsx
Stack navigator, headerShown: false. Same pattern as invoices/_layout.tsx.

### apps/mobile/app/(tabs)/payments.tsx
Replace placeholder entirely. Read AlertBanner and TransactionRow props before writing.

Layout top to bottom:
1. Header "Payments"
2. WHT AlertBanner (only if totalPending > 0): variant=error if overdueCount>0 else warning, message="WHT Due: KES {totalPending}"
3. Gateway upsell AlertBanner (only if paymentMode==='legacy'): variant=warning, message="Switch to Gateway — WHT auto-handled. Bia Score +100 pts."
4. TransactionRow list of payments
5. FAB "Collect Payment" → router.push('/payments/confirm')
6. Empty state text

Fetch: Promise.all for payments list and wht-summary.

### apps/mobile/app/payments/confirm.tsx
Two tabs: STK Push | Manual Reconcile

STK Push tab:
- Phone input 254XXXXXXXXX
- Invoice ID input (pre-filled from ?invoiceId= query param)
- Invoice summary card + WHT breakdown when invoiceId set
- "Send STK Push" → POST /api/payments/gateway/initiate
- Success: poll GET /api/invoices/:id every 3s up to 60s, on paid → router.replace('/(tabs)/payments')

Manual Reconcile tab:
- M-Pesa Code input
- Amount KES input
- Invoice ID input
- "Reconcile" → POST /api/payments/legacy/reconcile
- Success: show "WHT liability of KES X created — due in 5 days"

## Part 3 — Dashboard additions

Read dashboard.tsx top 80 lines first:
```powershell
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/mobile/app/\(tabs\)/dashboard.tsx | head -80"
```

Add:
1. Fetch wht-summary alongside dashboard fetch
2. 5th MetricTile: label="WHT Due", value=whtSummary.totalPending, unit="KES", accentColor=overdueCount>0 ? colors.red : colors.gold
3. 6th MetricTile: label="Bia Score", value=420 (hardcoded), unit="/ 1000", accentColor=colors.cobalt
4. AlertBanner below tiles: show only if paymentMode==='legacy', variant=warning, message="Switch to Gateway — WHT auto-handled. Bia Score +100 pts.", action → router.push('/(tabs)/payments')

## Part 4 — Build and test

```powershell
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -10"
```

Start API:
```powershell
Start-Job -ScriptBlock { wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api start:dev 2>&1" }
Start-Sleep -Seconds 25
wsl -d Ubuntu -- bash -c "curl -s http://localhost:3000/api/dashboard/summary | python3 -c 'import json,sys; print(\"OK\", json.load(sys.stdin)[\"business\"][\"name\"])'"
```

Get invoice ID:
```powershell
wsl -d Ubuntu -- bash -c "curl -s 'http://localhost:3000/api/invoices?businessId=7951dda8-a30e-4928-8350-b6c5662154a8' | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d[\"data\"][0][\"id\"] if d[\"data\"] else \"NO_INVOICES\")'"
```

Test legacy reconcile — use python3 to write payload (no quoting issues):
```powershell
wsl -d Ubuntu -- bash -c "python3 -c \"import json; open('/tmp/reconcile.json','w').write(json.dumps({'businessId':'7951dda8-a30e-4928-8350-b6c5662154a8','invoiceId':'REPLACE_ID','mpesaCode':'QGH2XK8L9P','amountKes':11600,'phone':'254712345678'}))\""
wsl -d Ubuntu -- bash -c "curl -s -X POST http://localhost:3000/api/payments/legacy/reconcile -H 'Content-Type: application/json' -d @/tmp/reconcile.json | python3 -m json.tool"
```

Expected: payment.whtAmountKes=580, whtLiability.amountKes=580

Test WHT summary:
```powershell
wsl -d Ubuntu -- bash -c "curl -s http://localhost:3000/api/payments/wht-summary/7951dda8-a30e-4928-8350-b6c5662154a8 | python3 -m json.tool"
```

Expected: totalPending=580, overdueCount=0, paymentMode=legacy

Test idempotency (same mpesaCode — must return 409):
```powershell
wsl -d Ubuntu -- bash -c "curl -s -X POST http://localhost:3000/api/payments/legacy/reconcile -H 'Content-Type: application/json' -d @/tmp/reconcile.json | python3 -m json.tool"
```

Test gateway initiate:
```powershell
wsl -d Ubuntu -- bash -c "python3 -c \"import json; open('/tmp/gateway.json','w').write(json.dumps({'invoiceId':'REPLACE_ID','phone':'254712345678'}))\""
wsl -d Ubuntu -- bash -c "curl -s -X POST http://localhost:3000/api/payments/gateway/initiate -H 'Content-Type: application/json' -d @/tmp/gateway.json | python3 -m json.tool"
```

Expected: checkoutRequestId=ws_CO_..., whtAmountKes=580, merchantAmountKes=11020

Mobile tsc:
```powershell
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/mobile tsc --noEmit 2>&1 | tail -10"
```

## Exit criteria — ALL must pass

- [ ] POST /api/payments/gateway/initiate returns checkoutRequestId + whtAmountKes
- [ ] POST /api/payments/legacy/reconcile creates payment + wht_liability at exactly 5% WHT
- [ ] GET /api/payments/wht-summary/:businessId returns totalPending, overdueCount, paymentMode
- [ ] POST /api/payments/webhook/daraja processes callback, updates invoice to paid, writes ledger
- [ ] Duplicate mpesaCode returns 409 ConflictException
- [ ] WHT uses WHT_RATE from shared-types (not hardcoded)
- [ ] app/(tabs)/payments.tsx not a placeholder — shows WHT alert + upsell banner
- [ ] app/payments/confirm.tsx has STK Push tab + Manual Reconcile tab
- [ ] Dashboard has WHT Due + Bia Score tiles + gateway AlertBanner
- [ ] API build: zero errors
- [ ] Mobile tsc: zero errors

## Do NOT do
- Do not build TCC screen — T1.5
- Do not implement real Co-op escrow — sandbox only
- Do not use synchronize: true
- Do not use heredoc for file writes
- Do not use find /
- Do not use bare git diff

## On completion

```powershell
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$raw = [System.IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)
$d = $raw | ConvertFrom-Json
$d.tasks.'T1.4'.status = "complete"
$d.tasks.'T1.4'.notes = "T1.4 COMPLETE: Dual-arch payments. Legacy: M-Pesa reconcile, 5pct WHT liability, ledger. Gateway: STK push sandbox, Daraja webhook, ledger. WHT summary. Payments+confirm screens. Dashboard WHT+BiaScore tiles + gateway upsell. tsc clean."
$d.current_task = "T1.5"
[System.IO.File]::WriteAllText($p, ($d | ConvertTo-Json -Depth 10), [System.Text.Encoding]::UTF8)
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git add -A && git --no-pager commit -m 'T1.4: M-Pesa dual-architecture — legacy WHT liability + gateway STK push + WHT dashboard widget'"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git push origin main"
Write-Host "T1.4 COMPLETE"
```