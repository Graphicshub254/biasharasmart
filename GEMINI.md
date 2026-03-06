# GEMINI.md — Task Brief: T3.1
## Task: Micro-Payroll — employee management, daily wages, SHIF/NSSF statutory deductions, B2C disbursement

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
wsl -d Ubuntu -- bash -c "python3 -c \"import json,pathlib; d=json.loads(pathlib.Path('/home/bishop/projects/biasharasmart/progress.txt').read_text(encoding='utf-8-sig')); print('Phase:', d.get('current_phase'), 'Task:', d['current_task'])\""
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -5"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/mobile tsc --noEmit 2>&1 | tail -5"
```

## DB migration — run first

Write to /tmp/payroll_migration.sql then execute:

```sql
-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  id_number VARCHAR(20) UNIQUE,
  daily_rate_kes NUMERIC(10,2) NOT NULL DEFAULT 0,
  employment_type VARCHAR(20) DEFAULT 'casual', -- casual | permanent
  nssf_number VARCHAR(20),
  nhif_number VARCHAR(20),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll runs table
CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  run_date DATE NOT NULL,
  days_worked NUMERIC(4,1) NOT NULL DEFAULT 1,
  gross_kes NUMERIC(12,2) NOT NULL,
  shif_deduction_kes NUMERIC(10,2) NOT NULL DEFAULT 0,
  nssf_deduction_kes NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_kes NUMERIC(12,2) NOT NULL,
  mpesa_ref VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending', -- pending | paid | failed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employees_business_id ON employees(business_id);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(active);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_business_id ON payroll_runs(business_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_employee_id ON payroll_runs(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_run_date ON payroll_runs(run_date);
```

Execute:
```powershell
wsl -d Ubuntu -- bash -c "psql postgresql://biasharasmart:devpass@localhost:5432/biasharasmart_dev -c '\pset pager off' -f /tmp/payroll_migration.sql"
```

## Statutory deduction constants

Add to shared-types/src/index.ts:

```typescript
// ─── Payroll Constants (2026) ─────────────────────────────────────────────────
export const SHIF_RATE = 0.0275;           // 2.75% Social Health Insurance Fund
export const NSSF_TIER_1_MAX = 6000;       // NSSF Tier 1 ceiling
export const NSSF_TIER_2_MAX = 18000;      // NSSF Tier 2 ceiling
export const NSSF_TIER_1_RATE = 0.06;      // 6% on first KES 6,000
export const NSSF_TIER_2_RATE = 0.06;      // 6% on KES 6,001–18,000
```

## Deduction calculation

```typescript
function calculateDeductions(grossKes: number): {
  shifDeduction: number;
  nssfDeduction: number;
  netKes: number;
} {
  // SHIF: 2.75% of gross
  const shifDeduction = +(grossKes * SHIF_RATE).toFixed(2);

  // NSSF Year 4 (2026): Tier 1 + Tier 2
  let nssfDeduction = 0;
  if (grossKes <= NSSF_TIER_1_MAX) {
    nssfDeduction = +(grossKes * NSSF_TIER_1_RATE).toFixed(2);
  } else if (grossKes <= NSSF_TIER_2_MAX) {
    nssfDeduction = +(NSSF_TIER_1_MAX * NSSF_TIER_1_RATE + (grossKes - NSSF_TIER_1_MAX) * NSSF_TIER_2_RATE).toFixed(2);
  } else {
    nssfDeduction = +(NSSF_TIER_1_MAX * NSSF_TIER_1_RATE + (NSSF_TIER_2_MAX - NSSF_TIER_1_MAX) * NSSF_TIER_2_RATE).toFixed(2);
  }

  const netKes = +(grossKes - shifDeduction - nssfDeduction).toFixed(2);
  return { shifDeduction, nssfDeduction, netKes };
}
```

## What to build

| File | What |
|---|---|
| `apps/api/src/payroll/payroll.module.ts` | Payroll module |
| `apps/api/src/payroll/payroll.controller.ts` | Endpoints |
| `apps/api/src/payroll/payroll.service.ts` | Employee management + payroll calculation + B2C stub |
| `apps/api/src/payroll/dto/payroll.dto.ts` | DTOs |
| `apps/api/src/entities/employee.entity.ts` | Employee entity |
| `apps/api/src/entities/payroll-run.entity.ts` | PayrollRun entity |
| `apps/mobile/app/payroll/index.tsx` | Employee list screen |
| `apps/mobile/app/payroll/add-employee.tsx` | Add employee form |
| `apps/mobile/app/payroll/run.tsx` | Run payroll screen |
| `apps/mobile/app/payroll/_layout.tsx` | Stack layout |

## API endpoints

- GET /api/payroll/:businessId/employees — list active employees
- POST /api/payroll/:businessId/employees — add employee
- DELETE /api/payroll/:businessId/employees/:id — deactivate employee
- POST /api/payroll/:businessId/run — run payroll for date
- GET /api/payroll/:businessId/history — payroll run history

## Run payroll endpoint

```typescript
async runPayroll(businessId: string, dto: RunPayrollDto) {
  // dto: { date: string, entries: [{ employeeId, daysWorked }] }
  const results = [];

  for (const entry of dto.entries) {
    const employee = await this.employeeRepo.findOne({
      where: { id: entry.employeeId, businessId, active: true },
    });
    if (!employee) continue;

    const grossKes = +(employee.dailyRateKes * entry.daysWorked).toFixed(2);
    const { shifDeduction, nssfDeduction, netKes } = calculateDeductions(grossKes);

    // B2C stub (sandbox) — real Co-op Bank B2C in T4.x
    const mpesaRef = `B2C_${Date.now()}_${employee.id.slice(-6)}`;

    const run = await this.payrollRunRepo.save(
      this.payrollRunRepo.create({
        businessId,
        employeeId: employee.id,
        runDate: new Date(dto.date),
        daysWorked: entry.daysWorked,
        grossKes,
        shifDeductionKes: shifDeduction,
        nssfDeductionKes: nssfDeduction,
        netKes,
        mpesaRef,
        status: 'paid', // sandbox: always success
      })
    );

    // Write ledger entry
    await this.ledgerRepo.save({
      businessId,
      entryType: EntryType.PAYROLL,
      amountKes: netKes,
      referenceId: run.id,
      checksum: `payroll_${mpesaRef}_${Date.now()}`,
      metadata: {
        employeeName: employee.fullName,
        gross: grossKes,
        shif: shifDeduction,
        nssf: nssfDeduction,
        net: netKes,
      },
    });

    results.push({ employee: employee.fullName, grossKes, shifDeduction, nssfDeduction, netKes, mpesaRef });
  }

  return { date: dto.date, results, totalNet: results.reduce((s, r) => s + r.netKes, 0) };
}
```

## Mobile payroll screens

### app/payroll/index.tsx
- Header "Payroll"
- Employee list — each row shows name, phone, daily rate, "Pay Today" quick button
- FAB: "Add Employee" → /payroll/add-employee
- "Run Payroll" button → /payroll/run
- Empty state: "No employees yet"

### app/payroll/add-employee.tsx
- Full Name input
- Phone input (254XXXXXXXXX)
- ID Number input
- Daily Rate KES input (numeric)
- Employment Type toggle: Casual | Permanent
- "Save Employee" → POST /api/payroll/:businessId/employees

### app/payroll/run.tsx
- Date picker (default today)
- Employee checklist with days-worked input per employee
- Deduction preview: for each employee show Gross, SHIF, NSSF, Net
- Total summary at bottom
- "Pay All" → POST /api/payroll/:businessId/run
- Success: show receipt with all employee payments

## Wire into More tab

Add to more.tsx:
```typescript
{ label: 'Payroll', icon: 'people', route: '/payroll' }
```

## Build and test

```powershell
# Add employee
wsl -d Ubuntu -- bash -c "python3 -c \"import json; open('/tmp/emp.json','w').write(json.dumps({'fullName':'John Kamau','phone':'254712345678','dailyRateKes':1500,'employmentType':'casual'}))\""
wsl -d Ubuntu -- bash -c "curl -s -X POST http://localhost:3000/api/payroll/7951dda8-a30e-4928-8350-b6c5662154a8/employees -H 'Content-Type: application/json' -d @/tmp/emp.json | python3 -m json.tool"

# Run payroll (get employee ID from above)
wsl -d Ubuntu -- bash -c "python3 -c \"import json; open('/tmp/payroll.json','w').write(json.dumps({'date':'2026-03-06','entries':[{'employeeId':'REPLACE_ID','daysWorked':1}]}))\""
wsl -d Ubuntu -- bash -c "curl -s -X POST http://localhost:3000/api/payroll/7951dda8-a30e-4928-8350-b6c5662154a8/run -H 'Content-Type: application/json' -d @/tmp/payroll.json | python3 -m json.tool"
```

Expected: gross=1500, shif=41.25 (2.75%), nssf=90 (6% of 1500), net=1368.75

## Exit criteria
- [x] employees + payroll_runs tables created
- [x] GET/POST /api/payroll/:businessId/employees works
- [x] POST /api/payroll/:businessId/run calculates SHIF + NSSF correctly
- [x] Ledger entry written for each payroll disbursement
- [x] Employee list + add form + run payroll screens built
- [x] More tab has Payroll link
- [x] API build + mobile tsc: zero errors

## On completion

```powershell
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$raw = [System.IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)
$d = $raw | ConvertFrom-Json
$d.tasks.'T3.1'.status = "complete"
$d.tasks.'T3.1'.notes = "T3.1 COMPLETE: Micro-payroll. Employee management, SHIF 2.75% + NSSF Year 4 deductions, B2C stub, ledger entry. Employee list + add + run payroll screens. More tab wired."
$d.current_task = "T3.2"
[System.IO.File]::WriteAllText($p, ($d | ConvertTo-Json -Depth 10), [System.Text.Encoding]::UTF8)
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git add -A && git --no-pager commit -m 'T3.1: Micro-payroll — SHIF/NSSF deductions + B2C stub + payroll screens'"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git push origin main"
Write-Host "T3.1 COMPLETE"
```
