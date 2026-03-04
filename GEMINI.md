# GEMINI.md — Task Brief: T0.2e
## Task: Register all MCP servers with Gemini CLI and verify connections

## Environment rules
- You run on Windows PowerShell
- All Linux commands: `wsl -d Ubuntu -- <cmd>`
- Project WSL path: `/home/bishop/projects/biasharasmart`

## Pre-checks — all must pass before proceeding
```powershell
# prd_server exists
wsl -d Ubuntu -- bash -c "test -f /home/bishop/projects/biasharasmart/mcp/prd_server.py && echo OK || echo MISSING"

# progress_server exists
wsl -d Ubuntu -- bash -c "test -f /home/bishop/projects/biasharasmart/mcp/progress_server.py && echo OK || echo MISSING"

# cgc installed
wsl -d Ubuntu -- bash -c "~/.local/bin/cgc --version || echo MISSING"
```
If any output is MISSING, stop. Fix the missing task first.

## What to do

### Step 1 — Register biasharasmart-prd server
```powershell
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && ~/.local/bin/fastmcp install gemini-cli mcp/prd_server.py --name biasharasmart-prd"
```

### Step 2 — Register progress-tracker server
```powershell
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && ~/.local/bin/fastmcp install gemini-cli mcp/progress_server.py --name progress-tracker"
```

### Step 3 — Register filesystem server
```powershell
wsl -d Ubuntu -- bash -c "npx -y @modelcontextprotocol/server-filesystem /home/bishop/projects/biasharasmart &"
```

### Step 4 — Locate Gemini CLI settings.json and confirm registrations
```powershell
# Find where Gemini CLI stores its config on Windows
$settingsPath = "$env:APPDATA\gemini-cli\settings.json"
if (Test-Path $settingsPath) {
    Get-Content $settingsPath | Select-String "biasharasmart-prd","progress-tracker","filesystem","codegraphcontext"
} else {
    Write-Host "Settings not at $settingsPath — searching..."
    Get-ChildItem -Path $env:APPDATA -Recurse -Filter "settings.json" -ErrorAction SilentlyContinue | Select-String "mcpServers" | Select-Object -First 3
}
```

### Step 5 — Verify PRD server responds correctly
```powershell
wsl -d Ubuntu -- python3 -c "
import sys, json, pathlib
sys.path.insert(0, '/home/bishop/projects/biasharasmart/mcp')
spec = json.loads(pathlib.Path('/home/bishop/projects/biasharasmart/mcp/prd_features.json').read_text())
criteria = spec['T0.4']['acceptance_criteria']
print('T0.4 criteria count:', len(criteria))
for c in criteria:
    print(' -', c)
"
```
Expected: 5 criteria printed for T0.4.

### Step 6 — Verify progress-tracker reads correctly
```powershell
wsl -d Ubuntu -- python3 -c "
import json, pathlib
data = json.loads(pathlib.Path('/home/bishop/projects/biasharasmart/progress.txt').read_text())
completed = [k for k,v in data['tasks'].items() if v.get('status')=='complete']
print('Completed:', completed)
pending = [k for k,v in data['tasks'].items() if v.get('status')!='complete']
print('Pending count:', len(pending))
"
```

### Step 7 — Update progress.txt to reflect T0.2 complete
```powershell
$progressPath = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$data = Get-Content $progressPath -Raw | ConvertFrom-Json
$data.tasks.'T0.2'.status = "complete"
$data.tasks.'T0.2'.notes = "All MCP servers built and registered: biasharasmart-prd, progress-tracker, filesystem (npx), CodeGraphContext (manual cgc setup pending), google-search (built-in). Playwright installed, deferred to T1.2."
$data.current_task = "T0.5"
$data.mcp_servers.'biasharasmart-prd' = "running"
$data.mcp_servers.'progress-tracker' = "running"
$data.mcp_servers.'filesystem' = "running"
$data | ConvertTo-Json -Depth 10 | Set-Content $progressPath -Encoding UTF8
```

## Exit criteria
- [ ] `biasharasmart-prd` registered in Gemini CLI settings.json
- [ ] `progress-tracker` registered in Gemini CLI settings.json
- [ ] `filesystem` server running
- [ ] PRD server returns 5 criteria for T0.4
- [ ] progress-tracker reads progress.txt and returns correct completed tasks
- [ ] progress.txt updated: T0.2 status = complete, current_task = T0.5

## Do NOT do
- Do not start a new Gemini session to verify /mcp — do it manually after this session ends
- Do not modify any other task statuses in progress.txt

## On completion
Print: `T0.2e COMPLETE — MCP foundation live`

## Manual step after this session
Open a fresh Gemini CLI session and type: /mcp
Confirm biasharasmart-prd, progress-tracker, and filesystem appear as connected.
Then tell Claude what you see.
