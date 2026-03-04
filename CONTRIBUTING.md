# Contributing to BiasharaSmart

## Development Environment

| Component | Version | Location |
|---|---|---|
| Node.js | 22.x | WSL Ubuntu |
| Yarn | 1.22.x | WSL Ubuntu |
| Python | 3.12.x | WSL Ubuntu |
| PostgreSQL | 16 | WSL Ubuntu localhost:5432 |
| Gemini CLI | 0.31.0+ | Windows PowerShell |

## Session Rules

1. One task per session
2. New session every iteration
3. progress.txt is the brain
4. GEMINI.md is the briefing
5. Escalate at 3 failures
6. Never skip exit criteria

## Execution Environment

| Action | Method |
|---|---|
| Run Linux commands | wsl -d Ubuntu -- cmd |
| Write project files | Set-Content to \\wsl$\Ubuntu\home\bishop\projects\biasharasmart\file |

Project WSL path: /home/bishop/projects/biasharasmart
Project Windows path: \\wsl$\Ubuntu\home\bishop\projects\biasharasmart

## Session Start Protocol

1. Read progress.txt
2. Read GEMINI.md brief
3. Query MCP servers for acceptance criteria
4. Attempt the task
5. Run all exit criteria checks
6. PASS: write completion to progress.txt, end session
7. FAIL: write failure notes, start NEW session

## MCP Servers

| Server | Purpose | How to start |
|---|---|---|
| biasharasmart-prd | PRD specs and acceptance criteria | Auto via Gemini CLI |
| progress-tracker | progress.txt as queryable resource | Auto via Gemini CLI |
| filesystem | Live project file access | Auto via Gemini CLI |
| codegraphcontext | Code graph and call chains | cgc mcp start in WSL |
| google-search | Live web search grounding | Built into Gemini CLI |
| playwright | Browser UI testing | npx @playwright/mcp@latest --headless --port 8931 |

Always run before any coding session:
cd ~/projects/biasharasmart && cgc mcp start

## Python Tooling in WSL

Ubuntu 24.04 blocks global pip. Always use pipx:
pipx install package
Tools available at: ~/.local/bin/tool

Never use pip install --break-system-packages.

## Financial Code Rules

- No any types anywhere
- Strict null checks on all financial values
- All monetary amounts as integers (cents) never floats
- No direct ledger UPDATE or DELETE
- All M-Pesa amounts validated before STK push
- All KRA submissions logged with full request/response
