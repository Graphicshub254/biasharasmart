  # GEMINI.md — Task Brief: T3.2
## Task: USSD Gateway — Africa's Talking integration, feature phone menu, invoice + payment via USSD

## Environment rules
- Same as all previous tasks
- AT sandbox credentials are in .env: AT_USERNAME, AT_API_KEY, AT_USSD_CODE

## Pre-checks

```powershell
wsl -d Ubuntu -- bash -c "grep -E 'AT_' /home/bishop/projects/biasharasmart/.env | sed 's/=.*/=<set>/'"
wsl -d Ubuntu -- bash -c "python3 -c \"import json,pathlib; d=json.loads(pathlib.Path('/home/bishop/projects/biasharasmart/progress.txt').read_text(encoding='utf-8-sig')); print(d['tasks']['T3.1']['status'])\""
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -5"
```

## Install Africa's Talking SDK

```powershell
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api add africastalking"
```

## What to build

| File | What |
|---|---|
| `apps/api/src/ussd/ussd.module.ts` | USSD module |
| `apps/api/src/ussd/ussd.controller.ts` | POST /api/ussd/callback — AT webhook |
| `apps/api/src/ussd/ussd.service.ts` | Menu state machine |
| `apps/api/src/ussd/ussd-session.store.ts` | In-memory session state |

## USSD Menu tree

```
*384*12345#
├── 1. Check Balance
│   └── "Balance: KES X | WHT Due: KES Y"
├── 2. Record Sale
│   ├── Enter amount: ____
│   ├── Enter customer phone: ____
│   └── "Sale of KES X recorded. Invoice #XXXXXXXX"
├── 3. Pay WHT
│   └── "WHT due: KES X. Pay via M-Pesa to Paybill [XXXX]. Ref: WHT[date]"
├── 4. My Score
│   └── "Biashara Score: XXX/1000. [Eligible/Not eligible] for Co-op loan."
└── 5. VAT Status
    └── "VAT this month: KES X due. File by [date]."
```

## Session state machine

```typescript
// ussd-session.store.ts
interface UssdSession {
  phone: string;
  businessId: string | null;
  step: string;
  data: Record<string, any>;
  lastActivity: Date;
}

export class UssdSessionStore {
  private sessions = new Map<string, UssdSession>();

  get(sessionId: string): UssdSession | undefined {
    return this.sessions.get(sessionId);
  }

  set(sessionId: string, session: UssdSession): void {
    this.sessions.set(sessionId, session);
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // Clean sessions older than 5 minutes
  cleanup(): void {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    for (const [id, session] of this.sessions) {
      if (session.lastActivity < fiveMinutesAgo) this.sessions.delete(id);
    }
  }
}
```

## USSD service — state machine

```typescript
async handleUssd(params: {
  sessionId: string;
  serviceCode: string;
  phoneNumber: string;
  text: string;
}): Promise<string> {
  const { sessionId, phoneNumber, text } = params;
  const parts = text.split('*');
  const level = parts.length;

  // Find business by phone number
  const business = await this.businessRepo.findOne({
    where: [{ mpesaTill: phoneNumber }, { mpesaPaybill: phoneNumber }],
  }) ?? await this.businessRepo.findOne({ where: { id: '7951dda8-a30e-4928-8350-b6c5662154a8' } }); // fallback for testing

  // Level 0 — main menu
  if (text === '') {
    return `CON Welcome to BiasharaSmart
1. Check Balance
2. Record Sale
3. Pay WHT
4. My Bia Score
5. VAT Status`;
  }

  // Level 1 — main menu selection
  if (level === 1) {
    switch (parts[0]) {
      case '1': {
        // Check balance
        const wht = await this.paymentsService.getWhtSummary(business.id);
        const recentPayments = await this.paymentRepo.find({
          where: { businessId: business.id, status: PaymentStatus.CONFIRMED },
          order: { createdAt: 'DESC' },
          take: 1,
        });
        const lastPayment = recentPayments[0];
        return `END Balance Summary
Last payment: KES ${lastPayment ? Number(lastPayment.amountKes).toLocaleString() : '0'}
WHT Due: KES ${wht.totalPending.toLocaleString()}
Mode: ${wht.paymentMode.toUpperCase()}`;
      }
      case '2':
        return `CON Record Sale
Enter sale amount in KES:`;
      case '3': {
        const wht = await this.paymentsService.getWhtSummary(business.id);
        return `END Pay WHT
Amount Due: KES ${wht.totalPending.toLocaleString()}
Pay via M-Pesa:
Paybill: 247247
Account: WHT${new Date().toISOString().slice(0,7).replace('-','')}
Due: ${wht.nextDueDate ? new Date(wht.nextDueDate).toDateString() : 'N/A'}`;
      }
      case '4': {
        const score = await this.scoreService.calculateScore(business.id);
        return `END Biashara Score
Score: ${score.total}/1000
${score.loanEligible ? 'ELIGIBLE for Co-op loan' : `Need ${600 - score.total} more pts for loan`}
Consistency: ${score.breakdown.consistency}/400
Tax Hygiene: ${score.breakdown.taxHygiene}/300`;
      }
      case '5': {
        const now = new Date();
        const vatReturn = await this.vatReturnRepo.findOne({
          where: {
            businessId: business.id,
            periodMonth: now.getMonth() + 1,
            periodYear: now.getFullYear(),
          },
        });
        return `END VAT Status - ${now.toLocaleString('en-KE', { month: 'long' })}
Net VAT Due: KES ${vatReturn ? Number(vatReturn.netVatKes).toLocaleString() : '0'}
Status: ${vatReturn?.status ?? 'No return yet'}
File by: ${new Date(now.getFullYear(), now.getMonth() + 1, 20).toDateString()}`;
      }
      default:
        return `END Invalid option. Dial ${process.env.AT_USSD_CODE} to start again.`;
    }
  }

  // Level 2 — Record Sale flow
  if (level === 2 && parts[0] === '2') {
    const amount = parseFloat(parts[1]);
    if (isNaN(amount) || amount <= 0) return `END Invalid amount. Please try again.`;
    return `CON Sale: KES ${amount.toLocaleString()}
Enter customer phone (254XXXXXXXXX) or 0 to skip:`;
  }

  // Level 3 — Record Sale confirm
  if (level === 3 && parts[0] === '2') {
    const amount = parseFloat(parts[1]);
    const phone = parts[2] === '0' ? undefined : parts[2];

    // Create invoice
    const vatAmount = +(amount * 0.16 / 1.16).toFixed(2); // extract VAT from inclusive amount
    const subtotal = +(amount - vatAmount).toFixed(2);

    const invoice = await this.invoiceRepo.save(
      this.invoiceRepo.create({
        businessId: business.id,
        customerPhone: phone,
        lineItems: [{ description: 'USSD Sale', quantity: 1, unitPrice: subtotal, vatRate: 0.16 }],
        subtotalKes: subtotal,
        vatAmountKes: vatAmount,
        totalKes: amount,
        status: InvoiceStatus.ISSUED,
      })
    );

    const whtAmount = +(amount * WHT_RATE).toFixed(2);
    return `END Sale Recorded!
Invoice: #${invoice.id.slice(-8).toUpperCase()}
Amount: KES ${amount.toLocaleString()}
VAT: KES ${vatAmount.toLocaleString()}
WHT Due: KES ${whtAmount.toLocaleString()}
Send M-Pesa prompt? Dial ${process.env.AT_USSD_CODE} > 2 to collect.`;
  }

  return `END Session expired. Dial ${process.env.AT_USSD_CODE} to start again.`;
}
```

## Controller

```typescript
@Controller('ussd')
export class UssdController {
  @Post('callback')
  @HttpCode(200)
  async handleCallback(@Body() body: any, @Res() res: Response) {
    // AT sends form-encoded data
    const { sessionId, serviceCode, phoneNumber, text } = body;
    const response = await this.ussdService.handleUssd({
      sessionId, serviceCode, phoneNumber, text,
    });
    res.set('Content-Type', 'text/plain');
    res.send(response);
  }
}
```

**Important:** AT USSD callback sends `application/x-www-form-urlencoded`. Add to main.ts:
```typescript
// Ensure urlencoded body parsing is enabled in NestJS
app.use(express.urlencoded({ extended: true }));
```

Read current main.ts before editing:
```powershell
wsl -d Ubuntu -- bash -c "cat /home/bishop/projects/biasharasmart/apps/api/src/main.ts"
```

## Testing with ngrok

```powershell
# Start API
Start-Job -ScriptBlock { wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api start:dev" }
Start-Sleep -Seconds 20

# Start ngrok
Start-Job -ScriptBlock { wsl -d Ubuntu -- bash -c "ngrok http 3000" }
Start-Sleep -Seconds 5

# Get ngrok URL
wsl -d Ubuntu -- bash -c "curl -s http://localhost:4040/api/tunnels | python3 -c 'import json,sys; print(json.load(sys.stdin)[\"tunnels\"][0][\"public_url\"])'"
```

Set callback URL in AT dashboard: `https://xxxx.ngrok.io/api/ussd/callback`

Simulate USSD session locally:
```powershell
# Main menu
wsl -d Ubuntu -- bash -c "python3 -c \"import json; open('/tmp/ussd.json','w').write(json.dumps({'sessionId':'test123','serviceCode':'*384*12345#','phoneNumber':'254712345678','text':''}))\""
wsl -d Ubuntu -- bash -c "curl -s -X POST http://localhost:3000/api/ussd/callback -H 'Content-Type: application/x-www-form-urlencoded' -d 'sessionId=test123&serviceCode=*384*12345%23&phoneNumber=254712345678&text='"

# Check balance
wsl -d Ubuntu -- bash -c "curl -s -X POST http://localhost:3000/api/ussd/callback -H 'Content-Type: application/x-www-form-urlencoded' -d 'sessionId=test123&serviceCode=*384*12345%23&phoneNumber=254712345678&text=1'"
```

## Exit criteria
- [ ] POST /api/ussd/callback returns CON/END text responses
- [ ] Main menu shows all 5 options
- [ ] Check Balance returns real WHT + last payment data
- [ ] Record Sale creates invoice, calculates VAT + WHT
- [ ] Pay WHT shows correct amount + paybill instructions
- [ ] My Score returns real Biashara Score
- [ ] VAT Status returns current month VAT
- [ ] API build: zero errors
- [ ] urlencoded body parsing enabled in main.ts

## On completion

```powershell
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$raw = [System.IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)
$d = $raw | ConvertFrom-Json
$d.tasks.'T3.2'.status = "complete"
$d.tasks.'T3.2'.notes = "T3.2 COMPLETE: USSD Gateway. AT integration, 5-option menu, balance check, sale recording (creates invoice), WHT payment instructions, Bia Score, VAT status. Tested locally via form-encoded POST."
$d.current_task = "T3.3"
[System.IO.File]::WriteAllText($p, ($d | ConvertTo-Json -Depth 10), [System.Text.Encoding]::UTF8)
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git add -A && git --no-pager commit -m 'T3.2: USSD Gateway — AT integration, 5-option menu, invoice + WHT + score via feature phone'"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git push origin main"
Write-Host "T3.2 COMPLETE"
```
