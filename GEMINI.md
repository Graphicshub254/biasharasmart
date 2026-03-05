# GEMINI.md — Task Brief: T1.3c
## Task: Invoice detail screen + PDF generation + share

---

## Environment rules
- You run on **Windows PowerShell**
- All Linux commands: `wsl -d Ubuntu -- <cmd>`
- Yarn binary: `/home/bishop/.npm-global/bin/yarn`
- Project WSL path: `/home/bishop/projects/biasharasmart`
- Write files via: `Set-Content -Path "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\<path>" -Encoding UTF8`
- **Never use pip, find /, or interactive shells**

---

## Pre-checks

```powershell
# 1. T1.3b files exist
wsl -d Ubuntu -- bash -c "wc -l /home/bishop/projects/biasharasmart/apps/mobile/app/\(tabs\)/invoices.tsx /home/bishop/projects/biasharasmart/apps/mobile/app/invoices/create.tsx"
```
Both must be over 100 lines.

```powershell
# 2. tsc clean
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/mobile tsc --noEmit 2>&1 | tail -5"
```

```powershell
# 3. Read component stubs
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/mobile/src/components/StatusBadge/StatusBadge.tsx"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/packages/shared-types/src/index.ts"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/packages/ui-tokens/src/colors.ts"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/packages/ui-tokens/src/spacing.ts"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/packages/ui-tokens/src/typography.ts"
```

---

## What to build

| File | What it does |
|---|---|
| `apps/mobile/app/invoices/[id].tsx` | Invoice detail screen |

---

## Step 1 — Check expo-sharing and expo-print are installed

```powershell
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/mobile/package.json | python3 -m json.tool | grep -E 'sharing|print'"
```

If missing:
```powershell
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/mobile add expo-sharing expo-print"
```

---

## Step 2 — Build invoice detail screen

File: `apps/mobile/app/invoices/[id].tsx`

**Design spec:**
- Background: `colors.ink`
- Back chevron top-left → `router.back()`
- Header row: "Invoice" title + StatusBadge (right)
- Invoice meta card (`colors.greyDark` background):
  - Invoice ref: last 8 chars of ID, monospace, `colors.greyMid`
  - Customer name: large, `colors.white`
  - Customer phone (if present): `colors.greyMid`
  - KRA CU badge: if `cuNumber` present, show green "KRA ✓ {cuNumber}" pill
  - Created date: formatted "DD MMM YYYY"
- Line items section (SectionCard title="Items"):
  - Each line: description left, "Qty x Price" centre, total right in `colors.mint`
  - VAT rate shown as small label: "VAT 16%" or "VAT 0%"
- Totals section:
  - Subtotal row: label + amount right-aligned
  - VAT row: label + amount right-aligned, `colors.greyMid`
  - Divider
  - Total row: bold, large, `colors.mint`, JetBrains Mono
- Action buttons row at bottom (2 buttons side by side):
  - "Share PDF" — `variant="secondary"` — generates PDF and shares
  - "Mark as Paid" — `variant="primary"` — only shown if status is `issued` or `pending_kra`
  - "Sync KRA" — `variant="ghost"` — only shown if `offlineQueued === true`

**Data fetching:**
```typescript
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const { id } = useLocalSearchParams<{ id: string }>();

useEffect(() => {
  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/invoices/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setInvoice(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };
  if (id) fetchInvoice();
}, [id]);
```

**Mark as paid:**
```typescript
const markAsPaid = async () => {
  const res = await fetch(`${API_BASE}/api/invoices/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'paid' }),
  });
  if (res.ok) {
    const updated = await res.json();
    setInvoice(updated);
  }
};
```

**Sync KRA:**
```typescript
const syncKra = async () => {
  setSyncing(true);
  const res = await fetch(`${API_BASE}/api/invoices/${id}/sync`, { method: 'POST' });
  if (res.ok) {
    const updated = await res.json();
    setInvoice(updated);
  }
  setSyncing(false);
};
```

**PDF generation and share:**
```typescript
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const sharePdf = async () => {
  if (!invoice) return;
  const html = `
    <html><body style="font-family: Arial; padding: 20px;">
      <h1 style="color: #003366;">BiasharaSmart Invoice</h1>
      <p><strong>Ref:</strong> ${invoice.id.slice(-8).toUpperCase()}</p>
      <p><strong>Customer:</strong> ${invoice.customerName ?? 'N/A'}</p>
      <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString('en-KE')}</p>
      ${invoice.cuNumber ? `<p><strong>KRA CU:</strong> ${invoice.cuNumber}</p>` : ''}
      <hr/>
      <table width="100%">
        <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        ${invoice.lineItems.map((item: any) => `
          <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>KES ${parseFloat(item.unitPrice).toLocaleString('en-KE')}</td>
            <td>KES ${parseFloat(item.total).toLocaleString('en-KE')}</td>
          </tr>
        `).join('')}
      </table>
      <hr/>
      <p style="text-align:right;">Subtotal: KES ${parseFloat(invoice.subtotalKes).toLocaleString('en-KE')}</p>
      <p style="text-align:right;">VAT: KES ${parseFloat(invoice.vatAmountKes).toLocaleString('en-KE')}</p>
      <h2 style="text-align:right; color: #00BFA5;">Total: KES ${parseFloat(invoice.totalKes).toLocaleString('en-KE')}</h2>
    </body></html>
  `;
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Invoice ${invoice.id.slice(-8).toUpperCase()}`,
  });
};
```

**Loading state:** `SkeletonLoader variant="card" count={4}`
**Error state:** centered "Invoice not found" + back button

---

## TypeScript check + verify

```powershell
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/mobile tsc --noEmit 2>&1 | tail -10"
wsl -d Ubuntu -- bash -c "wc -l /home/bishop/projects/biasharasmart/apps/mobile/app/invoices/\[id\].tsx"
```

File must be over 120 lines.

---

## Exit criteria

- [ ] `app/invoices/[id].tsx` exists and is over 120 lines
- [ ] Fetches invoice from `GET /api/invoices/:id`
- [ ] Shows line items with individual totals
- [ ] Shows subtotal, VAT, total
- [ ] "Mark as Paid" button calls `PATCH /api/invoices/:id/status`
- [ ] "Sync KRA" button shown only when `offlineQueued === true`
- [ ] "Share PDF" generates HTML PDF and opens share sheet
- [ ] tsc: zero errors

---

## Do NOT do
- Do not build payments screen — that is T1.4
- Do not use hardcoded colors
- Do not use `find /`

---

## On completion

```powershell
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$raw = [System.IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)
$d = $raw | ConvertFrom-Json
$d.tasks.'T1.3'.notes = "T1.3a+b+c complete: NestJS 5 endpoints, invoice list+create+detail screens, PDF share via expo-print. tsc clean."
[System.IO.File]::WriteAllText($p, ($d | ConvertTo-Json -Depth 10), [System.Text.Encoding]::UTF8)
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git add -A && git commit -m 'T1.3c: Invoice detail screen + PDF share'"
Write-Host "T1.3c COMPLETE"
```
