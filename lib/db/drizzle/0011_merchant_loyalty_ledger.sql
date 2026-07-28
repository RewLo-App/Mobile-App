-- Merchant loyalty reporting is kept separate from the existing fan reward
-- activity. The new ledger is append-only and uses signed integer points and
-- cents; no floating point accounting values are stored.
DO $$ BEGIN
  CREATE TYPE "merchant_loyalty_entry_type" AS ENUM ('issuance', 'redemption', 'transfer_in', 'transfer_out', 'expiration', 'adjustment', 'reversal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "merchant_loyalty_entry_status" AS ENUM ('pending', 'posted', 'reversed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "merchant_transfer_status" AS ENUM ('pending', 'completed', 'failed', 'reversed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "merchant_settlement_status" AS ENUM ('draft', 'pending', 'processing', 'settled', 'failed', 'disputed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "merchant_alert_severity" AS ENUM ('info', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "merchant_alert_state" AS ENUM ('open', 'read', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "merchant_loyalty_ledger_entries" (
  "id" serial PRIMARY KEY,
  "merchant_id" integer NOT NULL REFERENCES "merchants"("id"),
  "fan_user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "entry_type" "merchant_loyalty_entry_type" NOT NULL,
  "status" "merchant_loyalty_entry_status" NOT NULL DEFAULT 'pending',
  "points_delta" integer NOT NULL,
  "reserve_delta_cents" integer NOT NULL DEFAULT 0,
  "source_type" text NOT NULL,
  "source_id" text,
  "idempotency_key" text NOT NULL UNIQUE,
  "external_reference" text,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "occurred_at" timestamp with time zone NOT NULL DEFAULT now(),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "merchant_loyalty_ledger_points_nonzero" CHECK ("points_delta" <> 0)
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "merchant_loyalty_ledger_merchant_reference_unique" ON "merchant_loyalty_ledger_entries" ("merchant_id", "external_reference");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchant_loyalty_ledger_merchant_occurred_idx" ON "merchant_loyalty_ledger_entries" ("merchant_id", "occurred_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchant_loyalty_ledger_merchant_status_occurred_idx" ON "merchant_loyalty_ledger_entries" ("merchant_id", "status", "occurred_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchant_loyalty_ledger_fan_occurred_idx" ON "merchant_loyalty_ledger_entries" ("fan_user_id", "occurred_at");--> statement-breakpoint

-- Corrections must be represented by a separate reversal or adjustment row,
-- never by mutating or deleting a historical ledger entry.
CREATE OR REPLACE FUNCTION "prevent_merchant_loyalty_ledger_mutation"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'merchant_loyalty_ledger_entries is append-only; create a reversal or adjustment entry instead';
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
DROP TRIGGER IF EXISTS "merchant_loyalty_ledger_immutable" ON "merchant_loyalty_ledger_entries";--> statement-breakpoint
CREATE TRIGGER "merchant_loyalty_ledger_immutable"
  BEFORE UPDATE OR DELETE ON "merchant_loyalty_ledger_entries"
  FOR EACH ROW EXECUTE FUNCTION "prevent_merchant_loyalty_ledger_mutation"();--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "merchant_loyalty_transfers" (
  "id" serial PRIMARY KEY,
  "source_merchant_id" integer NOT NULL REFERENCES "merchants"("id"),
  "destination_merchant_id" integer NOT NULL REFERENCES "merchants"("id"),
  "points" integer NOT NULL,
  "status" "merchant_transfer_status" NOT NULL DEFAULT 'pending',
  "idempotency_key" text NOT NULL UNIQUE,
  "external_reference" text,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "initiated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "merchant_transfer_positive_points" CHECK ("points" > 0),
  CONSTRAINT "merchant_transfer_distinct_merchants" CHECK ("source_merchant_id" <> "destination_merchant_id")
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchant_transfers_source_status_initiated_idx" ON "merchant_loyalty_transfers" ("source_merchant_id", "status", "initiated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchant_transfers_destination_status_initiated_idx" ON "merchant_loyalty_transfers" ("destination_merchant_id", "status", "initiated_at");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "merchant_settlements" (
  "id" serial PRIMARY KEY,
  "merchant_id" integer NOT NULL REFERENCES "merchants"("id"),
  "period_start" timestamp with time zone NOT NULL,
  "period_end" timestamp with time zone NOT NULL,
  "status" "merchant_settlement_status" NOT NULL DEFAULT 'draft',
  "issued_points" integer NOT NULL DEFAULT 0,
  "redeemed_points" integer NOT NULL DEFAULT 0,
  "transfer_in_points" integer NOT NULL DEFAULT 0,
  "transfer_out_points" integer NOT NULL DEFAULT 0,
  "reserve_contribution_cents" integer NOT NULL DEFAULT 0,
  "reserve_release_cents" integer NOT NULL DEFAULT 0,
  "net_float_cents" integer NOT NULL DEFAULT 0,
  "external_reference" text,
  "failure_reason" text,
  "settled_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "merchant_settlement_period_valid" CHECK ("period_end" >= "period_start"),
  CONSTRAINT "merchant_settlements_merchant_period_unique" UNIQUE ("merchant_id", "period_start", "period_end")
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchant_settlements_merchant_status_period_idx" ON "merchant_settlements" ("merchant_id", "status", "period_end");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "merchant_alerts" (
  "id" serial PRIMARY KEY,
  "merchant_id" integer NOT NULL REFERENCES "merchants"("id"),
  "severity" "merchant_alert_severity" NOT NULL DEFAULT 'info',
  "category" text NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "action_path" text,
  "state" "merchant_alert_state" NOT NULL DEFAULT 'open',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "resolved_at" timestamp with time zone
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchant_alerts_merchant_state_created_idx" ON "merchant_alerts" ("merchant_id", "state", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchant_alerts_merchant_severity_created_idx" ON "merchant_alerts" ("merchant_id", "severity", "created_at");
