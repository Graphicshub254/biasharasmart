# GEMINI.md — Task Brief for Session S[XX]
## Task: T[X.Y] — [Task Name]

## Environment rules
- You run on Windows PowerShell
- All Linux commands: wsl -d Ubuntu -- cmd
- All Python tools: ~/.local/bin/tool
- Project WSL path: /home/bishop/projects/biasharasmart
- Write files via Set-Content to \\wsl$\Ubuntu\home\bishop\projects\biasharasmart\file
- Never use bare pip install — always pipx
- Never use --break-system-packages

## Read first
Get-Content "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"

## MCP resources to query before writing any code
prd://features/T[X.Y]
progress://current
filesystem://apps/...
@search [API name] 2025

## Pre-checks
wsl -d Ubuntu -- bash -c "test -f /home/bishop/projects/biasharasmart/[file] && echo OK || echo MISSING"
If MISSING: stop, do not proceed.

### Schema validation pre-check (run before any DB-touching task)
```powershell
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && yarn workspace @biasharasmart/api typeorm schema:log 2>&1 | grep -E 'missing|would|alter' | head -20 || echo 'Schema in sync'"
```
If output shows missing columns or ALTER statements: fix the schema before proceeding.

## What to build
[Exact description of what this session produces]

### Step 1 — [name]
[exact powershell command]
Expected: [success output]

### Step N — Verify exit criteria
[one verification command per criterion]

## Exit criteria — ALL must pass
- [ ] [specific testable binary criterion]
- [ ] [specific testable binary criterion]

## Do NOT do
- [wrong approach 1]
- [wrong approach 2]
- Do not modify any task in progress.txt other than T[X.Y]

## Known Pitfalls
1. **Pager trap (most common)**
   Symptom: Shell shows `:` and hangs waiting for input.
   Fix: Always add these flags:
   `git --no-pager <command>`
   `psql ... -c '\pset pager off' -c '<query>'`

2. **Quote hell in PowerShell → WSL → Bash → Python**
   Symptom: Unexpected EOF, syntax errors, missing expressions.
   Fix: Never inline JSON. Always use python3 to write payload files:
   `powershell wsl -d Ubuntu -- bash -c "python3 -c \"import json; open('/tmp/req.json','w').write(json.dumps({'key':'value'}))\""`
   `wsl -d Ubuntu -- bash -c "curl -s -X POST http://localhost:3000/api/endpoint -H 'Content-Type: application/json' -d @/tmp/req.json | python3 -m json.tool"`

3. **Heredoc mangling TypeScript template literals**
   Symptom: `${variable}` gets swallowed, backticks break.
   Fix: Never use heredoc for TypeScript/SQL. Use `write_file` tool only.

4. **API not ready before curl tests**
   Symptom: Connection refused, empty response, exit code 1.
   Fix: Poll the log instead of sleeping blindly:
   ```powershell
   Start-Job -ScriptBlock { wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api start:dev 2>&1 | tee /tmp/api.log" }
   for ($i = 0; $i -lt 12; $i++) {
       Start-Sleep -Seconds 5
       $ready = wsl -d Ubuntu -- bash -c "grep -c 'Nest application successfully started' /tmp/api.log 2>/dev/null || echo 0"
       if ($ready -gt 0) { Write-Host "API READY"; break }
       Write-Host "Waiting... ($($($i+1)*5)s)"
   }
   ```

5. **yarn not found**
   Symptom: `yarn: command not found`
   Fix: Always use absolute path:
   `/home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build`

6. **wsl command not found (running inside WSL already)**
   Symptom: `Command 'wsl' not found`
   Fix: When already in WSL terminal, run Linux commands directly without `wsl -d Ubuntu --` prefix.

7. **git diff opens pager mid-session**
   Symptom: Diff shown with `:` prompt, Gemini waits forever.
   Fix: Never use bare `git diff`. Always:
   `git --no-pager diff <file>`
   `git --no-pager log --oneline -5`
   `git --no-pager status`

8. **TypeScript errors from entity field name mismatches**
   Symptom: Build fails after adding new code that references entity fields.
   Fix: Always read entity files before writing service code:
   `cat apps/api/src/entities/payment.entity.ts`
   `cat apps/api/src/entities/business.entity.ts`
   Use exact field names — `amountKes` not `amount_kes`, `paymentFlow` not `payment_flow`.

9. **Route order bug in NestJS**
   Symptom: `GET /api/payments/wht-summary/:businessId` returns 404 or wrong response.
   Fix: In NestJS controllers, specific routes MUST come before wildcard routes:
   ```typescript
   @Get('wht-summary/:businessId')  // ← FIRST
   getWhtSummary() {}

   @Get(':businessId')               // ← SECOND
   listPayments() {}
   ```

10. **progress.txt BOM encoding**
    Symptom: `json.JSONDecodeError` when reading `progress.txt`.
    Fix: Always read with BOM handling:
    `data = json.loads(pathlib.Path('progress.txt').read_text(encoding='utf-8-sig'))`
    Always write with UTF-8 (no BOM):
    `p.write_text(json.dumps(data, indent=2), encoding='utf-8')`

## On completion
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$d = Get-Content $p -Raw | ConvertFrom-Json
$d.tasks.'T[X.Y]'.status = "complete"
$d.tasks.'T[X.Y]'.notes = "[what was built]"
$d.current_task = "T[next]"
$d | ConvertTo-Json -Depth 10 | Set-Content $p -Encoding UTF8

Print: T[X.Y] COMPLETE
