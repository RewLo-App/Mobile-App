DO $$ BEGIN CREATE TYPE "merchant_loyalty_rule_type" AS ENUM ('per_dollar', 'per_visit', 'campaign'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "merchant_loyalty_rule_status" AS ENUM ('draft', 'active', 'paused', 'expired', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "merchant_campaign_status" AS ENUM ('draft', 'scheduled', 'active', 'paused', 'ended', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "merchant_campaign_issuance_status" AS ENUM ('posted', 'failed', 'reversed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "merchant_loyalty_campaigns" (
  "id" serial PRIMARY KEY, "merchant_id" integer NOT NULL REFERENCES "merchants"("id"), "name" text NOT NULL,
  "description" text NOT NULL DEFAULT '', "status" "merchant_campaign_status" NOT NULL DEFAULT 'draft',
  "starts_at" timestamp with time zone, "ends_at" timestamp with time zone, "points_budget" integer NOT NULL,
  "points_issued" integer NOT NULL DEFAULT 0, "eligibility" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(), "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "merchant_campaign_budget_valid" CHECK ("points_budget" >= 0),
  CONSTRAINT "merchant_campaign_issued_valid" CHECK ("points_issued" >= 0),
  CONSTRAINT "merchant_campaign_cap_enforced" CHECK ("points_issued" <= "points_budget")
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchant_campaigns_merchant_status_dates_idx" ON "merchant_loyalty_campaigns" ("merchant_id", "status", "starts_at", "ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "merchant_campaigns_merchant_name_unique" ON "merchant_loyalty_campaigns" ("merchant_id", "name");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "merchant_loyalty_rules" (
  "id" serial PRIMARY KEY, "merchant_id" integer NOT NULL REFERENCES "merchants"("id"), "rule_key" text NOT NULL,
  "version" integer NOT NULL DEFAULT 1, "supersedes_rule_id" integer REFERENCES "merchant_loyalty_rules"("id"),
  "name" text NOT NULL, "rule_type" "merchant_loyalty_rule_type" NOT NULL, "status" "merchant_loyalty_rule_status" NOT NULL DEFAULT 'draft',
  "priority" integer NOT NULL DEFAULT 0, "points_numerator" integer, "spend_denominator_cents" integer,
  "points_per_visit" integer, "campaign_id" integer REFERENCES "merchant_loyalty_campaigns"("id"),
  "conditions" jsonb NOT NULL DEFAULT '{}'::jsonb, "starts_at" timestamp with time zone, "ends_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "merchant_loyalty_rules_key_version_unique" UNIQUE ("merchant_id", "rule_key", "version"),
  CONSTRAINT "merchant_loyalty_rule_rate_valid" CHECK (("rule_type" <> 'per_dollar') OR ("points_numerator" > 0 AND "spend_denominator_cents" > 0)),
  CONSTRAINT "merchant_loyalty_rule_visit_valid" CHECK (("rule_type" <> 'per_visit') OR "points_per_visit" > 0),
  CONSTRAINT "merchant_loyalty_rule_campaign_valid" CHECK (("rule_type" <> 'campaign') OR "campaign_id" IS NOT NULL)
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchant_loyalty_rules_merchant_status_priority_idx" ON "merchant_loyalty_rules" ("merchant_id", "status", "priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchant_loyalty_rules_campaign_idx" ON "merchant_loyalty_rules" ("campaign_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "merchant_campaign_issuances" (
  "id" serial PRIMARY KEY, "merchant_id" integer NOT NULL REFERENCES "merchants"("id"),
  "campaign_id" integer NOT NULL REFERENCES "merchant_loyalty_campaigns"("id"), "fan_user_id" integer NOT NULL REFERENCES "users"("id"),
  "ledger_entry_id" integer REFERENCES "merchant_loyalty_ledger_entries"("id"), "issued_points" integer NOT NULL,
  "status" "merchant_campaign_issuance_status" NOT NULL DEFAULT 'posted', "source_event_key" text,
  "idempotency_key" text NOT NULL UNIQUE, "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "issued_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "merchant_campaign_issuance_points_positive" CHECK ("issued_points" > 0)
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "merchant_campaign_issuances_campaign_fan_event_unique" ON "merchant_campaign_issuances" ("campaign_id", "fan_user_id", "source_event_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchant_campaign_issuances_merchant_issued_idx" ON "merchant_campaign_issuances" ("merchant_id", "issued_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchant_campaign_issuances_campaign_status_issued_idx" ON "merchant_campaign_issuances" ("campaign_id", "status", "issued_at");
