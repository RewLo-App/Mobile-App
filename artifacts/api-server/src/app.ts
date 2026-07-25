import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import v1Router from "./routes/v1";
import { openApiDocument, swaggerUiHtml } from "./docs/openapi";
import { logger } from "./lib/logger";

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api-docs.json", (req, res) => res.json(openApiDocument(req)));
app.get("/api-docs", (_req, res) => res.type("html").send(swaggerUiHtml));
app.use("/api/v1", v1Router);

export default app;
