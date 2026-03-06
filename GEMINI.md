# GEMINI.md — Task Brief: Schema Refactor (Pre-T1.4)
## Task: Add WHT dual-architecture columns + wht_liabilities table

---

## Environment rules
- You run on **Windows PowerShell**
- All Linux commands: `wsl -d Ubuntu -- <cmd>`
- Yarn binary: `/home/bishop/.npm-global/bin/yarn`
- Project WSL path: `/home/bishop/projects/biasharasmart`
- Write files via write_file tool only — never heredoc for TypeScript/SQL
- JSON payloads: write to `/tmp/req.json` first, then `curl -d @/tmp/req.json`
- **Never use pip, find /, or interactive shells**
- **Always use `git --no-pager`**

---

## Pre-checks

```powershell
# 1. T1.3 complete
wsl -d Ubuntu -- bash -c "python3 -c \"import json,pathlib; d=json.loads(pathlib.Path('/home/bishop/projects/biasharasmart/progress.txt').read_text(encoding='utf-8-sig')); print(d['tasks']['T1.3']['status'])\""
```
Expected: `complete`

```powershell
# 2. Both builds clean
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -5"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/mobile tsc --noEmit 2>&1 | tail -5"
```

```powershell
# 3. Confirm current DB columns
wsl -d Ubuntu -- bash -c "psql -U postgres -d biasharasmart -c '\d businesses' 2>/dev/null || psql biasharasmart -c '\d businesses'"
wsl -d Ubuntu -- bash -c "psql -U postgres -d biasharasmart -c '\d payments' 2>/dev/null || psql biasharasmart -c '\d payments'"
```

```powershell
# 4. Read current entities
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/api/src/entities/business.entity.ts"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/api/src/entities/payment.entity.ts"
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/packages/shared-types/src/index.ts"
```

---

## What this brief does

Adds the WHT dual-architecture foundation to the DB and entities before T1.4 payment code is written:

| Change | Why |
|---|---|
| `payment_mode` on businesses | Track legacy Till vs Gateway flow |
| `bia_score` on businesses | Biashara Score credit engine seed |
| `wht_amount_kes` on payments | Store calculated 5% WHT per payment |
| `wht_status` on payments | pending / escrowed / remitted |
| `payment_flow` on payments | legacy / gateway |
| `mpesa_code` on payments | M-Pesa receipt number from webhook |
| `escrow_ref` on payments | Co-op escrow reference (gateway only) |
| New table: `wht_liabilities` | Tracks outstanding WHT for legacy merchants |
| WHT constants in shared-types | Single source of truth for 5% rate |

---

## Step 1 — Run DB migration

Write this SQL to `/tmp/wht_migration.sql` first, then execute it:

```sql
-- Migration: WHT dual-architecture
-- Safe to run multiple times (uses IF NOT EXISTS / DO blocks)

-- 1. Add payment_mode to businesses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='businesses' AND column_name='payment_mode'
  ) THEN
    ALTER TABLE businesses ADD COLUMN payment_mode VARCHAR(20) DEFAULT 'legacy';
  END IF;
END $$;

-- 2. Add bia_score to businesses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='businesses' AND column_name='bia_score'
  ) THEN
    ALTER TABLE businesses ADD COLUMN bia_score INTEGER DEFAULT 0;
  END IF;
END $$;

-- 3. Add co_op_virtual_account to businesses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='businesses' AND column_name='co_op_virtual_account'
  ) THEN
    ALTER TABLE businesses ADD COLUMN co_op_virtual_account VARCHAR(100);
  END IF;
END $$;

-- 4. Add wht_amount_kes to payments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='payments' AND column_name='wht_amount_kes'
  ) THEN
    ALTER TABLE payments ADD COLUMN wht_amount_kes NUMERIC(15,2) DEFAULT 0;
  END IF;
END $$;

-- 5. Add wht_status to payments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='payments' AND column_name='wht_status'
  ) THEN
    ALTER TABLE payments ADD COLUMN wht_status VARCHAR(20) DEFAULT 'pending';
  END IF;
END $$;

-- 6. Add payment_flow to payments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='payments' AND column_name='payment_flow'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_flow VARCHAR(20) DEFAULT 'legacy';
  END IF;
END $$;

-- 7. Add mpesa_code to payments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='payments' AND column_name='mpesa_code'
  ) THEN
    ALTER TABLE payments ADD COLUMN mpesa_code VARCHAR(50);
  END IF;
END $$;

-- 8. Add escrow_ref to payments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='payments' AND column_name='escrow_ref'
  ) THEN
    ALTER TABLE payments ADD COLUMN escrow_ref VARCHAR(100);
  END IF;
END $$;

-- 9. Create wht_liabilities table
CREATE TABLE IF NOT EXISTS wht_liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  payment_id UUID REFERENCES payments(id),
  amount_kes NUMERIC(15,2) NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Indexes
CREATE INDEX IF NOT EXISTS idx_wht_liabilities_business_id ON wht_liabilities(business_id);
CREATE INDEX IF NOT EXISTS idx_wht_liabilities_status ON wht_liabilities(status);
CREATE INDEX IF NOT EXISTS idx_wht_liabilities_due_date ON wht_liabilities(due_date);
CREATE INDEX IF NOT EXISTS idx_businesses_payment_mode ON businesses(payment_mode);
CREATE INDEX IF NOT EXISTS idx_payments_wht_status ON payments(wht_status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_flow ON payments(payment_flow);
```

Execute:
```powershell
wsl -d Ubuntu -- bash -c "psql -U postgres -d biasharasmart -f /tmp/wht_migration.sql 2>/dev/null || psql biasharasmart -f /tmp/wht_migration.sql"
```

Verify:
```powershell
wsl -d Ubuntu -- bash -c "psql -U postgres -d biasharasmart -c '\d businesses' 2>/dev/null || psql biasharasmart -c '\d businesses'"
wsl -d Ubuntu -- bash -c "psql -U postgres -d biasharasmart -c '\d payments' 2>/dev/null || psql biasharasmart -c '\d payments'"
wsl -d Ubuntu -- bash -c "psql -U postgres -d biasharasmart -c '\d wht_liabilities' 2>/dev/null || psql biasharasmart -c '\d wht_liabilities'"
```

---

## Step 2 — Update Business entity

File: `apps/api/src/entities/business.entity.ts`

Add these columns after `kycStatus`:

```typescript
@Column({ name: 'payment_mode', length: 20, default: 'legacy' })
paymentMode!: string; // 'legacy' | 'gateway'

@Column({ name: 'bia_score', type: 'int', default: 0 })
biaScore!: number;

@Column({ name: 'co_op_virtual_account', length: 100, nullable: true })
coOpVirtualAccount?: string;
```

---

## Step 3 — Update Payment entity

File: `apps/api/src/entities/payment.entity.ts`

Add these columns after `resolvedAt`:

```typescript
@Column({ name: 'wht_amount_kes', type: 'numeric', precision: 15, scale: 2, default: 0 })
whtAmountKes!: number;

@Column({ name: 'wht_status', length: 20, default: 'pending' })
whtStatus!: string; // 'pending' | 'escrowed' | 'remitted'

@Column({ name: 'payment_flow', length: 20, default: 'legacy' })
paymentFlow!: string; // 'legacy' | 'gateway'

@Column({ name: 'mpesa_code', length: 50, nullable: true })
mpesaCode?: string;

@Column({ name: 'escrow_ref', length: 100, nullable: true })
escrowRef?: string;
```

---

## Step 4 — Create WhtLiability entity

File: `apps/api/src/entities/wht-liability.entity.ts`

```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Business } from './business.entity';
import { Payment } from './payment.entity';

export enum WhtLiabilityStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Entity('wht_liabilities')
export class WhtLiability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'payment_id', nullable: true })
  paymentId?: string;

  @ManyToOne(() => Payment)
  @JoinColumn({ name: 'payment_id' })
  payment?: Payment;

  @Column({ name: 'amount_kes', type: 'numeric', precision: 15, scale: 2 })
  amountKes!: number;

  @Column({ name: 'due_date', type: 'timestamptz' })
  dueDate!: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: WhtLiabilityStatus.PENDING,
  })
  status!: WhtLiabilityStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
```

---

## Step 5 — Register WhtLiability in app.module.ts

Read app.module.ts first:
```powershell
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/api/src/app.module.ts"
```

Add `WhtLiability` to the `entities` array in the TypeORM config. Do not remove any existing entities.

---

## Step 6 — Update shared-types with WHT constants

Read current shared-types:
```powershell
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/packages/shared-types/src/index.ts"
```

Add at the top of the file after imports:

```typescript
// ─── WHT Constants ───────────────────────────────────────────────────────────
export const WHT_RATE = 0.05;              // 5% Withholding Tax rate
export const WHT_REMITTANCE_DAYS = 5;      // 5-day rolling window for KRA remittance
export const VAT_RATE_STANDARD = 0.16;     // 16% standard VAT
export const VAT_RATE_ZERO = 0;            // Zero-rated VAT

// ─── Payment flow types ───────────────────────────────────────────────────────
export type PaymentMode = 'legacy' | 'gateway';
export type WhtStatus = 'pending' | 'escrowed' | 'remitted';
export type PaymentFlow = 'legacy' | 'gateway';

// ─── WHT Liability ────────────────────────────────────────────────────────────
export interface WhtLiability {
  id: string;
  businessId: string;
  paymentId?: string;
  amountKes: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  createdAt: string;
  updatedAt: string;
}

// ─── WHT Dashboard summary ────────────────────────────────────────────────────
export interface WhtSummary {
  totalPending: number;      // total KES owed to KRA
  overdueCount: number;      // count of overdue liabilities
  nextDueDate: string | null; // earliest due date
  paymentMode: PaymentMode;  // current business payment mode
}
```

Also rebuild shared-types:
```powershell
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/shared-types build 2>&1 | tail -5"
```

---

## Step 7 — Update initial_schema.sql

Append the migration SQL to `apps/api/src/migrations/initial_schema.sql` so it stays as source of truth. Read the file first, then append — do not overwrite the existing content.

---

## Step 8 — Build and verify

```powershell
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -10"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/mobile tsc --noEmit 2>&1 | tail -5"
```

Verify new columns in DB:
```powershell
wsl -d Ubuntu -- bash -c "psql -U postgres -d biasharasmart -c 'SELECT payment_mode, bia_score FROM businesses LIMIT 2;' 2>/dev/null || psql biasharasmart -c 'SELECT payment_mode, bia_score FROM businesses LIMIT 2;'"
wsl -d Ubuntu -- bash -c "psql -U postgres -d biasharasmart -c 'SELECT COUNT(*) FROM wht_liabilities;' 2>/dev/null || psql biasharasmart -c 'SELECT COUNT(*) FROM wht_liabilities;'"
```

---

## Exit criteria — ALL must pass

- [ ] `businesses` table has `payment_mode`, `bia_score`, `co_op_virtual_account` columns
- [ ] `payments` table has `wht_amount_kes`, `wht_status`, `payment_flow`, `mpesa_code`, `escrow_ref` columns
- [ ] `wht_liabilities` table exists with all columns and indexes
- [ ] `wht-liability.entity.ts` created
- [ ] `Business` entity updated with 3 new columns
- [ ] `Payment` entity updated with 5 new columns
- [ ] `WhtLiability` registered in app.module.ts
- [ ] `shared-types` has WHT constants and WhtLiability interface
- [ ] `shared-types` build: zero errors
- [ ] `api` build: zero errors
- [ ] `mobile` tsc: zero errors
- [ ] `initial_schema.sql` updated with migration SQL

---

## Do NOT do
- Do not build any payment screens — that is T1.4
- Do not use synchronize: true on TypeORM
- Do not use find /
- Do not use heredoc for file writes — use write_file tool

---

## On completion

```powershell
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$raw = [System.IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)
$d = $raw | ConvertFrom-Json
$d.tasks.'T1.4'.notes = "Pre-T1.4 schema refactor complete: wht_liabilities table, payment_mode+bia_score on businesses, wht_amount_kes+wht_status+payment_flow on payments. WHT constants in shared-types. All 3 workspaces build clean."
[System.IO.File]::WriteAllText($p, ($d | ConvertTo-Json -Depth 10), [System.Text.Encoding]::UTF8)
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git add -A && git --no-pager commit -m 'Schema refactor: WHT dual-architecture foundation (wht_liabilities, payment_mode, bia_score)'"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git push origin main"
Write-Host "SCHEMA REFACTOR COMPLETE — READY FOR T1.4"
```