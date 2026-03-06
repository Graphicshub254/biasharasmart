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

## Production-Ready Checklist (The "Shift-Left" Guide)
Before marking a task as complete, verify these 5 pillars:
1. **Type Safety:** Run `yarn workspace @biasharasmart/api build` and `yarn workspace @biasharasmart/mobile tsc`. Zero errors allowed.
2. **Schema Integrity:** Ensure entities match `initial_schema.sql`. New fields MUST be added to migrations.
3. **Ledger Fidelity:** Any financial move (VAT, Payment, Invoice) MUST write a ledger entry with a valid checksum.
4. **Mobile Sync:** Ensure `shared-types` are updated if API DTOs change. Run `setup_tokens.js` if UI tokens change.
5. **Security:** No hardcoded IDs. Use `:businessId` or `:id` params. Validate ownership in services.

## Standardized Endpoint Testing Patterns
Use these patterns to ensure 100% coverage and faster debugging.

### 1. The "Happy Path" (Success)
```powershell
wsl -d Ubuntu -- bash -c "curl -s -X GET http://localhost:3000/api/[endpoint] | python3 -m json.tool"
# Look for: 200/201 status, expected JSON structure, non-null IDs.
```

### 2. The "Bad Input" (Validation)
```powershell
# Create invalid payload
wsl -d Ubuntu -- bash -c "echo '{\"invalid_field\": \"data\"}' > /tmp/bad_payload.json"
wsl -d Ubuntu -- bash -c "curl -s -X POST http://localhost:3000/api/[endpoint] -H 'Content-Type: application/json' -d @/tmp/bad_payload.json | python3 -m json.tool"
# Look for: 400 Bad Request, descriptive validation messages.
```

### 3. The "Not Found" (Edge Case)
```powershell
wsl -d Ubuntu -- bash -c "curl -s -i http://localhost:3000/api/[endpoint]/non-existent-uuid"
# Look for: 404 Not Found in the headers (-i flag).
```

### 4. The "Pagination" (Consistency)
```powershell
wsl -d Ubuntu -- bash -c "curl -s 'http://localhost:3000/api/[endpoint]?page=1&limit=1' | python3 -m json.tool"
# Look for: { data: [...], total: X, page: 1, limit: 1 } structure.
```

## How to Help Others (Peer Review Guide)
If reviewing or assisting a teammate:
- **Check Entity Mappings:** Did they use `@Column({ type: 'decimal', precision: 12, scale: 2 })` for KES amounts? (Crucial for precision).
- **Check DTO Validation:** Are `@IsUUID()`, `@IsNumber()`, `@IsEnum()` decorators present?
- **Check Mobile Error Handling:** Does the screen show an `Alert.alert` or just log to console? (Must show UI feedback).
- **Check naming:** Use `CamelCase` for TS/JS, `snake_case` for SQL/JSON.

## Fast Production Shortcuts
- **Skip the Sleep:** Use Pitfall #4's polling loop instead of waiting 30s.
- **Parallel Builds:** Run `yarn build` in API while you work on Mobile.
- **Payload Reuse:** Keep a `test/payloads/` folder for common JSON bodies.
- **Alias it:** Add `alias bs-api='yarn workspace @biasharasmart/api'` to your WSL `.bashrc`.

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
   Fix: Never try to build complex JSON strings inside `wsl -d Ubuntu -- bash -c`. If a 1-liner fails, use the `write_file` tool to create a temporary `.json` file in the project root (e.g., `test_payload.json`), then use it in curl:
   `wsl -d Ubuntu -- bash -c "/usr/bin/curl -s -X POST http://localhost:3000/api/endpoint -H 'Content-Type: application/json' -d @/home/bishop/projects/biasharasmart/test_payload.json | python3 -m json.tool"`

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

11. **PowerShell `curl` Alias (The "Headers" Error)**
    Symptom: `Invoke-WebRequest : Cannot bind parameter 'Headers'`.
    Fix: In PowerShell, `curl` is an alias for `Invoke-WebRequest`. To use the real Linux curl, either:
    - Always wrap in `wsl -d Ubuntu -- bash -c "curl ..."`
    - Use the full path `/usr/bin/curl` inside the WSL context to avoid any shell ambiguity.

12. **Background Jobs & "Connection Refused"**
    Symptom: `curl` fails immediately after starting `start:dev`.
    Fix: NestJS needs ~20-30 seconds to boot. Always add a `Start-Sleep -Seconds 25` or use the polling loop in Pitfall 4.

13. **WSL Path Translation**
    Symptom: `curl: could not open file @/tmp/test.json`.
    Fix: If you use the `write_file` tool from Windows, the file is at `\\wsl.localhost\Ubuntu\home\bishop\...`. From inside WSL, that same file is at `/home/bishop/...`. Ensure your curl command uses the internal Linux path.

## On completion
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$d = Get-Content $p -Raw | ConvertFrom-Json
$d.tasks.'T[X.Y]'.status = "complete"
$d.tasks.'T[X.Y]'.notes = "[what was built]"
$d.current_task = "T[next]"
$d | ConvertTo-Json -Depth 10 | Set-Content $p -Encoding UTF8

Print: T[X.Y] COMPLETE
