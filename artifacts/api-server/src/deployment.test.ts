import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

const originalCwd = process.cwd();
let fixtureRoot = "";
let server: Server | undefined;
let baseUrl = "";

function writeFixture(relativePath: string, content: string): void {
  const target = path.join(fixtureRoot, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
}

async function request(requestPath: string): Promise<Response> {
  return fetch(`${baseUrl}${requestPath}`, {
    headers: {
      accept: "text/html,application/json",
    },
  });
}

before(async () => {
  fixtureRoot = mkdtempSync(path.join(tmpdir(), "rewlo-deployment-test-"));

  writeFixture(
    "artifacts/merchant-dashboard/dist/index.html",
    "<!doctype html><html><body>MERCHANT_FIXTURE</body></html>",
  );
  writeFixture(
    "artifacts/merchant-dashboard/dist/assets/app.js",
    "globalThis.MERCHANT_ASSET = true;",
  );
  mkdirSync(path.join(fixtureRoot, "artifacts/mobile/static-build"), {
    recursive: true,
  });
  writeFixture(
    "artifacts/mobile/server/templates/landing-page.html",
    "<!doctype html><html><body>MOBILE_FIXTURE APP_NAME_PLACEHOLDER BASE_URL_PLACEHOLDER</body></html>",
  );
  writeFixture(
    "artifacts/mobile/app.json",
    JSON.stringify({ expo: { name: "Test Mobile App" } }),
  );

  process.env["DATABASE_URL"] =
    "postgresql://test:test@127.0.0.1:1/deployment_test";
  process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"] = "https://example.invalid/v1";
  process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] = "deployment-test";
  process.chdir(fixtureRoot);

  const { default: app } = await import("./app");

  const listeningServer = await new Promise<Server>((resolve, reject) => {
    const candidate = app.listen(0, "127.0.0.1", () => resolve(candidate));
    candidate.once("error", reject);
  });
  server = listeningServer;

  const address = listeningServer.address();
  assert(address && typeof address === "object");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server!.close((error) => (error ? reject(error) : resolve()));
    });
  }
  process.chdir(originalCwd);
  rmSync(fixtureRoot, { recursive: true, force: true });
});

test("health endpoint returns JSON with HTTP 200", async () => {
  const response = await request("/api/health");

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /application\/json/);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "api-server",
  });
});

test("merchant root returns the merchant HTML", async () => {
  const response = await request("/merchant");

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);
  assert.match(await response.text(), /MERCHANT_FIXTURE/);
});

test("merchant nested routes use the SPA fallback", async () => {
  const response = await request("/merchant/dashboard");

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);
  assert.match(await response.text(), /MERCHANT_FIXTURE/);
});

test("merchant assets are served by static hosting, not the API", async () => {
  const response = await request("/merchant/assets/app.js");

  assert.equal(response.status, 200);
  assert.doesNotMatch(
    response.headers.get("content-type") ?? "",
    /application\/json/,
  );
  assert.match(await response.text(), /MERCHANT_ASSET/);
});

test("unknown API routes return a JSON 404", async () => {
  for (const requestPath of ["/api/not-real", "/api/v1/not-real"]) {
    const response = await request(requestPath);

    assert.equal(response.status, 404);
    assert.match(
      response.headers.get("content-type") ?? "",
      /application\/json/,
    );
    assert.deepEqual(await response.json(), {
      error: "API route not found",
      path: requestPath,
    });
  }
});

test("root returns the mobile landing page", async () => {
  const response = await request("/");

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);
  const body = await response.text();
  assert.match(body, /MOBILE_FIXTURE/);
  assert.match(body, /Test Mobile App/);
  assert.doesNotMatch(body, /BASE_URL_PLACEHOLDER|APP_NAME_PLACEHOLDER/);
});
