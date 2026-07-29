import { runMigrations } from "stripe-replit-sync";
import app from "./app";
import { ensureReferenceData } from "./bootstrap";
import { getStripeSync } from "./stripeClient";
import { logger } from "./lib/logger";
import { validateAuthTokenEnvironment } from "./services/auth-token-service";
import BraleService from "./services/brale-service";
import { startAssistantScheduler } from "./services/assistant-scheduler";

BraleService.validateEnvironment();
validateAuthTokenEnvironment();

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Runs in the background so a slow database never blocks the port opening.
ensureReferenceData().catch((err: unknown) => {
  logger.error({ err }, "Reference data bootstrap failed — registration may not work until resolved");
});

/**
 * Stripe startup: migrations create the `stripe` schema, then a managed
 * webhook keeps synced data fresh and syncBackfill pulls existing data.
 * Runs in the background so a slow Stripe/API call never blocks the port.
 */
async function initStripe() {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) throw new Error("DATABASE_URL is required for Stripe integration");

  await runMigrations({ databaseUrl });
  const stripeSync = await getStripeSync();

  const webhookBaseUrl = `https://${process.env["REPLIT_DOMAINS"]?.split(",")[0]}`;
  await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
  logger.info("Stripe managed webhook configured");

  await stripeSync.syncBackfill();
  logger.info("Stripe data synced");
}

initStripe().catch((err: unknown) => {
  logger.error({ err }, "Stripe initialization failed — Stripe checkout will not work until resolved");
});

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  startAssistantScheduler();
});
