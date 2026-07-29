import type { Express, Request, Response } from "express";
import express from "express";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { logger } from "./lib/logger";

const RESERVED_PREFIXES = ["/api", "/merchant"];
const moduleDir = path.dirname(fileURLToPath(import.meta.url));

function isReservedPath(requestPath: string): boolean {
  return RESERVED_PREFIXES.some(
    (prefix) => requestPath === prefix || requestPath.startsWith(`${prefix}/`),
  );
}

function getForwardedValue(req: Request, header: string): string | undefined {
  return req.get(header)?.split(",", 1)[0]?.trim() || undefined;
}

function renderLandingPage(
  req: Request,
  template: string,
  appName: string,
): string {
  const protocol = getForwardedValue(req, "x-forwarded-proto") || req.protocol;
  const host =
    getForwardedValue(req, "x-forwarded-host") ||
    req.get("host") ||
    "localhost";
  const baseUrl = `${protocol}://${host}`;

  return template
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, host)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);
}

function sendManifest(buildRoot: string, platform: string, res: Response) {
  const manifestPath = path.join(buildRoot, platform, "manifest.json");

  if (!existsSync(manifestPath)) {
    res
      .status(404)
      .json({ error: `Manifest not found for platform: ${platform}` });
    return;
  }

  res.set({
    "expo-protocol-version": "1",
    "expo-sfv-version": "0",
  });
  res.sendFile(manifestPath);
}

function getAppName(mobileRoot: string): string {
  try {
    const appJson = JSON.parse(
      readFileSync(path.join(mobileRoot, "app.json"), "utf8"),
    ) as { expo?: { name?: string } };
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

export function registerMobileDeployment(app: Express): void {
  const buildCandidates = [
    path.resolve(process.cwd(), "artifacts/mobile/static-build"),
    path.resolve(process.cwd(), "../mobile/static-build"),
    path.resolve(moduleDir, "../../mobile/static-build"),
  ];
  const existingBuildRoot = buildCandidates.find((candidate) =>
    existsSync(candidate),
  );
  const buildRoot = existingBuildRoot ?? buildCandidates[0]!;
  const mobileRoot = path.dirname(buildRoot);
  const templateRoot = path.join(mobileRoot, "server", "templates");
  const landingPagePath = path.join(templateRoot, "landing-page.html");
  const supportPagePath = path.join(templateRoot, "support.html");
  const mobileBuildExists = Boolean(existingBuildRoot);
  const mobileLandingPageExists = existsSync(landingPagePath);

  logger.info(
    {
      mobileBuildPath: buildRoot,
      mobileBuildExists,
      mobileLandingPagePath: landingPagePath,
      mobileLandingPageExists,
    },
    "Mobile deployment diagnostics",
  );

  if (!mobileBuildExists) {
    logger.warn(
      { checkedPaths: buildCandidates },
      "Mobile production build not found; root mobile routes will be unavailable",
    );
    return;
  }

  const landingPageTemplate = mobileLandingPageExists
    ? readFileSync(landingPagePath, "utf8")
    : null;
  const appName = getAppName(mobileRoot);

  if (!landingPageTemplate) {
    logger.warn(
      { landingPagePath },
      "Mobile landing page template not found; GET / will be unavailable",
    );
  }

  app.get(["/", "/manifest"], (req, res, next) => {
    const platform = req.get("expo-platform");
    if (platform === "ios" || platform === "android") {
      sendManifest(buildRoot, platform, res);
      return;
    }

    if (req.path === "/" && landingPageTemplate) {
      res
        .type("html")
        .send(renderLandingPage(req, landingPageTemplate, appName));
      return;
    }

    next();
  });

  if (existsSync(supportPagePath)) {
    app.get(["/support", "/support.html"], (_req, res) => {
      res.sendFile(supportPagePath);
    });
  }

  const mobileStatic = express.static(buildRoot, {
    dotfiles: "allow",
    index: false,
    redirect: false,
  });
  app.use((req, res, next) => {
    if (isReservedPath(req.path)) {
      next();
      return;
    }
    mobileStatic(req, res, next);
  });
}
