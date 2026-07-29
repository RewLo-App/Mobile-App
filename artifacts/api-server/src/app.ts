import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import v1Router from "./routes/v1";
import { openApiDocument, swaggerUiHtml } from "./docs/openapi";
import { logger } from "./lib/logger";
import { registerMobileDeployment } from "./mobile-deployment";
import { WebhookHandlers } from "./webhookHandlers";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// Stripe webhook must receive the raw body for signature verification, so it
// is registered BEFORE express.json().
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }
    try {
      const sig = Array.isArray(signature) ? signature[0]! : signature;
      if (!Buffer.isBuffer(req.body)) {
        logger.error(
          "Stripe webhook body is not a Buffer — check middleware order",
        );
        res.status(500).json({ error: "Webhook processing error" });
        return;
      }
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error) {
      logger.error({ error }, "Stripe webhook processing failed");
      res.status(400).json({ error: "Webhook processing error" });
    }
  },
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple landing page after Stripe Checkout — the fan returns to the app to finish.
app.get("/api/stripe/return", (req, res) => {
  const ok = req.query["status"] === "success";
  res.type("html").send(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>RewLo Pay</title></head>
<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:90vh;text-align:center;background:#0B1220;color:#fff">
<div><div style="font-size:52px">${ok ? "✅" : "✖️"}</div>
<h2>${ok ? "Card payment received" : "Card payment cancelled"}</h2>
<p style="color:#94A3B8">Return to the RewLo app to ${ok ? "finish your payment." : "try again."}</p></div></body></html>`,
  );
});

app.get("/api-docs.json", (req, res) => res.json(openApiDocument(req)));
app.get("/api-docs", (_req, res) => res.type("html").send(swaggerUiHtml));
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "api-server",
  });
});
app.use("/api/v1", v1Router);
app.use("/api", (req, res) => {
  res.status(404).json({
    error: "API route not found",
    path: req.originalUrl.split("?")[0],
  });
});

// A production deployment exposes the merchant dashboard and API on one
// origin. API and documentation paths are resolved above; static assets and
// client-side dashboard routes are resolved from the Vite build below.
const merchantDashboardCandidates = [
  path.resolve(process.cwd(), "artifacts/merchant-dashboard/dist"),
  path.resolve(process.cwd(), "../merchant-dashboard/dist"),
  path.resolve(moduleDir, "../../merchant-dashboard/dist"),
];
const merchantCandidateWithIndex = merchantDashboardCandidates.find(
  (candidate) => existsSync(path.join(candidate, "index.html")),
);
const merchantDashboardDist =
  merchantCandidateWithIndex ??
  merchantDashboardCandidates.find((candidate) => existsSync(candidate)) ??
  merchantDashboardCandidates[0]!;
const merchantIndex = path.join(merchantDashboardDist, "index.html");
const merchantIndexExists = existsSync(merchantIndex);

logger.info(
  {
    merchantBuildPath: merchantDashboardDist,
    merchantIndexPath: merchantIndex,
    merchantIndexExists,
  },
  "Merchant deployment diagnostics",
);

if (merchantIndexExists) {
  app.get("/merchant", (_req, res) => {
    res.sendFile(merchantIndex);
  });
  app.use(
    "/merchant",
    express.static(merchantDashboardDist, { index: false, redirect: false }),
  );
  app.use("/merchant", (req, res, next) => {
    if (
      req.method !== "GET" ||
      path.extname(req.path) ||
      !req.accepts("html")
    ) {
      next();
      return;
    }
    res.sendFile(merchantIndex);
  });
} else {
  logger.warn(
    { checkedPaths: merchantDashboardCandidates },
    "Merchant dashboard build not found; /merchant routes will be unavailable",
  );
}

// Mobile owns the root deployment only after all API and merchant routes.
registerMobileDeployment(app);

export default app;
