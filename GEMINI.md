# GEMINI.md — Task Brief: T1.3b
## Task: Build invoice list screen + create invoice screen

---

## Environment rules
- You run on **Windows PowerShell**
- All Linux commands: `wsl -d Ubuntu -- <cmd>`
- Project WSL path: `/home/bishop/projects/biasharasmart`
- Write files via: `Set-Content -Path "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\<relative-path>" -Encoding UTF8`
- Read files via: `wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/<file>"`
- **Never use pip install** — Ubuntu 24.04 blocks it
- **Never use --break-system-packages**
- **Never use `find /`** — hangs the terminal

---

## Pre-checks — run these first, stop if any fail

```powershell
# 1. T1.3a API endpoints must be live
wsl -d Ubuntu -- bash -c "curl -s 'http://localhost:3000/api/invoices?businessId=7951dda8-a30e-4928-8350-b6c5662154a8' | python3 -c \"import json,sys; d=json.load(sys.stdin); print('OK', d['total'], 'invoices')\""
```
Expected: `OK X invoices`. If connection refused, start the API:
```powershell
Start-Job -ScriptBlock { wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && yarn workspace @biasharasmart/api start:dev 2>&1" }
Start-Sleep -Seconds 20
```

```powershell
# 2. Mobile tsc must be clean
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && yarn workspace @biasharasmart/mobile tsc --noEmit 2>&1 | tail -5"
```

```powershell
# 3. Read component stubs — use exact prop names
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/mobile/src/components/InvoiceCard/InvoiceCard.tsx"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/mobile/src/components/ActionButton/ActionButton.tsx"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/mobile/src/components/InputField/InputField.tsx"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/mobile/src/components/SkeletonLoader/SkeletonLoader.tsx"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/packages/shared-types/src/index.ts"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/packages/ui-tokens/src/colors.ts"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/packages/ui-tokens/src/spacing.ts"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/packages/ui-tokens/src/typography.ts"
```

```powershell
# 4. Read current invoices placeholder
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/mobile/app/\(tabs\)/invoices.tsx"
```

---

## What to build

| File | What it does |
|---|---|
| `apps/mobile/app/(tabs)/invoices.tsx` | Invoice list with filters, search, pull-to-refresh |
| `apps/mobile/app/invoices/create.tsx` | Create invoice form with line items |
| `apps/mobile/app/invoices/_layout.tsx` | Stack layout for invoice sub-screens |

---

## Part 1 — invoices/_layout.tsx

File: `apps/mobile/app/invoices/_layout.tsx`

```typescript
import { Stack } from 'expo-router';
import { colors } from '@biasharasmart/ui-tokens';

export default function InvoicesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.ink },
        animation: 'slide_from_right',
      }}
    />
  );
}
```

---

## Part 2 — Invoice list screen

File: `apps/mobile/app/(tabs)/invoices.tsx` — replace the placeholder entirely.

**Design spec:**
- Background: `colors.ink`
- Header row: "Invoices" title left, "+" icon button right (navigates to `/invoices/create`)
- Filter pills row (horizontal ScrollView, no scroll indicator):
  - Pills: All | Draft | Pending KRA | Issued | Paid | Overdue
  - Selected pill: background `colors.cobalt`, text `colors.white`
  - Unselected: background `colors.greyDark`, text `colors.greyMid`
- Invoice list: FlatList of `InvoiceCard` components
- Empty state: centered icon + "No invoices yet" + "Create your first invoice" button
- Pull-to-refresh: `RefreshControl` with `colors.mint` tint
- Loading state: `SkeletonLoader variant="card" count={5}`
- Bottom padding so last item clears the tab bar

**Data fetching:**
```typescript
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8'; // temp until auth in T1.6

const fetchInvoices = async (statusFilter?: string) => {
  setLoading(true);
  try {
    const params = new URLSearchParams({ businessId: BUSINESS_ID });
    if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
    const res = await fetch(`${API_BASE}/api/invoices?${params}`);
    const data = await res.json();
    setInvoices(data.data ?? []);
    setTotal(data.total ?? 0);
  } catch {
    setInvoices([]);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};
```

**Filter pills:**
```typescript
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'pending_kra', label: 'Pending KRA' },
  { key: 'issued', label: 'Issued' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
];
```

**InvoiceCard props mapping:**
```typescript
// Map API response to InvoiceCard props
<InvoiceCard
  key={item.id}
  id={item.id}
  customerName={item.customerName ?? 'Unknown Customer'}
  amount={parseFloat(item.totalKes)}   // API returns string from numeric column
  status={item.status}
  cuNumber={item.cuNumber}
  invoiceNumber={item.id.slice(-8).toUpperCase()}
  onPress={() => router.push(`/invoices/${item.id}`)}
/>
```

**On mount + on filter change:** call `fetchInvoices(activeFilter)`
**On pull-to-refresh:** call `fetchInvoices(activeFilter)`
**On focus (useFocusEffect):** refetch so list updates after create

---

## Part 3 — Create invoice screen

File: `apps/mobile/app/invoices/create.tsx`

**Design spec:**
- Background: `colors.ink`
- Back chevron top-left
- Header: "New Invoice"
- Scrollable form with sections:

**Section 1 — Customer**
- InputField: "Customer Name" (optional)
- InputField: "Customer Phone" (optional, numeric)

**Section 2 — Line Items**
- List of line item rows (start with 1, can add more)
- Each row:
  - InputField: description (flex 2)
  - InputField: qty (flex 1, numeric)
  - InputField: unit price KES (flex 1, numeric)
  - VAT toggle: 16% | 0% pill selector
  - Calculated line total shown below in `colors.mint`
  - Delete button (trash icon) — hidden if only 1 line item
- "Add Line Item" ghost button at bottom of section

**Section 3 — Totals (read-only, auto-calculated)**
- Subtotal: right-aligned, `colors.white`
- VAT: right-aligned, `colors.greyMid`
- Total: right-aligned, large, `colors.mint`, JetBrains Mono font
- Divider line above Total

**Submit button:** "Create Invoice" — full width, primary variant
- Disabled until at least 1 line item has description + qty + price
- Shows spinner while submitting

**Line item state shape:**
```typescript
type LineItemForm = {
  id: string;          // local key for FlatList
  description: string;
  quantity: string;    // string for TextInput, parse on submit
  unitPrice: string;
  vatRate: number;     // 0.16 or 0
};
```

**Total calculation (recalculate on every change):**
```typescript
const calculateTotals = (items: LineItemForm[]) => {
  let subtotal = 0;
  let vat = 0;
  items.forEach(item => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const lineTotal = qty * price;
    subtotal += lineTotal;
    vat += lineTotal * item.vatRate;
  });
  return { subtotal, vat, total: subtotal + vat };
};
```

**Submit logic:**
```typescript
const handleSubmit = async () => {
  setSubmitting(true);
  try {
    const res = await fetch(`${API_BASE}/api/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: BUSINESS_ID,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        lineItems: lineItems.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          vatRate: item.vatRate,
        })),
      }),
    });
    if (!res.ok) throw new Error('Failed to create invoice');
    const invoice = await res.json();
    router.replace(`/invoices/${invoice.id}`); // go to detail — T1.3c will build this
  } catch (e: any) {
    Alert.alert('Error', e.message ?? 'Could not create invoice');
  } finally {
    setSubmitting(false);
  }
};
```

**Note:** `router.replace('/invoices/${invoice.id}')` will 404 until T1.3c builds the detail screen. That is acceptable — change it to `router.back()` as a temporary fallback:
```typescript
// Temporary until T1.3c builds detail screen
router.back();
```

---

## TypeScript check

```powershell
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && yarn workspace @biasharasmart/mobile tsc --noEmit 2>&1 | tail -10"
```

Zero errors required.

---

## Verify files

```powershell
wsl -d Ubuntu -- bash -c "find /home/bishop/projects/biasharasmart/apps/mobile/app/invoices -type f | sort"
wsl -d Ubuntu -- bash -c "wc -l /home/bishop/projects/biasharasmart/apps/mobile/app/\(tabs\)/invoices.tsx /home/bishop/projects/biasharasmart/apps/mobile/app/invoices/create.tsx"
```

Both files must be over 100 lines.

---

## Exit criteria — ALL must pass

- [ ] `tsc --noEmit` returns zero errors
- [ ] `app/(tabs)/invoices.tsx` is over 100 lines (not a placeholder)
- [ ] `app/invoices/create.tsx` is over 100 lines
- [ ] `app/invoices/_layout.tsx` exists
- [ ] Filter pills render for all 6 statuses
- [ ] Tapping "+" navigates to `/invoices/create`
- [ ] Invoice list fetches from API and renders InvoiceCard components
- [ ] Pull-to-refresh works (RefreshControl present)
- [ ] useFocusEffect refetches on screen focus
- [ ] Create form has customer fields + line items section + totals section
- [ ] Adding a line item recalculates totals immediately
- [ ] Submit calls `POST /api/invoices` with correct payload
- [ ] `parseFloat()` used on all numeric API response fields
- [ ] No hardcoded colors — all use `colors.*` from ui-tokens
- [ ] `BUSINESS_ID` hardcoded as temp constant with comment "temp until auth in T1.6"

---

## Do NOT do
- Do not build invoice detail screen — that is T1.3c
- Do not implement pagination (load more) — keep it simple, fetch 20 at a time
- Do not use `navigation.navigate` — use `router.push` from expo-router
- Do not hardcode colors — use `colors.*` only
- Do not use `find /` to locate binaries
- Do not open interactive shells

---

## On completion — update progress.txt

```powershell
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$raw = [System.IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)
$d = $raw | ConvertFrom-Json
$d.tasks.'T1.3'.notes = "T1.3a+b complete: NestJS InvoicesModule (5 endpoints). Invoice list screen with filter pills, pull-to-refresh, useFocusEffect. Create invoice form with dynamic line items and live total calculation. tsc clean."
[System.IO.File]::WriteAllText($p, ($d | ConvertTo-Json -Depth 10), [System.Text.Encoding]::UTF8)
Write-Host "T1.3b COMPLETE"
```