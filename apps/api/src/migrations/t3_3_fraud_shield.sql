-- Fraud events table
CREATE TABLE IF NOT EXISTS fraud_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  event_type VARCHAR(50) NOT NULL, -- SIM_SWAP | ANOMALY | VAULT_TRIGGERED | LARGE_TRANSACTION
  severity VARCHAR(20) DEFAULT 'medium', -- low | medium | high | critical
  description TEXT,
  metadata JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add vault_mode to businesses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='businesses' AND column_name='vault_mode'
  ) THEN
    ALTER TABLE businesses ADD COLUMN vault_mode BOOLEAN DEFAULT FALSE;
    ALTER TABLE businesses ADD COLUMN vault_triggered_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add transaction_secret to businesses (3-digit code)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='businesses' AND column_name='transaction_secret'
  ) THEN
    ALTER TABLE businesses ADD COLUMN transaction_secret VARCHAR(3);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fraud_events_business_id ON fraud_events(business_id);
CREATE INDEX IF NOT EXISTS idx_fraud_events_event_type ON fraud_events(event_type);
CREATE INDEX IF NOT EXISTS idx_fraud_events_resolved ON fraud_events(resolved);
