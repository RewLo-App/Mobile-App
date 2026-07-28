---
name: Stripe connector quirks
description: Non-obvious behaviors of the Replit Stripe connection + stripe-replit-sync in this project
---

- The Replit connection API returns Stripe credentials under `settings.secret` / `settings.publishable` — NOT `secret_key` as the standard template assumes. stripeClient.ts accepts both.
  **Why:** startup failed with "missing secret key" until the key names were inspected via the connectors endpoint.
  **How to apply:** if Stripe auth mysteriously fails, dump `Object.keys(settings)` from the connection API before assuming the integration is broken.
- `runMigrations` from stripe-replit-sync takes only `{ databaseUrl }` (no `schema` option), and on first run it may need to be executed once manually (`node -e` with dynamic import) if the in-app background init raced; tables land in the `stripe` schema automatically.
- Card-assisted RewLo Pay checkout freezes the points/cash split in Checkout Session metadata; settlement (`/wallet/stripe-checkout-complete`) locks the user row before the idempotency check and auto-refunds the card charge if the wallet split is no longer satisfiable.
