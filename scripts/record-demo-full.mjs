// Records a full RewLo demo: account creation (Packers primary, Cardinals
// secondary), $50 top-up, home scroll (activity + club loyalty), rewards
// redemption, and agentic RewLo Pay checkout with points + RWLO cash.
// Runs strictly against the local dev API. Output: /tmp/demo/*.webm
import { chromium } from "playwright";

const BASE = `https://${process.env.REPLIT_EXPO_DEV_DOMAIN}`;
const EMAIL = process.env.DEMO_EMAIL || "sumit.singh@rewlo.io";
const PASSWORD = process.env.DEMO_PASSWORD || "123456789";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (!apiUrl) {
  console.error("FLOW_ERROR: EXPO_PUBLIC_API_URL is not set; refusing to run.");
  process.exit(1);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const context = await browser.newContext({
  viewport: { width: 402, height: 874 },
  recordVideo: { dir: "/tmp/demo", size: { width: 402, height: 874 } },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

// Reroute the bundle's production API origin to the local dev API; block any
// other .replit.app request so production can never be touched.
const prodOrigin = new URL(apiUrl).origin;
// Register the blanket .replit.app block FIRST — Playwright matches routes in
// reverse registration order, so the rewrite below takes precedence for the
// API origin while everything else .replit.app is aborted.
await context.route(/https:\/\/[^/]*\.replit\.app\//, (route) => route.abort());
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

const scroll = async (dy, steps = 8, delay = 120) => {
  for (let k = 0; k < steps; k++) {
    await page.mouse.wheel(0, dy / steps);
    await pause(delay);
  }
};

try {
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });
  await pause(2500);

  // ── Onboarding step 1: primary team = Packers (NFL tab is default)
  await page.getByText("Pick your team").waitFor({ timeout: 30000 });
  await pause(1200);
  await page.getByText("Packers", { exact: true }).first().click();
  await pause(1400);
  await page.getByText("Continue", { exact: true }).click();
  await pause(1500);

  // ── Step 2: follows other teams → Yes → Cardinals
  await page.getByText("Other teams?").waitFor({ timeout: 15000 });
  await page.getByText("Yes", { exact: true }).click();
  await pause(1200);
  await page.getByText("Cardinals", { exact: true }).first().click();
  await pause(1400);
  await page.getByText("Continue", { exact: true }).click();
  await pause(1500);

  // ── Step 3: account details
  await page.getByText("Create your account").waitFor({ timeout: 15000 });
  await pause(800);
  const type = async (ph, text) => {
    await page.getByPlaceholder(ph).click();
    await page.getByPlaceholder(ph).pressSequentially(text, { delay: 55 });
    await pause(350);
  };
  await type("First name", "Sumit");
  await type("Last name", "Singh");
  await type("you@example.com", EMAIL);
  await type("Min. 6 characters", PASSWORD);
  await type("e.g. 90210", "54301"); // Green Bay, WI
  await pause(600);
  await page.getByText("Create Account", { exact: true }).click();

  // ── Home
  await page.getByText("Total Balance").waitFor({ timeout: 60000 });
  await pause(3000);

  // ── Top up $50
  await page.getByText("Top Up", { exact: true }).first().click();
  await page.getByText("Choose debit card").waitFor({ timeout: 30000 });
  await pause(1500);
  await page.getByText("$50", { exact: true }).first().click();
  await pause(1200);
  await page.getByText("Continue", { exact: true }).click();
  await pause(1500);
  await page.getByText(/^Confirm \$/).click();
  await page.getByText("Wallet topped up").waitFor({ timeout: 30000 });
  await pause(2500);
  await page.getByText("Done", { exact: true }).click();
  await page.getByText("Total Balance").waitFor({ timeout: 30000 });
  await pause(2000);

  // ── Scroll home: activity + club loyalty (primary club)
  await page.mouse.move(201, 500);
  await scroll(900);
  await pause(1800);
  await scroll(700);
  await pause(2000);
  await scroll(-1600, 10);
  await pause(1800);

  // ── Rewards page: cardholder offers under the club
  await page.getByText("Rewards", { exact: true }).last().click();
  await page.getByText("Rewlo Points").first().waitFor({ timeout: 30000 });
  await pause(2200);
  await page.mouse.move(201, 500);
  await scroll(900);
  await pause(1800);
  await scroll(500);
  await pause(1500);

  // Redeem the first affordable offer
  const redeemBtn = page.getByText("Redeem with Rewlo", { exact: true }).first();
  await redeemBtn.scrollIntoViewIfNeeded();
  await pause(1200);
  await redeemBtn.click();
  await page.getByText("REDEEMED").first().waitFor({ timeout: 30000 });
  await pause(2500);

  // ── RewLo Pay agentic checkout
  await page.getByText("Home", { exact: true }).last().click();
  await page.getByText("Total Balance").waitFor({ timeout: 30000 });
  await pause(1500);
  await page.getByText("RewLo Pay", { exact: true }).first().click();
  await page.getByText("AGENTIC CHECKOUT").waitFor({ timeout: 30000 });
  await pause(2500);

  await page.getByPlaceholder("e.g. MAN001").click();
  await page.getByPlaceholder("e.g. MAN001").pressSequentially("GBP001", { delay: 80 });
  await pause(600);
  await page.getByText("Find Merchant", { exact: true }).click();
  await pause(2000);
  await page.getByPlaceholder("0.00").click();
  await page.getByPlaceholder("0.00").pressSequentially("30", { delay: 120 });
  await pause(800);
  await page.getByText("Review Payment", { exact: true }).click();
  await page.getByText("Smart split").waitFor({ timeout: 30000 });
  await pause(3000);
  await page.getByText(/^Approve & Pay \$/).click();
  await page.getByText(/Payment complete|Paid|success/i).first().waitFor({ timeout: 45000 }).catch(() => {});
  await pause(3000);
  const done = page.getByText("Done", { exact: true }).first();
  if (await done.isVisible().catch(() => false)) {
    await done.click();
    await pause(2500);
  }
  console.log("FLOW_OK");
} catch (e) {
  console.error("FLOW_ERROR:", e.message);
  await page.screenshot({ path: "/tmp/demo/fail.png" }).catch(() => {});
} finally {
  await context.close();
  await browser.close();
}
