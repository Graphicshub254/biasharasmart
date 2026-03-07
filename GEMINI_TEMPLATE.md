# GEMINI.md — Task Brief for Session S[XX]
## Task: T[X.Y] — [Task Name]

## Environment rules
- You run on Windows PowerShell
- All Linux commands: wsl -d Ubuntu -- cmd
- Yarn: /home/bishop/.npm-global/bin/yarn
- Project WSL path: /home/bishop/projects/biasharasmart
- Write files via write_file tool only — never heredoc
- JSON payloads: write to /tmp/file.json via python3, then curl -d @/tmp/file.json
- git --no-pager always
- \pset pager off for all psql commands
- Never use pip/pipx directly — use yarn for JS deps

## ─── SESSION CHECKPOINT SYSTEM ────────────────────────────────────────────
## CRITICAL: After completing EACH step, immediately write a checkpoint.
## This lets us recover exactly where you stopped if the window reloads or crashes.
##
## Write checkpoint after EVERY major step using this command:
##
## powershell:
## $p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
## $raw = [System.IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)
## $d = $raw | ConvertFrom-Json
## $d.tasks.'T[X.Y]'.checkpoint = "STEP_N_COMPLETE: [what was just done] at $(Get-Date -Format 'HH:mm')"
## [System.IO.File]::WriteAllText($p, ($d | ConvertTo-Json -Depth 10), [System.Text.Encoding]::UTF8)
##
## Example checkpoints to write:
## "STEP_1_COMPLETE: DB migration ran, wht_liabilities table created at 02:14"
## "STEP_2_COMPLETE: payment.entity.ts updated with 5 new columns at 02:19"
## "STEP_3_COMPLETE: payments.service.ts created 312 lines at 02:31"
## "STEP_4_COMPLETE: API build clean at 02:38"
## "STEP_5_COMPLETE: Mobile screens created, tsc clean at 02:47"
##
## On session START, always read the last checkpoint first:
## wsl -d Ubuntu -- bash -c "python3 -c \"import json,pathlib; d=json.loads(pathlib.Path('/home/bishop/projects/biasharasmart/progress.txt').read_text(encoding='utf-8-sig')); print('Last checkpoint:', d['tasks'].get('T[X.Y]', {}).get('checkpoint', 'NONE — starting fresh'))\""
## ─────────────────────────────────────────────────────────────────────────────

## Read first
wsl -d Ubuntu -- bash -c "python3 -c \"import json,pathlib; d=json.loads(pathlib.Path('/home/bishop/projects/biasharasmart/progress.txt').read_text(encoding='utf-8-sig')); print('Current task:', d['current_task']); print('Last checkpoint:', d['tasks'].get('T[X.Y]',{}).get('checkpoint','NONE'))\""

## Pre-checks

```powershell
# 1. Previous task complete
wsl -d Ubuntu -- bash -c "python3 -c \"import json,pathlib; d=json.loads(pathlib.Path('/home/bishop/projects/biasharasmart/progress.txt').read_text(encoding='utf-8-sig')); print(d['tasks']['T[PREV]']['status'])\""
```

```powershell
# 2. Both builds clean before starting
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -5"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/mobile tsc --noEmit 2>&1 | tail -5"
```

```powershell
# 3. Schema validation pre-check (run before any DB-touching task)
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api typeorm schema:log 2>&1 | grep -E 'missing|would|alter' | head -20 || echo 'Schema in sync'"
```

```powershell
# 4. Read relevant entity/component files before writing any code
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/api/src/entities/[relevant].entity.ts"
```

## What to build

[Exact description of what this session produces]

---

## Step 1 — [name]
[exact command]
Expected: [success output]

**→ WRITE CHECKPOINT after this step:**
```powershell
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$raw = [System.IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)
$d = $raw | ConvertFrom-Json
$d.tasks.'T[X.Y]'.checkpoint = "STEP_1_COMPLETE: [what was done] at $(Get-Date -Format 'HH:mm')"
[System.IO.File]::WriteAllText($p, ($d | ConvertTo-Json -Depth 10), [System.Text.Encoding]::UTF8)
```

---

## Step 2 — [name]
[exact command]
Expected: [success output]

**→ WRITE CHECKPOINT after this step:**
```powershell
$d.tasks.'T[X.Y]'.checkpoint = "STEP_2_COMPLETE: [what was done] at $(Get-Date -Format 'HH:mm')"
```

---

## Step N — Verify exit criteria
[one verification command per criterion]

**→ WRITE CHECKPOINT:**
```powershell
$d.tasks.'T[X.Y]'.checkpoint = "ALL_STEPS_COMPLETE: Ready to commit at $(Get-Date -Format 'HH:mm')"
```

---

## Production-Ready Checklist (The "Shift-Left" Guide)
Before marking complete, verify these 5 pillars:
1. **Type Safety:** `yarn workspace @biasharasmart/api build` + `yarn workspace @biasharasmart/mobile tsc --noEmit` — zero errors
2. **Schema Integrity:** Entities match `initial_schema.sql`. New fields added to migrations.
3. **Ledger Fidelity:** Any financial move (VAT, Payment, Invoice) MUST write a ledger entry with valid checksum.
4. **Mobile Sync:** `shared-types` updated if API DTOs change.
5. **Security:** No hardcoded IDs. Use `:businessId` params. Validate ownership in services.

---

## Standardized Endpoint Testing Patterns

### 1. Happy Path
```powershell
wsl -d Ubuntu -- bash -c "curl -s http://localhost:3000/api/[endpoint] | python3 -m json.tool"
```

### 2. Bad Input (Validation — expect 400)
```powershell
wsl -d Ubuntu -- bash -c "python3 -c \"open('/tmp/bad.json','w').write('{\\\"invalid\\\":\\\"data\\\"}')\"" 
wsl -d Ubuntu -- bash -c "curl -s -X POST http://localhost:3000/api/[endpoint] -H 'Content-Type: application/json' -d @/tmp/bad.json | python3 -m json.tool"
```

### 3. Not Found (expect 404)
```powershell
wsl -d Ubuntu -- bash -c "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/[endpoint]/00000000-0000-0000-0000-000000000000"
```

### 4. Pagination
```powershell
wsl -d Ubuntu -- bash -c "curl -s 'http://localhost:3000/api/[endpoint]?page=1&limit=1' | python3 -m json.tool"
```

---

## Exit criteria — ALL must pass
- [ ] [specific testable criterion]
- [ ] [specific testable criterion]
- [ ] API build: zero errors
- [ ] Mobile tsc: zero errors
- [ ] Checkpoint written for every step

---

## Do NOT do
- Do not modify any task in progress.txt other than T[X.Y]
- Do not use heredoc for TypeScript files — write_file tool only
- Do not use bare git diff — always git --no-pager
- Do not use find /
- Do not use bare psql without \pset pager off

---

## Known Pitfalls

1. **Pager trap** — Shell shows `:` and hangs.
   Fix: `git --no-pager <cmd>` | `psql ... -c '\pset pager off'`

2. **Quote hell PowerShell→WSL→Bash→Python**
   Fix: Use `python3 -c "open('/tmp/file.json','w').write(json.dumps({...}))"` — never inline JSON in curl

3. **Heredoc mangling TypeScript**
   Fix: write_file tool only for TypeScript/SQL

4. **API not ready before curl tests**
   Fix: Poll log instead of sleeping:
   ```powershell
   Start-Job -ScriptBlock { wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api start:dev 2>&1 | tee /tmp/api.log" }
   for ($i = 0; $i -lt 12; $i++) {
     Start-Sleep -Seconds 5
     $ready = wsl -d Ubuntu -- bash -c "grep -c 'Nest application successfully started' /tmp/api.log 2>/dev/null || echo 0"
     if ($ready -gt 0) { Write-Host "API READY"; break }
     Write-Host "Waiting... ($($($i+1)*5)s)"
   }
   ```

5. **yarn not found** — Fix: Always use `/home/bishop/.npm-global/bin/yarn`

6. **wsl not found (already in WSL)** — Fix: Run Linux commands directly, no wsl prefix

7. **git diff opens pager** — Fix: Always `git --no-pager diff <file>`

8. **Entity field name mismatches** — Fix: Read entity files before writing service code. Use camelCase TS (`amountKes`), snake_case SQL (`amount_kes`)

9. **NestJS route order bug** — Fix: Specific routes BEFORE wildcard routes in controller
   ```typescript
   @Get('wht-summary/:businessId')  // ← FIRST
   @Get(':businessId')               // ← SECOND
   ```

10. **progress.txt BOM encoding**
    Fix: Read: `encoding='utf-8-sig'` | Write: `encoding='utf-8'`

11. **PowerShell curl alias** — Fix: Wrap in `wsl -d Ubuntu -- bash -c "curl ..."`

12. **Background job connection refused** — Fix: Use polling loop (Pitfall 4), not fixed sleep

13. **WSL path translation** — Fix: write_file creates at `\\wsl$\Ubuntu\...`, curl reads at `/home/bishop/...`

14. **Checkpoint not written on crash** — Fix: Write checkpoint IMMEDIATELY after each step, before moving to next. Do not batch checkpoints.

---

## On completion

```powershell
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$raw = [System.IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)
$d = $raw | ConvertFrom-Json
$d.tasks.'T[X.Y]'.status = "complete"
$d.tasks.'T[X.Y]'.checkpoint = "COMPLETE: All steps done, committed at $(Get-Date -Format 'HH:mm')"
$d.tasks.'T[X.Y]'.notes = "T[X.Y] COMPLETE: [what was built]"
$d.current_task = "T[next]"
[System.IO.File]::WriteAllText($p, ($d | ConvertTo-Json -Depth 10), [System.Text.Encoding]::UTF8)
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git add -A && git --no-pager commit -m 'T[X.Y]: [description]'"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git push origin main"
Write-Host "T[X.Y] COMPLETE"
```