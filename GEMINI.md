# GEMINI.md — Task Brief: T1.5
## Task: TCC status screen — StatusBadge, countdown ring, daily GavaConnect check, expiry alerts

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
# 1. T1.4 complete
wsl -d Ubuntu -- bash -c "python3 -c \"import json,pathlib; d=json.loads(pathlib.Path('/home/bishop/projects/biasharasmart/progress.txt').read_text(encoding='utf-8-sig')); print(d['tasks']['T1.4']['status'])\""
```

```powershell
# 2. Read components
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/mobile/src/components/ProgressRing/ProgressRing.tsx"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/mobile/src/components/StatusBadge/StatusBadge.tsx"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/api/src/onboarding/gavaconnect.service.ts"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/packages/shared-types/src/index.ts | grep -A 10 'TccStatus'"
```

```powershell
# 3. Both builds clean
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -5"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/mobile tsc --noEmit 2>&1 | tail -5"
```

---

## What to build

| File | What |
|---|---|
| `apps/api/src/tcc/tcc.module.ts` | TCC NestJS module |
| `apps/api/src/tcc/tcc.controller.ts` | `GET /api/tcc/:businessId` |
| `apps/api/src/tcc/tcc.service.ts` | GavaConnect TCC check + caching |
| `apps/mobile/app/tcc/index.tsx` | TCC status screen |
| `apps/mobile/app/tcc/_layout.tsx` | Stack layout |

---

## Part 1 — TCC API

**`apps/api/src/tcc/tcc.service.ts`**

```typescript
// In-memory cache: avoid hammering GavaConnect on every request
// Cache result for 1 hour per business
private cache = new Map<string, { data: TccStatus; cachedAt: Date }>();

async getTccStatus(businessId: string): Promise<TccStatus> {
  const cached = this.cache.get(businessId);
  if (cached) {
    const ageMinutes = (Date.now() - cached.cachedAt.getTime()) / 60000;
    if (ageMinutes < 60) return cached.data;
  }

  const business = await this.businessRepository.findOne({ where: { id: businessId } });
  if (!business) throw new NotFoundException('Business not found');

  const result = await this.gavaConnectService.checkTcc(business.kraPin);

  // Calculate daysRemaining from expiryDate
  const expiry = new Date(result.expiryDate);
  const now = new Date();
  const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const tccStatus: TccStatus = {
    status: result.status,
    expiryDate: result.expiryDate,
    daysRemaining: Math.max(0, daysRemaining),
  };

  this.cache.set(businessId, { data: tccStatus, cachedAt: new Date() });
  return tccStatus;
}
```

**Controller:**
```typescript
@Get(':businessId')
getTcc(@Param('businessId') businessId: string) {
  return this.tccService.getTccStatus(businessId);
}
```

Import `GavaConnectService` from `OnboardingModule` (same pattern as InvoicesModule).

---

## Part 2 — TCC screen

File: `apps/mobile/app/tcc/index.tsx`

**Design spec:**
- Background: `colors.ink`
- Back chevron top-left
- Header: "Tax Compliance Certificate"

**Main content (centered):**
- `ProgressRing` component — read its props carefully before using
  - Progress: `daysRemaining / 365` (capped 0–1)
  - Color based on status: compliant=`colors.mint`, warning=`colors.gold`, lapsed=`colors.red`
  - Center text: days remaining as large number + "days" label below
- StatusBadge below ring:
  - compliant → status="compliant" label="TCC Valid"
  - warning → status="warning" label="Expiring Soon"
  - lapsed → status="lapsed" label="TCC Lapsed"
- Expiry date: "Expires DD MMM YYYY" in `colors.greyMid`

**Info cards below (SectionCard):**
- "What is TCC?" section (expandable=true, defaultExpanded=false):
  - Text: "A Tax Compliance Certificate (TCC) confirms your business is up to date with KRA obligations. It is required for government tenders and certain business transactions."
- "What to do if lapsed" section (expandable=true, defaultExpanded=false):
  - Text: "Visit KRA iTax portal at itax.kra.go.ke to file any outstanding returns and apply for a new TCC."

**Action button:**
- If lapsed: "Apply for TCC" → `Linking.openURL('https://itax.kra.go.ke')`
- If warning: "Renew TCC" → `Linking.openURL('https://itax.kra.go.ke')`
- If compliant: no button

**Data fetching:**
```typescript
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8'; // temp until T1.6

useEffect(() => {
  const fetch_tcc = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tcc/${BUSINESS_ID}`);
      const data = await res.json();
      setTcc(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };
  fetch_tcc();
}, []);
```

**Loading state:** SkeletonLoader variant="card" count={2}

**Wire into More tab:**
Read current `more.tsx`:
```powershell
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/mobile/app/\(tabs\)/more.tsx"
```

Replace more.tsx placeholder with a simple menu list:
```typescript
// More screen — menu items
const MENU_ITEMS = [
  { label: 'TCC Status', icon: 'verified', route: '/tcc' },
  { label: 'VAT Returns', icon: 'receipt-long', route: '/vat' },  // placeholder, T2.1
  { label: 'Business Profile', icon: 'business', route: '/profile' }, // placeholder
];
```

Each item: TouchableOpacity row, icon + label, chevron-right, `colors.greyDark` background.

---

## Part 3 — Build + test

```powershell
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -5"

wsl -d Ubuntu -- bash -c "curl -s http://localhost:3000/api/tcc/7951dda8-a30e-4928-8350-b6c5662154a8 | python3 -m json.tool"
```

Expected:
```json
{
  "status": "compliant",
  "expiryDate": "...",
  "daysRemaining": 91
}
```

```powershell
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/mobile tsc --noEmit 2>&1 | tail -5"
```

---

## Exit criteria

- [ ] `GET /api/tcc/:businessId` returns `{ status, expiryDate, daysRemaining }`
- [ ] TCC status cached for 1 hour in memory
- [ ] `app/tcc/index.tsx` shows ProgressRing with correct color per status
- [ ] StatusBadge shown correctly for all 3 statuses
- [ ] Expiry date formatted correctly
- [ ] Lapsed/warning state shows action button linking to iTax
- [ ] More tab replaced with menu list including TCC option
- [ ] API build: zero errors
- [ ] Mobile tsc: zero errors

---

## Do NOT do
- Do not build admin console — that is T1.6 (Claude's task)
- Do not use `find /`
- Do not call GavaConnect on every request — use the 1-hour cache

---

## On completion

```powershell
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$raw = [System.IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)
$d = $raw | ConvertFrom-Json
$d.tasks.'T1.5'.status = "complete"
$d.tasks.'T1.5'.notes = "T1.5 COMPLETE: TCC status screen with ProgressRing, StatusBadge, 1hr cached GavaConnect check, iTax deeplink. More tab menu built. tsc clean."
$d.current_task = "T1.6"
[System.IO.File]::WriteAllText($p, ($d | ConvertTo-Json -Depth 10), [System.Text.Encoding]::UTF8)
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git add -A && git commit -m 'T1.5: TCC status screen + ProgressRing + More tab menu'"
Write-Host "T1.5 COMPLETE"
```
