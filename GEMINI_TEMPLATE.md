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

## On completion
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$d = Get-Content $p -Raw | ConvertFrom-Json
$d.tasks.'T[X.Y]'.status = "complete"
$d.tasks.'T[X.Y]'.notes = "[what was built]"
$d.current_task = "T[next]"
$d | ConvertTo-Json -Depth 10 | Set-Content $p -Encoding UTF8

Print: T[X.Y] COMPLETE
