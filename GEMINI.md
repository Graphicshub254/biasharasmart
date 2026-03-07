# GEMINI.md — Task Brief: T3.4
## Task: Carbon/D-MRV Engine — green stock tracking, solar KWh logging, carbon dividend seed

## Environment rules
- Same as all previous tasks

## Pre-checks

```powershell
wsl -d Ubuntu -- bash -c "python3 -c \"import json,pathlib; d=json.loads(pathlib.Path('/home/bishop/projects/biasharasmart/progress.txt').read_text(encoding='utf-8-sig')); print(d['tasks']['T3.3']['status'])\""
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && /home/bishop/.npm-global/bin/yarn workspace @biasharasmart/api build 2>&1 | tail -5"
```

## DB migration

```sql
-- Green assets table
CREATE TABLE IF NOT EXISTS green_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  asset_type VARCHAR(50) NOT NULL, -- SOLAR | EV | CLEAN_COOKING | WIND
  asset_name VARCHAR(255) NOT NULL,
  capacity_kw NUMERIC(10,2), -- for solar panels
  installation_date DATE,
  etims_item_code VARCHAR(50), -- mapped to KRA eTIMS green item codes
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MRV readings table (Measurement, Reporting, Verification)
CREATE TABLE IF NOT EXISTS mrv_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES green_assets(id),
  business_id UUID NOT NULL REFERENCES businesses(id),
  reading_date DATE NOT NULL,
  kwh_generated NUMERIC(10,3), -- solar output
  ev_km_charged NUMERIC(10,2), -- EV charging km equivalent
  clean_cooking_meals INTEGER, -- number of clean meals cooked
  carbon_kg_avoided NUMERIC(10,3), -- calculated CO2 avoided
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carbon dividends table
CREATE TABLE IF NOT EXISTS carbon_dividends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  total_kwh NUMERIC(12,3) DEFAULT 0,
  carbon_kg_avoided NUMERIC(12,3) DEFAULT 0,
  dividend_kes NUMERIC(12,2) DEFAULT 0, -- estimated value
  status VARCHAR(20) DEFAULT 'pending', -- pending | verified | paid
  kncr_ref VARCHAR(100), -- Kenya National Carbon Registry reference (stub)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, period_month, period_year)
);

-- Add green_multiplier_active to businesses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='businesses' AND column_name='green_multiplier_active'
  ) THEN
    ALTER TABLE businesses ADD COLUMN green_multiplier_active BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_green_assets_business_id ON green_assets(business_id);
CREATE INDEX IF NOT EXISTS idx_mrv_readings_asset_id ON mrv_readings(asset_id);
CREATE INDEX IF NOT EXISTS idx_mrv_readings_business_id ON mrv_readings(business_id);
CREATE INDEX IF NOT EXISTS idx_carbon_dividends_business_id ON carbon_dividends(business_id);
```

## Carbon calculation constants

Add to shared-types/src/index.ts:

```typescript
// ─── Carbon Constants ─────────────────────────────────────────────────────────
export const CO2_KG_PER_KWH_KENYA = 0.512;     // Kenya grid emission factor (kg CO2/kWh)
export const CARBON_CREDIT_KES_PER_KG = 0.85;  // Estimated KES value per kg CO2 avoided
export const GREEN_SCORE_MULTIPLIER = 50;        // Bia Score bonus points
export const MIN_KWH_FOR_DIVIDEND = 100;         // Minimum monthly kWh for dividend eligibility
```

## What to build

| File | What |
|---|---|
| `apps/api/src/carbon/carbon.module.ts` | Carbon module |
| `apps/api/src/carbon/carbon.controller.ts` | Carbon endpoints |
| `apps/api/src/carbon/carbon.service.ts` | D-MRV calculation engine |
| `apps/api/src/entities/green-asset.entity.ts` | GreenAsset entity |
| `apps/api/src/entities/mrv-reading.entity.ts` | MrvReading entity |
| `apps/api/src/entities/carbon-dividend.entity.ts` | CarbonDividend entity |
| `apps/mobile/app/carbon/index.tsx` | Carbon dashboard screen |
| `apps/mobile/app/carbon/add-asset.tsx` | Register green asset |
| `apps/mobile/app/carbon/log-reading.tsx` | Log daily MRV reading |
| `apps/mobile/app/carbon/_layout.tsx` | Stack layout |

## API endpoints

- GET /api/carbon/:businessId — carbon dashboard summary
- POST /api/carbon/:businessId/assets — register green asset
- GET /api/carbon/:businessId/assets — list assets
- POST /api/carbon/:businessId/readings — log daily MRV reading
- GET /api/carbon/:businessId/dividends — carbon dividend history
- POST /api/carbon/:businessId/calculate — calculate monthly dividend

## Carbon calculation

```typescript
async calculateMonthlyDividend(businessId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const readings = await this.mrvReadingRepo.find({
    where: { businessId, readingDate: Between(startDate, endDate) },
  });

  const totalKwh = readings.reduce((s, r) => s + Number(r.kwhGenerated ?? 0), 0);
  const totalEvKm = readings.reduce((s, r) => s + Number(r.evKmCharged ?? 0), 0);
  const totalMeals = readings.reduce((s, r) => s + (r.cleanCookingMeals ?? 0), 0);

  // CO2 avoided: solar kWh * grid factor
  const carbonFromSolar = +(totalKwh * CO2_KG_PER_KWH_KENYA).toFixed(3);
  const carbonFromEv = +(totalEvKm * 0.21).toFixed(3); // 0.21 kg CO2/km (petrol equivalent)
  const carbonFromCooking = +(totalMeals * 0.8).toFixed(3); // 0.8 kg CO2 per clean meal vs charcoal
  const totalCarbon = +(carbonFromSolar + carbonFromEv + carbonFromCooking).toFixed(3);

  // Dividend in KES
  const dividendKes = totalKwh >= MIN_KWH_FOR_DIVIDEND
    ? +(totalCarbon * CARBON_CREDIT_KES_PER_KG).toFixed(2)
    : 0;

  // Upsert dividend record
  const existing = await this.carbonDividendRepo.findOne({
    where: { businessId, periodMonth: month, periodYear: year },
  });

  const dividend = await this.carbonDividendRepo.save({
    ...(existing ?? {}),
    businessId,
    periodMonth: month,
    periodYear: year,
    totalKwh,
    carbonKgAvoided: totalCarbon,
    dividendKes,
    kncr_ref: `KNCR_STUB_${businessId.slice(-6)}_${year}${month}`,
    status: 'verified',
  });

  // Activate green multiplier on Bia Score if eligible
  if (totalKwh >= MIN_KWH_FOR_DIVIDEND) {
    await this.businessRepo.update(businessId, { greenMultiplierActive: true });
  }

  return { totalKwh, totalCarbon, dividendKes, readings: readings.length };
}
```

## Mobile carbon screens

### app/carbon/index.tsx
- Header "Green Dashboard"
- Summary card (colors.mint background):
  - Total kWh this month: large number
  - CO2 Avoided: X kg
  - Carbon Dividend: KES X (estimated)
  - KNCR Ref: stub reference
- Green Multiplier badge: "+50 Bia Score pts ACTIVE" (if eligible) or "Generate 100+ kWh to unlock"
- Assets list: each asset shows name, type, capacity
- "Add Asset" button → /carbon/add-asset
- "Log Reading" button → /carbon/log-reading
- Monthly history chart (simple bar using View widths, no charting library needed)

### app/carbon/add-asset.tsx
- Asset type selector: Solar Panel | EV Charger | Clean Cooking | Wind
- Asset name input
- Capacity KW input (for solar)
- Installation date picker
- eTIMS Item Code input (optional)
- "Register Asset" → POST /api/carbon/:businessId/assets

### app/carbon/log-reading.tsx
- Asset selector dropdown (fetch from /api/carbon/:businessId/assets)
- Date picker (default today)
- Dynamic fields based on asset type:
  - Solar: kWh Generated input
  - EV: km Charged input
  - Clean Cooking: number of meals input
- Auto-calculate: "CO2 Avoided: X kg"
- "Save Reading" → POST /api/carbon/:businessId/readings
- After save: show "Calculate Dividend" prompt

Wire into More tab:
```typescript
{ label: 'Green Carbon', icon: 'eco', route: '/carbon' }
```

Also update Biashara Score service to include green multiplier:
```typescript
// In score.service.ts calculateScore():
const business = await this.businessRepo.findOne({ where: { id: businessId } });
const greenMultiplier = business?.greenMultiplierActive ? GREEN_SCORE_MULTIPLIER : 0;
const total = Math.min(1000, consistency + taxHygieneFinal + growth + greenMultiplier);
```

## Build and test

```powershell
# Register solar asset
wsl -d Ubuntu -- bash -c "python3 -c \"import json; open('/tmp/asset.json','w').write(json.dumps({'assetType':'SOLAR','assetName':'Rooftop Solar 5kW','capacityKw':5,'installationDate':'2026-01-01'}))\""
wsl -d Ubuntu -- bash -c "curl -s -X POST http://localhost:3000/api/carbon/7951dda8-a30e-4928-8350-b6c5662154a8/assets -H 'Content-Type: application/json' -d @/tmp/asset.json | python3 -m json.tool"

# Log reading (get asset ID from above)
wsl -d Ubuntu -- bash -c "python3 -c \"import json; open('/tmp/reading.json','w').write(json.dumps({'assetId':'REPLACE_ASSET_ID','readingDate':'2026-03-06','kwhGenerated':12.5}))\""
wsl -d Ubuntu -- bash -c "curl -s -X POST http://localhost:3000/api/carbon/7951dda8-a30e-4928-8350-b6c5662154a8/readings -H 'Content-Type: application/json' -d @/tmp/reading.json | python3 -m json.tool"

# Calculate dividend
wsl -d Ubuntu -- bash -c "python3 -c \"import json; open('/tmp/calc.json','w').write(json.dumps({'month':3,'year':2026}))\""
wsl -d Ubuntu -- bash -c "curl -s -X POST http://localhost:3000/api/carbon/7951dda8-a30e-4928-8350-b6c5662154a8/calculate -H 'Content-Type: application/json' -d @/tmp/calc.json | python3 -m json.tool"
```

Expected: totalKwh=12.5, carbonKgAvoided=6.4 (12.5*0.512), dividendKes=0 (below 100kWh threshold)

## Exit criteria
- [x] green_assets + mrv_readings + carbon_dividends tables created
- [x] Register asset endpoint works
- [x] Log MRV reading endpoint works
- [x] Calculate dividend: correct CO2 math (kWh * 0.512)
- [x] Green multiplier activates on Bia Score when 100+ kWh/month
- [x] Carbon dashboard screen shows kWh, CO2, dividend
- [x] Add asset + log reading screens functional
- [x] More tab has Green Carbon link
- [x] API build + mobile tsc: zero errors

## On completion

```powershell
$p = "\\wsl$\Ubuntu\home\bishop\projects\biasharasmart\progress.txt"
$raw = [System.IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)
$d = $raw | ConvertFrom-Json
$d.tasks.'T3.4'.status = "complete"
$d.tasks.'T3.4'.notes = "T3.4 COMPLETE: Carbon D-MRV engine. Green asset registration (Solar/EV/Cooking), daily MRV readings, CO2 calculation (Kenya grid 0.512 kg/kWh), carbon dividends, KNCR stub ref. Green multiplier wired into Bia Score. Carbon dashboard screen."
$d.current_task = "T4.1"
$d.current_phase = 4
[System.IO.File]::WriteAllText($p, ($d | ConvertTo-Json -Depth 10), [System.Text.Encoding]::UTF8)
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git add -A && git --no-pager commit -m 'T3.4: Carbon D-MRV engine — green assets, MRV readings, CO2 calc, carbon dividends, green Bia Score multiplier'"
wsl -d Ubuntu -- bash -c "cd /home/bishop/projects/biasharasmart && git push origin main"
Write-Host "T3.4 COMPLETE — PHASE 3 DONE"
```
