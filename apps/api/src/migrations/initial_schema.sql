-- Migration 1: create_businesses
CREATE TYPE business_type_enum AS ENUM('sole_proprietor', 'partnership', 'limited_company');
CREATE TYPE kyc_status_enum AS ENUM('pending', 'approved', 'rejected');

CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kra_pin VARCHAR(11) NOT NULL UNIQUE,
  business_name VARCHAR(255) NOT NULL,
  business_type business_type_enum NOT NULL,
  mpesa_paybill VARCHAR(20),
  mpesa_till VARCHAR(20),
  cu_number VARCHAR(50),
  gavaconnect_id VARCHAR(100),
  kyc_status kyc_status_enum DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration 2: create_ledger
CREATE TYPE entry_type_enum AS ENUM('invoice_issued','payment_received','vat_computed','refund','payroll');

CREATE TABLE ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  entry_type entry_type_enum NOT NULL,
  amount_kes NUMERIC(15,2) NOT NULL,
  reference_id UUID,
  checksum VARCHAR(64) NOT NULL,
  previous_checksum VARCHAR(64),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, business_id)
) PARTITION BY HASH (business_id);

CREATE TABLE ledger_0 PARTITION OF ledger FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE ledger_1 PARTITION OF ledger FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE ledger_2 PARTITION OF ledger FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE ledger_3 PARTITION OF ledger FOR VALUES WITH (MODULUS 4, REMAINDER 3);

-- Migration 3: create_invoices
CREATE TYPE invoice_status_enum AS ENUM('draft','pending_kra','issued','paid','overdue','cancelled');

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal_kes NUMERIC(15,2) NOT NULL,
  vat_amount_kes NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_kes NUMERIC(15,2) NOT NULL,
  status invoice_status_enum DEFAULT 'draft',
  cu_number VARCHAR(100),
  offline_queued BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration 4: create_payments
CREATE TYPE payment_status_enum AS ENUM('pending','confirmed','failed','timeout','reversed');

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  invoice_id UUID REFERENCES invoices(id),
  mpesa_transaction_id VARCHAR(50) UNIQUE,
  amount_kes NUMERIC(15,2) NOT NULL,
  status payment_status_enum DEFAULT 'pending',
  phone_number VARCHAR(20),
  idempotency_key VARCHAR(100) UNIQUE NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration 5: create_vat_returns
CREATE TYPE vat_return_status_enum AS ENUM('draft','pending_review','submitted','acknowledged');

CREATE TABLE vat_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL,
  output_vat_kes NUMERIC(15,2) NOT NULL DEFAULT 0,
  input_vat_kes NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_vat_kes NUMERIC(15,2) NOT NULL DEFAULT 0,
  status vat_return_status_enum DEFAULT 'draft',
  gavaconnect_acknowledgement VARCHAR(100),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, period_month, period_year)
);

-- 4. Create immutability trigger on ledger
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger entries are immutable. Cannot % ledger.', TG_OP;
END;
$$ LANGUAGE plpgsql;

-- Apply to partitions
CREATE TRIGGER ledger_immutable_0 BEFORE UPDATE OR DELETE ON ledger_0 FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();
CREATE TRIGGER ledger_immutable_1 BEFORE UPDATE OR DELETE ON ledger_1 FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();
CREATE TRIGGER ledger_immutable_2 BEFORE UPDATE OR DELETE ON ledger_2 FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();
CREATE TRIGGER ledger_immutable_3 BEFORE UPDATE OR DELETE ON ledger_3 FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

-- 5. Create checksum function
CREATE OR REPLACE FUNCTION compute_ledger_checksum(
  p_business_id UUID,
  p_entry_type TEXT,
  p_amount NUMERIC,
  p_reference_id UUID,
  p_previous_checksum TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    sha256(
      (p_business_id::text || p_entry_type || p_amount::text || 
       COALESCE(p_reference_id::text,'') || COALESCE(p_previous_checksum,''))::bytea
    ), 'hex'
  );
END;
$$ LANGUAGE plpgsql;

-- 6. Create indexes
CREATE INDEX idx_businesses_kra_pin ON businesses(kra_pin);
CREATE INDEX idx_businesses_kyc_status ON businesses(kyc_status);
CREATE INDEX idx_invoices_business_id ON invoices(business_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_payments_business_id ON payments(business_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_mpesa_transaction_id ON payments(mpesa_transaction_id);
CREATE INDEX idx_vat_returns_business_id ON vat_returns(business_id);
CREATE INDEX idx_vat_returns_period_year_month ON vat_returns(period_year, period_month);

-- 8. Seed 2 test businesses
INSERT INTO businesses (kra_pin, business_name, business_type, kyc_status)
VALUES 
('P051234567Z', 'Maji Safi Vendors', 'sole_proprietor', 'approved'),
('P051987654A', 'Habari Logistics Ltd', 'limited_company', 'pending');
-- Migration: WHT dual-architecture
-- Safe to run multiple times (uses IF NOT EXISTS / DO blocks)

-- 1. Add payment_mode to businesses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='businesses' AND column_name='payment_mode'
  ) THEN
    ALTER TABLE businesses ADD COLUMN payment_mode VARCHAR(20) DEFAULT 'legacy';
  END IF;
END $$;

-- 2. Add bia_score to businesses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='businesses' AND column_name='bia_score'
  ) THEN
    ALTER TABLE businesses ADD COLUMN bia_score INTEGER DEFAULT 0;
  END IF;
END $$;

-- 3. Add co_op_virtual_account to businesses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='businesses' AND column_name='co_op_virtual_account'
  ) THEN
    ALTER TABLE businesses ADD COLUMN co_op_virtual_account VARCHAR(100);
  END IF;
END $$;

-- 4. Add wht_amount_kes to payments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='payments' AND column_name='wht_amount_kes'
  ) THEN
    ALTER TABLE payments ADD COLUMN wht_amount_kes NUMERIC(15,2) DEFAULT 0;
  END IF;
END $$;

-- 5. Add wht_status to payments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='payments' AND column_name='wht_status'
  ) THEN
    ALTER TABLE payments ADD COLUMN wht_status VARCHAR(20) DEFAULT 'pending';
  END IF;
END $$;

-- 6. Add payment_flow to payments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='payments' AND column_name='payment_flow'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_flow VARCHAR(20) DEFAULT 'legacy';
  END IF;
END $$;

-- 7. Add mpesa_code to payments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='payments' AND column_name='mpesa_code'
  ) THEN
    ALTER TABLE payments ADD COLUMN mpesa_code VARCHAR(50);
  END IF;
END $$;

-- 8. Add escrow_ref to payments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='payments' AND column_name='escrow_ref'
  ) THEN
    ALTER TABLE payments ADD COLUMN escrow_ref VARCHAR(100);
  END IF;
END $$;

-- 9. Create wht_liabilities table
CREATE TABLE IF NOT EXISTS wht_liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  payment_id UUID REFERENCES payments(id),
  amount_kes NUMERIC(15,2) NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Indexes
CREATE INDEX IF NOT EXISTS idx_wht_liabilities_business_id ON wht_liabilities(business_id);
CREATE INDEX IF NOT EXISTS idx_wht_liabilities_status ON wht_liabilities(status);
CREATE INDEX IF NOT EXISTS idx_wht_liabilities_due_date ON wht_liabilities(due_date);
CREATE INDEX IF NOT EXISTS idx_businesses_payment_mode ON businesses(payment_mode);
CREATE INDEX IF NOT EXISTS idx_payments_wht_status ON payments(wht_status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_flow ON payments(payment_flow);

-- T2.3: Notification tokens table
CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  expo_token VARCHAR(200) NOT NULL UNIQUE,
  device_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_business_id ON notification_tokens(business_id);
