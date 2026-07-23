CREATE TABLE IF NOT EXISTS "revoked_access_tokens" (
  "id" serial PRIMARY KEY NOT NULL,
  "token_id" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "revoked_access_tokens_token_id_unique" ON "revoked_access_tokens" USING btree ("token_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revoked_access_tokens_expires_at_idx" ON "revoked_access_tokens" USING btree ("expires_at");
