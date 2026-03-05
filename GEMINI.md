# GEMINI.md — Task Brief: T1.3d
## Task: Offline queue sync + T1.3 integration verification

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
# 1. T1.3c detail screen exists
wsl -d Ubuntu -- bash -c "wc -l /home/bishop/projects/biasharasmart/apps/mobile/app/invoices/\[id\].tsx"
```
Must be over 120 lines.

```powershell
# 2. Both workspaces clean
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -5"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/mobile tsc --noEmit 2>&1 | tail -5"
```

```powershell
# 3. Read offline sync service
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/api/src/invoices/invoices.service.ts"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/mobile/src/lib/network.ts"
```

---

## What to build

| File | What it does |
|---|---|
| `apps/mobile/src/lib/invoice-sync.ts` | Auto-sync offline queue when connection restored |
| `apps/api/src/invoices/invoices.service.ts` | Add `getOfflineQueue` method |
| `apps/api/src/invoices/invoices.controller.ts` | Add `GET /api/invoices/offline-queue/:businessId` |

---

## Part 1 — API: offline queue endpoint

Add to `invoices.service.ts`:
```typescript
async getOfflineQueue(businessId: string): Promise<Invoice[]> {
  return this.invoiceRepository.find({
    where: { businessId, offlineQueued: true },
    order: { createdAt: 'ASC' },
  });
}
```

Add to `invoices.controller.ts`:
```typescript
@Get('offline-queue/:businessId')
getOfflineQueue(@Param('businessId') businessId: string) {
  return this.invoicesService.getOfflineQueue(businessId);
}
```

---

## Part 2 — Mobile: invoice-sync utility

File: `apps/mobile/src/lib/invoice-sync.ts`

```typescript
import { useEffect, useRef } from 'react';
import { useNetworkStatus } from './network';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8'; // temp until T1.6 auth

export function useInvoiceSync() {
  const { isOnline } = useNetworkStatus();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }

    // Only sync if we were previously offline
    if (!wasOffline.current) return;
    wasOffline.current = false;

    const syncQueue = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/invoices/offline-queue/${BUSINESS_ID}`
        );
        if (!res.ok) return;
        const queued: any[] = await res.json();

        // Fire sync for each queued invoice
        await Promise.allSettled(
          queued.map(invoice =>
            fetch(`${API_BASE}/api/invoices/${invoice.id}/sync`, {
              method: 'POST',
            })
          )
        );
      } catch {
        // Silent fail — will retry next reconnect
      }
    };

    syncQueue();
  }, [isOnline]);
}
```

---

## Part 3 — Wire sync into dashboard

Read current dashboard.tsx:
```powershell
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/mobile/app/\(tabs\)/dashboard.tsx | head -30"
```

Add `useInvoiceSync()` hook call inside the dashboard component:
```typescript
import { useInvoiceSync } from '../../src/lib/invoice-sync';

// Inside component:
useInvoiceSync(); // auto-syncs offline invoice queue on reconnect
```

---

## Part 4 — Integration test

Start API:
```powershell
Start-Job -ScriptBlock { wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api start:dev 2>&1" }
Start-Sleep -Seconds 20
```

Run full flow test:
```powershell
$BID = "7951dda8-a30e-4928-8350-b6c5662154a8"

# 1. Create invoice
wsl -d Ubuntu -- bash -c "curl -s -X POST http://localhost:3000/api/invoices -H 'Content-Type: application/json' -d '{\"businessId\":\"$BID\",\"customerName\":\"Integration Test\",\"lineItems\":[{\"description\":\"Service Fee\",\"quantity\":2,\"unitPrice\":5000,\"vatRate\":0.16}]}' > /tmp/inv.json && cat /tmp/inv.json | python3 -m json.tool | grep -E 'id|status|cuNumber|totalKes'"

# 2. Get invoice ID
wsl -d Ubuntu -- bash -c "cat /tmp/inv.json | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d[\"id\"])'" 

# Store ID and test detail + status update
# 3. Get detail
wsl -d Ubuntu -- bash -c "IID=\$(cat /tmp/inv.json | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d[\"id\"])') && curl -s http://localhost:3000/api/invoices/\$IID | python3 -m json.tool | grep -E 'id|status|totalKes'"

# 4. Mark as paid
wsl -d Ubuntu -- bash -c "IID=\$(cat /tmp/inv.json | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d[\"id\"])') && curl -s -X PATCH http://localhost:3000/api/invoices/\$IID/status -H 'Content-Type: application/json' -d '{\"status\":\"paid\"}' | python3 -m json.tool | grep status"

# 5. Verify list now shows 1+ invoices
wsl -d Ubuntu -- bash -c "curl -s 'http://localhost:3000/api/invoices?businessId=$BID' | python3 -m json.tool | grep total"
```

Expected: invoice created with cuNumber, detail returns line items, status updated to paid, list shows total > 0.

---

## TypeScript + build check

```powershell
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -5"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/mobile tsc --noEmit 2>&1 | tail -5"
```

---

## Exit criteria

- [ ] `GET /api/invoices/offline-queue/:businessId` returns array
- [ ] `src/lib/invoice-sync.ts` exists with `useInvoiceSync` hook
- [ ] `useInvoiceSync` wired into dashboard.tsx
- [ ] Full flow test passes: create → detail → mark paid → list updated
- [ ] API build: zero errors
- [ ] Mobile tsc: zero errors

---

## Do NOT do
- Do not build M-Pesa STK push — that is T1.4
- Do not use `find /`

---

## On completion

```powershell
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$raw = [System.IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)
$d = $raw | ConvertFrom-Json
$d.tasks.'T1.3'.status = "complete"
$d.tasks.'T1.3'.notes = "T1.3 COMPLETE: 5 API endpoints, invoice list+create+detail+PDF share, offline queue auto-sync on reconnect. Full flow tested. tsc clean on both workspaces."
$d.current_task = "T1.4"
[System.IO.File]::WriteAllText($p, ($d | ConvertTo-Json -Depth 10), [System.Text.Encoding]::UTF8)
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git add -A && git commit -m 'T1.3d: Offline queue sync + T1.3 complete'"
Write-Host "T1.3d COMPLETE — T1.3 DONE"
```
