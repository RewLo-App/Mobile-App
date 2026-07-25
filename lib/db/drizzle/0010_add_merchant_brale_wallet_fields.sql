-- Merchant Brale custody and provisioning lifecycle. Existing merchant data
-- and the existing unique brale_address_id column are preserved.
ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "brale_account_id" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "brale_wallet_id" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "blockchain_address" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "blockchain_network" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "wallet_provisioning_status" "wallet_provisioning_status" NOT NULL DEFAULT 'not_requested';--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "wallet_provisioning_error" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "wallet_provisioning_key" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "wallet_provisioned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchants_wallet_provisioning_status_idx" ON "merchants" ("wallet_provisioning_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchants_blockchain_network_idx" ON "merchants" ("blockchain_network");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "merchants_wallet_provisioning_key_unique"
  ON "merchants" ("wallet_provisioning_key")
  WHERE "wallet_provisioning_key" IS NOT NULL;
