ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "brale_address_id" text;
CREATE UNIQUE INDEX IF NOT EXISTS "users_brale_address_id_unique" ON "users" ("brale_address_id");
