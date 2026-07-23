-- Platform custody associates users with the configured platform Address, so
-- brale_address_id is no longer a per-user unique value. API v1 registration
-- does not require a club choice; onboarding may set it later.
DROP INDEX IF EXISTS "users_brale_address_id_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "primary_club_id" DROP NOT NULL;
