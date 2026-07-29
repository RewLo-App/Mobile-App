// Records a demo video of the RewLo sign-in and top-up flows against the
// Expo web build. Output: /tmp/demo/raw.webm (converted to mp4 afterwards).
import { chromium } from "playwright";

const BASE = `https://${process.env.REPLIT_EXPO_DEV_DOMAIN}`;
const EMAIL = process.env.DEMO_EMAIL;
const PASSWORD = process.env.DEMO_PASSWORD;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const context = await browser.newContext({
  viewport: { width: 402, height: 874 },
  recordVideo: { dir: "/tmp/demo", size: { width: 402, height: 874 } },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

// The web bundle targets the production API; reroute those calls to the local
// dev API so the demo uses the development database, never production.
// Fail closed: refuse to run without the env var, and abort any API-looking
// request that would leave the dev environment.
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (!apiUrl) {
  console.error("FLOW_ERROR: EXPO_PUBLIC_API_URL is not set; refusing to run.");
  await browser.close();
  process.exit(1);
}
const prodOrigin = new URL(apiUrl).origin;
await context.route(`${prodOrigin}/**`, async (route) => {
  const req = route.request();
  const target = req.url().replace(prodOrigin, "http://localhost:80");
  const resp = await context.request.fetch(target, {
    method: req.method(),
    headers: { ...req.headers(), host: "localhost" },
    data: req.postDataBuffer() ?? undefined,
  });
  await route.fulfill({ response: resp });
});
// Safety net: block any other request to a production .replit.app host.
await context.route(/https:\/\/[^/]*\.replit\.app\//, (route) => route.abort());

try {
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });
  await pause(2500);

  // Onboarding shows "Sign in" link for existing accounts.
  const signInLink = page.getByText("Sign in", { exact: true }).first();
  await signInLink.waitFor({ timeout: 30000 });
  await pause(1000);
  await signInLink.click();
  await pause(2000);

  // Sign-in form
  await page.getByPlaceholder("Email address").click();
  await page.getByPlaceholder("Email address").pressSequentially(EMAIL, { delay: 60 });
  await pause(500);
  await page.getByPlaceholder("Password").click();
  await page.getByPlaceholder("Password").pressSequentially(PASSWORD, { delay: 60 });
  await pause(800);
  await page.getByText("Sign In", { exact: true }).click();

  // Wait for home (balance card shows "Total Balance")
  await page.getByText("Total Balance").waitFor({ timeout: 60000 });
  await pause(3000);

  // Top Up flow from the quick actions
  await page.getByText("Top Up", { exact: true }).first().click();
  await page.getByText("Choose debit card").waitFor({ timeout: 30000 });
  await pause(1500);

  // Enter amount: tap a preset if present, else type
  const preset = page.getByText("$50", { exact: true }).first();
  if (await preset.isVisible().catch(() => false)) {
    await preset.click();
  } else {
    await page.getByPlaceholder("0.00").pressSequentially("50", { delay: 100 });
  }
  await pause(1200);
  await page.getByText(/^Review|^Continue|^Confirm/).first().click();
  await pause(1500);
  const confirmBtn = page.getByText(/^Confirm \$/).first();
  if (await confirmBtn.isVisible().catch(() => false)) {
    await confirmBtn.click();
  }
  await pause(3000);
  // Success state / Done
  const done = page.getByText("Done", { exact: true }).first();
  if (await done.isVisible().catch(() => false)) {
    await pause(1500);
    await done.click();
  }
  await pause(2500);
  console.log("FLOW_OK");
} catch (e) {
  console.error("FLOW_ERROR:", e.message);
  await page.screenshot({ path: "/tmp/demo/fail.png" }).catch(() => {});
} finally {
  await context.close(); // flushes the video
  await browser.close();
}
