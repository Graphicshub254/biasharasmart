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
