DO $$ BEGIN
  CREATE TYPE "wallet_transaction_status" AS ENUM ('pending', 'completed', 'failed', 'reversed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "wallet_transaction_type" AS ENUM ('top_up', 'send', 'receive', 'reward', 'redeem', 'merchant_payment', 'mint', 'burn', 'transfer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "roles" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL UNIQUE
);--> statement-breakpoint
INSERT INTO "roles" ("name") VALUES ('Fan'), ('Merchant') ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" text NOT NULL UNIQUE,
  "primary_club_id" text NOT NULL,
  "followed_club_ids" text DEFAULT '[]' NOT NULL,
  "zip" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "first_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rewlo_cash_balance" integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rewlo_reward_points" integer NOT NULL DEFAULT 0;--> statement-breakpoint
UPDATE "users" SET "role_id" = (SELECT "id" FROM "roles" WHERE "name" = 'Fan') WHERE "role_id" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role_id" SET DEFAULT 1;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "roles"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "merchants" (
  "id" serial PRIMARY KEY NOT NULL,
  "merchant_code" text NOT NULL UNIQUE,
  "merchant_name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "description" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "user_cards" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "card_holder" text NOT NULL,
  "last4_digits" text NOT NULL,
  "expiry" text NOT NULL,
  "card_type" text NOT NULL,
  "provider" text NOT NULL,
  "is_default" boolean NOT NULL DEFAULT false
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_cards_one_default_per_user" ON "user_cards" ("user_id") WHERE "is_default";--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "wallet_transactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "related_user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "merchant_id" integer REFERENCES "merchants"("id") ON DELETE SET NULL,
  "type" "wallet_transaction_type" NOT NULL,
  "status" "wallet_transaction_status" NOT NULL DEFAULT 'pending',
  "amount_cents" integer NOT NULL DEFAULT 0,
  "currency" text NOT NULL DEFAULT 'USD',
  "reward_points_delta" integer NOT NULL DEFAULT 0,
  "reference" text NOT NULL UNIQUE,
  "external_transaction_id" text,
  "blockchain_hash" text,
  "description" text,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_transactions_user_created_at_idx" ON "wallet_transactions" ("user_id", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_transactions_merchant_created_at_idx" ON "wallet_transactions" ("merchant_id", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_transactions_related_user_idx" ON "wallet_transactions" ("related_user_id");
