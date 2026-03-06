# GEMINI.md — Task Brief: T2.1
## Task: VAT Returns — filing engine, period calculator, GavaConnect submission

## Environment rules
- Windows PowerShell host, WSL Ubuntu guest
- All Linux commands: `wsl -d Ubuntu -- <cmd>`
- Yarn: `/home/bishop/.npm-global/bin/yarn`
- write_file tool only for TypeScript — never heredoc
- JSON payloads via python3 to /tmp/file.json
- git --no-pager always
- \pset pager off for psql

## Pre-checks

```powershell
wsl -d Ubuntu -- bash -c "python3 -c \"import json,pathlib; d=json.loads(pathlib.Path('/home/bishop/projects/biasharasmart/progress.txt').read_text(encoding='utf-8-sig')); print(d['tasks']['T1.6']['status'])\""
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -5"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/api/src/entities/vat-return.entity.ts"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/mobile/app/\(tabs\)/more.tsx"
```

## What to build

| File | What |
|---|---|
| `apps/api/src/vat/vat.module.ts` | NestJS VAT module |
| `apps/api/src/vat/vat.controller.ts` | VAT return endpoints |
| `apps/api/src/vat/vat.service.ts` | Period calc, output/input VAT aggregation, GavaConnect submission |
| `apps/api/src/vat/dto/vat.dto.ts` | DTOs |
| `apps/mobile/app/vat/index.tsx` | VAT returns list screen |
| `apps/mobile/app/vat/[period].tsx` | VAT return detail + file button |
| `apps/mobile/app/vat/_layout.tsx` | Stack layout |

## API endpoints

- GET /api/vat/:businessId — list all VAT returns paginated
- GET /api/vat/:businessId/current — get or create current month draft
- POST /api/vat/:businessId/calculate — recalculate from invoices
- POST /api/vat/:id/submit — submit to GavaConnect

## VAT calculation logic

Output VAT = sum of vatAmountKes on all PAID invoices in the period
Input VAT = 0 for now (T3.x will add purchase invoices)
Net VAT = Output VAT - Input VAT

```typescript
async calculateVatForPeriod(businessId: string, month: number, year: number) {
  // Find all paid invoices in period
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const invoices = await this.invoiceRepo.find({
    where: {
      businessId,
      status: InvoiceStatus.PAID,
      createdAt: Between(startDate, endDate),
    },
  });

  const outputVat = invoices.reduce((sum, inv) => sum + Number(inv.vatAmountKes), 0);
  const inputVat = 0; // T3.x
  const netVat = +(outputVat - inputVat).toFixed(2);

  return { outputVat, inputVat, netVat, invoiceCount: invoices.length };
}
```

## Submit logic

```typescript
async submitVatReturn(vatReturnId: string) {
  const vatReturn = await this.vatReturnRepo.findOne({ where: { id: vatReturnId } });
  if (!vatReturn) throw new NotFoundException('VAT return not found');
  if (vatReturn.status !== VatReturnStatus.DRAFT) throw new BadRequestException('Already submitted');

  // Call GavaConnect (stub in sandbox)
  const ackNumber = `VAT_ACK_${Date.now()}`;
  vatReturn.status = VatReturnStatus.SUBMITTED;
  vatReturn.gavaconnectAcknowledgement = ackNumber;
  vatReturn.submittedAt = new Date();
  await this.vatReturnRepo.save(vatReturn);

  // Write ledger: vat_computed entry
  await this.ledgerRepo.save({
    businessId: vatReturn.businessId,
    entryType: EntryType.VAT_COMPUTED,
    amountKes: vatReturn.netVatKes,
    referenceId: vatReturn.id,
    checksum: `vat_${ackNumber}_${Date.now()}`,
    metadata: { period: `${vatReturn.periodMonth}/${vatReturn.periodYear}`, ackNumber },
  });

  return vatReturn;
}
```

## Mobile VAT screen

### app/vat/index.tsx
- Header "VAT Returns"
- Current month card: shows output VAT, input VAT, net VAT, status badge
- "Calculate" button → POST /api/vat/:businessId/calculate
- "File Return" button (only if draft and net > 0) → POST /api/vat/:id/submit
- Previous returns list — VatReturnRow component (build inline)
- Each row: period (Jan 2026), status badge, net VAT amount

### app/vat/[period].tsx
- Detail for specific VAT return
- Breakdown: output VAT, input VAT, net VAT
- Invoice list contributing to output VAT
- Status timeline: Draft → Submitted → Acknowledged
- Download PDF button (use expo-print, same pattern as invoice PDF)

## Wire into More tab

Read current more.tsx and add VAT Returns menu item:
```typescript
{ label: 'VAT Returns', icon: 'receipt-long', route: '/vat' }
```

## Build and test

```powershell
# Start API and test
wsl -d Ubuntu -- bash -c "curl -s http://localhost:3000/api/vat/7951dda8-a30e-4928-8350-b6c5662154a8/current | python3 -m json.tool"
# Expected: draft VAT return for current month

wsl -d Ubuntu -- bash -c "curl -s -X POST http://localhost:3000/api/vat/7951dda8-a30e-4928-8350-b6c5662154a8/calculate | python3 -m json.tool"
# Expected: { outputVat, inputVat: 0, netVat, invoiceCount }
```

## Exit criteria
- [ ] GET /api/vat/:businessId/current returns or creates draft
- [ ] POST /api/vat/:businessId/calculate aggregates from paid invoices
- [ ] POST /api/vat/:id/submit sets status=submitted, writes ledger
- [ ] app/vat/index.tsx shows current period + previous returns
- [ ] More tab has VAT Returns link
- [ ] API build + mobile tsc: zero errors

## On completion

```powershell
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$raw = [System.IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)
$d = $raw | ConvertFrom-Json
$d.tasks.'T2.1'.status = "complete"
$d.tasks.'T2.1'.notes = "T2.1 COMPLETE: VAT filing engine. Period calculator, output VAT from paid invoices, GavaConnect stub submission, ledger entry. VAT list + detail screens. More tab wired."
$d.current_task = "T2.2"
[System.IO.File]::WriteAllText($p, ($d | ConvertTo-Json -Depth 10), [System.Text.Encoding]::UTF8)
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git add -A && git --no-pager commit -m 'T2.1: VAT filing engine + VAT screens'"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git push origin main"
Write-Host "T2.1 COMPLETE"
```
