-- Prerequisite: run `pnpm db:reset-auth-data` against development data before
-- applying this migration. This migration intentionally never deletes users.

INSERT INTO "roles" ("name") VALUES ('Fan'), ('Merchant') ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "user_status" AS ENUM ('active', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "wallet_provisioning_status" AS ENUM ('not_requested', 'pending', 'provisioned', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

ALTER TABLE "users" RENAME COLUMN "zip" TO "zip_code";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "rewlo_reward_points" TO "rewlo_points";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "normalized_email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" "user_status" NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "brale_account_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "blockchain_address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "blockchain_network" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wallet_provisioning_status" "wallet_provisioning_status" NOT NULL DEFAULT 'not_requested';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wallet_provisioning_error" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wallet_provisioned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp with time zone NOT NULL DEFAULT now();--> statement-breakpoint

-- These fields are required for credential-based registration. The reset step
-- above leaves the table empty, so no placeholder credentials are introduced.
ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "zip_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "normalized_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "rewlo_points" SET DEFAULT 2350;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role_id" DROP DEFAULT;--> statement-breakpoint

CREATE UNIQUE INDEX "users_normalized_email_unique" ON "users" USING btree ("normalized_email");--> statement-breakpoint
CREATE INDEX "users_role_id_idx" ON "users" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "users_wallet_provisioning_status_idx" ON "users" USING btree ("wallet_provisioning_status");--> statement-breakpoint
CREATE INDEX "users_blockchain_network_idx" ON "users" USING btree ("blockchain_network");--> statement-breakpoint

INSERT INTO "app_settings" ("key", "value") VALUES ('welcome_points', '2350')
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value";
