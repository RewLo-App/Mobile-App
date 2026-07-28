-- Legacy seed data used MANC001 (seven characters). The public merchant code
-- is now six characters everywhere, so preserve the same merchant as MAN001.
UPDATE "merchants" SET "merchant_code" = 'MAN001' WHERE "merchant_code" = 'MANC001';

DO $$ BEGIN
  ALTER TABLE "merchants"
    ADD CONSTRAINT "merchants_code_format"
    CHECK ("merchant_code" ~ '^[A-Z0-9]{6}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
