-- A Merchant JWT establishes a user identity, while this table establishes the
-- merchant data scope. APIs must resolve this mapping server-side.
DO $$ BEGIN
  CREATE TYPE "merchant_user_role" AS ENUM ('owner', 'admin', 'analyst', 'operator');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "merchant_user_status" AS ENUM ('active', 'invited', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "merchant_users" (
  "id" serial PRIMARY KEY,
  "merchant_id" integer NOT NULL REFERENCES "merchants"("id"),
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" "merchant_user_role" NOT NULL DEFAULT 'analyst',
  "status" "merchant_user_status" NOT NULL DEFAULT 'invited',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "merchant_users_merchant_user_unique" UNIQUE ("merchant_id", "user_id")
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchant_users_user_status_idx" ON "merchant_users" ("user_id", "status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchant_users_merchant_status_idx" ON "merchant_users" ("merchant_id", "status");
