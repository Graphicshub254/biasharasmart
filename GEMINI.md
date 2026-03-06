# GEMINI.md — Task Brief: T2.4
## Task: Reports — P&L, KRA Reconciliation, WHT Statement — one-tap PDF export

## Environment rules
- Same as all previous tasks

## Pre-checks

```powershell
wsl -d Ubuntu -- bash -c "python3 -c \"import json,pathlib; d=json.loads(pathlib.Path('/home/bishop/projects/biasharasmart/progress.txt').read_text(encoding='utf-8-sig')); print(d['tasks']['T2.3']['status'])\""
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -5"
```

## What to build

| File | What |
|---|---|
| `apps/api/src/reports/reports.module.ts` | Reports module |
| `apps/api/src/reports/reports.service.ts` | Data aggregation for 3 report types |
| `apps/api/src/reports/reports.controller.ts` | Report endpoints |
| `apps/mobile/app/reports/index.tsx` | Reports menu screen |
| `apps/mobile/app/reports/pl.tsx` | P&L report screen + PDF export |
| `apps/mobile/app/reports/kra.tsx` | KRA Reconciliation report screen + PDF |
| `apps/mobile/app/reports/wht.tsx` | WHT Statement screen + PDF |
| `apps/mobile/app/reports/_layout.tsx` | Stack layout |

## API endpoints

- GET /api/reports/:businessId/pl?month=&year= — P&L summary
- GET /api/reports/:businessId/kra?month=&year= — KRA reconciliation
- GET /api/reports/:businessId/wht?month=&year= — WHT statement

## P&L calculation

```typescript
async getProfitAndLoss(businessId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Revenue: confirmed payments in period
  const payments = await this.paymentRepo.find({
    where: { businessId, status: PaymentStatus.CONFIRMED, resolvedAt: Between(startDate, endDate) },
  });
  const revenue = payments.reduce((s, p) => s + Number(p.amountKes), 0);

  // VAT collected: from paid invoices
  const invoices = await this.invoiceRepo.find({
    where: { businessId, status: InvoiceStatus.PAID, updatedAt: Between(startDate, endDate) },
  });
  const vatCollected = invoices.reduce((s, i) => s + Number(i.vatAmountKes), 0);

  // WHT deducted: from confirmed payments
  const whtDeducted = payments.reduce((s, p) => s + Number(p.whtAmountKes), 0);

  // Net revenue
  const netRevenue = +(revenue - whtDeducted).toFixed(2);

  return {
    period: { month, year },
    revenue,
    vatCollected,
    whtDeducted,
    netRevenue,
    invoiceCount: invoices.length,
    paymentCount: payments.length,
    generatedAt: new Date().toISOString(),
  };
}
```

## KRA Reconciliation

```typescript
async getKraReconciliation(businessId: string, month: number, year: number) {
  // Match each invoice to its M-Pesa payment and CU number
  const invoices = await this.invoiceRepo.find({
    where: { businessId, updatedAt: Between(startDate, endDate) },
    order: { createdAt: 'ASC' },
  });

  const rows = await Promise.all(invoices.map(async inv => {
    const payment = await this.paymentRepo.findOne({ where: { invoiceId: inv.id, status: PaymentStatus.CONFIRMED } });
    return {
      invoiceRef: inv.id.slice(-8).toUpperCase(),
      cuNumber: inv.cuNumber ?? 'UNREGISTERED',
      status: inv.status,
      totalKes: Number(inv.totalKes),
      vatKes: Number(inv.vatAmountKes),
      mpesaCode: payment?.mpesaCode ?? 'UNPAID',
      paymentDate: payment?.resolvedAt ?? null,
    };
  }));

  const totalVatDue = rows.reduce((s, r) => s + r.vatKes, 0);
  const unregistered = rows.filter(r => r.cuNumber === 'UNREGISTERED').length;

  return { period: { month, year }, rows, totalVatDue, unregistered, generatedAt: new Date().toISOString() };
}
```

## Mobile reports screens

### app/reports/index.tsx
- Header "Reports"
- Month/Year selector (default: current month)
- Three report cards (TouchableOpacity):
  - "Profit & Loss" → /reports/pl
  - "KRA Reconciliation" → /reports/kra
  - "WHT Statement" → /reports/wht
- Each card shows last generated date if available

### app/reports/pl.tsx (same pattern for kra.tsx and wht.tsx)
- Fetch report from API on load
- Display data in SectionCard components
- "Export PDF" button at bottom — use expo-print + expo-sharing
- HTML template for PDF: BiasharaSmart branded, professional format
- Month/year controls to regenerate for different periods

## Wire into More tab

Add "Reports" to more.tsx menu:
```typescript
{ label: 'Reports', icon: 'assessment', route: '/reports' }
```

## Exit criteria
- [ ] GET /api/reports/:businessId/pl returns revenue, VAT, WHT, net
- [ ] GET /api/reports/:businessId/kra returns invoice-payment reconciliation rows
- [ ] GET /api/reports/:businessId/wht returns WHT liability statement
- [ ] app/reports/index.tsx shows 3 report options with month selector
- [ ] Each report screen exports PDF via expo-print
- [ ] More tab has Reports link
- [ ] API + mobile: zero errors

## On completion

```powershell
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$raw = [System.IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)
$d = $raw | ConvertFrom-Json
$d.tasks.'T2.4'.status = "complete"
$d.tasks.'T2.4'.notes = "T2.4 COMPLETE: Reports — P&L, KRA Reconciliation, WHT Statement. All 3 API endpoints. PDF export via expo-print. Reports menu screen with month selector. More tab wired."
$d.current_task = "T3.1"
$d.current_phase = 3
[System.IO.File]::WriteAllText($p, ($d | ConvertTo-Json -Depth 10), [System.Text.Encoding]::UTF8)
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git add -A && git --no-pager commit -m 'T2.4: Reports — P&L + KRA Reconciliation + WHT Statement + PDF export'"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git push origin main"
Write-Host "T2.4 COMPLETE — PHASE 2 DONE"
