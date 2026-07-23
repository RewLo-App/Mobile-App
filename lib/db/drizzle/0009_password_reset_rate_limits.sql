CREATE TABLE IF NOT EXISTS "password_reset_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "normalized_email" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "password_reset_requests_email_created_at_idx"
  ON "password_reset_requests" USING btree ("normalized_email", "created_at");
