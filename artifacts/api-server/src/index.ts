import app from "./app";
import { ensureReferenceData } from "./bootstrap";
import { logger } from "./lib/logger";
import { validateAuthTokenEnvironment } from "./services/auth-token-service";
import BraleService from "./services/brale-service";

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

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
