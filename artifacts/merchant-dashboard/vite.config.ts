import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function redirectMerchantBase(): Plugin {
  const redirect = (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const url = req.url || "";
    if (
      (req.method === "GET" || req.method === "HEAD")
      && (url === "/merchant" || url.startsWith("/merchant?"))
    ) {
      res.statusCode = 308;
      res.setHeader("Location", `/merchant/${url.slice("/merchant".length)}`);
      res.end();
      return;
    }
    next();
  };

  return {
    name: "redirect-merchant-base",
    configureServer(server) {
      server.middlewares.use(redirect);
    },
    configurePreviewServer(server) {
      server.middlewares.use(redirect);
    },
  };
}

export default defineConfig({
  base: "/merchant/",
  plugins: [redirectMerchantBase(), react()],
  server: { port: 5174, host: "0.0.0.0" },
  preview: { port: 5174, host: "0.0.0.0" },
});
