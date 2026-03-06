# GEMINI.md — Task Brief: T2.3
## Task: Push notifications — WHT deadline alerts, KRA sync status, score milestones

## Environment rules
- Same as all previous tasks

## Pre-checks

```powershell
wsl -d Ubuntu -- bash -c "python3 -c \"import json,pathlib; d=json.loads(pathlib.Path('/home/bishop/projects/biasharasmart/progress.txt').read_text(encoding='utf-8-sig')); print(d['tasks']['T2.2']['status'])\""
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -5"
```

## What to build

| File | What |
|---|---|
| `apps/api/src/notifications/notifications.module.ts` | Notifications module |
| `apps/api/src/notifications/notifications.service.ts` | Push send logic + scheduler |
| `apps/api/src/notifications/notifications.controller.ts` | Register token, test send |
| `apps/api/src/entities/notification-token.entity.ts` | Store Expo push tokens per business |
| DB migration | `notification_tokens` table |
| `apps/mobile/src/lib/notifications.ts` | Register + request permissions on app start |

## Push notification types

| Type | When triggered | Message |
|---|---|---|
| WHT_DEADLINE_3DAYS | WHT liability due in 3 days | "⚠️ KES {X} WHT due in 3 days. Pay now to avoid KRA penalties." |
| WHT_DEADLINE_1DAY | WHT liability due tomorrow | "🚨 KES {X} WHT due TOMORROW. Pay immediately." |
| WHT_OVERDUE | WHT liability now overdue | "❌ KES {X} WHT is OVERDUE. KRA penalties may apply." |
| KRA_SYNC_SUCCESS | Invoice cu_number returned | "✅ Invoice #{ref} registered with KRA. CU: {cuNumber}" |
| KRA_SYNC_FAIL | GavaConnect offline queue | "⚠️ Invoice #{ref} KRA sync failed. Will retry when online." |
| SCORE_MILESTONE | Score crosses 400/600/800 | "🎯 Biashara Score hit {score}! You're now eligible for Co-op Bank loans." |
| TCC_EXPIRY_30DAYS | TCC expires in 30 days | "⚠️ Your Tax Compliance Certificate expires in 30 days. Renew on iTax." |

## Expo push notifications

Use Expo's push notification service (no Firebase needed for Expo Go).

```typescript
// notifications.service.ts
import Expo from 'expo-server-sdk';

const expo = new Expo();

async sendPush(token: string, title: string, body: string, data?: any) {
  if (!Expo.isExpoPushToken(token)) return;
  const message = {
    to: token,
    sound: 'default',
    title,
    body,
    data: data ?? {},
  };
  try {
    await expo.sendPushNotificationsAsync([message]);
  } catch (err) {
    this.logger.error('Push send failed', err);
  }
}
```

Install expo-server-sdk in API:
```powershell
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api add expo-server-sdk"
```

## Scheduler — check WHT deadlines daily

Use NestJS @Cron decorator. Run daily at 8AM EAT (5AM UTC):

```typescript
import { Cron } from '@nestjs/schedule';

@Cron('0 5 * * *') // 8AM EAT
async checkWhtDeadlines() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const threeDaysOut = new Date();
  threeDaysOut.setDate(threeDaysOut.getDate() + 3);

  // Find liabilities due in 1 day
  const dueTomorrow = await this.whtLiabilityRepo.find({
    where: { status: 'pending', dueDate: Between(new Date(), tomorrow) },
  });

  // Find liabilities due in 3 days
  const dueIn3Days = await this.whtLiabilityRepo.find({
    where: { status: 'pending', dueDate: Between(tomorrow, threeDaysOut) },
  });

  // Send notifications for each
  for (const liability of dueTomorrow) {
    await this.sendNotificationForBusiness(liability.businessId, 'WHT_DEADLINE_1DAY', liability.amountKes);
  }
  for (const liability of dueIn3Days) {
    await this.sendNotificationForBusiness(liability.businessId, 'WHT_DEADLINE_3DAYS', liability.amountKes);
  }
}
```

Add `ScheduleModule.forRoot()` to app.module.ts.

## Entity

```typescript
@Entity('notification_tokens')
export class NotificationToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id' })
  businessId!: string;

  @Column({ name: 'expo_token', length: 200, unique: true })
  expoToken!: string;

  @Column({ name: 'device_id', length: 100, nullable: true })
  deviceId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
```

DB migration:
```sql
CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  expo_token VARCHAR(200) NOT NULL UNIQUE,
  device_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_business_id ON notification_tokens(business_id);
```

## Mobile: register for notifications

apps/mobile/src/lib/notifications.ts

```typescript
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function registerForPushNotifications(businessId: string): Promise<void> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  })).data;

  await fetch(`${API_BASE}/api/notifications/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessId, expoToken: token }),
  });
}
```

Call `registerForPushNotifications(BUSINESS_ID)` in dashboard.tsx useEffect.

## Controller

```typescript
@Controller('notifications')
export class NotificationsController {
  @Post('register')
  register(@Body() dto: { businessId: string; expoToken: string }) {
    return this.notificationsService.registerToken(dto.businessId, dto.expoToken);
  }

  @Post('test/:businessId')
  testPush(@Param('businessId') businessId: string) {
    return this.notificationsService.sendTestNotification(businessId);
  }
}
```

## Exit criteria
- [ ] notification_tokens table created
- [ ] POST /api/notifications/register stores Expo token
- [ ] @Cron job runs at 5AM UTC — checks WHT deadlines, sends push
- [ ] expo-server-sdk installed in API
- [ ] mobile notifications.ts registers token on dashboard load
- [ ] API build: zero errors, mobile tsc: zero errors

## On completion

```powershell
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$raw = [System.IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)
$d = $raw | ConvertFrom-Json
$d.tasks.'T2.3'.status = "complete"
$d.tasks.'T2.3'.notes = "T2.3 COMPLETE: Push notifications. WHT deadline alerts (1day, 3day, overdue), KRA sync, score milestone. Expo push tokens stored. Daily cron scheduler. Mobile registers token on load."
$d.current_task = "T2.4"
[System.IO.File]::WriteAllText($p, ($d | ConvertTo-Json -Depth 10), [System.Text.Encoding]::UTF8)
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git add -A && git --no-pager commit -m 'T2.3: Push notifications — WHT deadline alerts + score milestones + cron scheduler'"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git push origin main"
Write-Host "T2.3 COMPLETE"
```
