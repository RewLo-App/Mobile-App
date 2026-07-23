ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "brale_wallet_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "wallet_provisioning_key" text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "wallet_provisioning_key" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_wallet_provisioning_key_unique"
  ON "users" USING btree ("wallet_provisioning_key")
  WHERE "wallet_provisioning_key" IS NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TYPE "wallet_provisioning_status" ADD VALUE IF NOT EXISTS 'completed';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
