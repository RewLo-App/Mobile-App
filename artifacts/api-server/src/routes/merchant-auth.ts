import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { Router } from "express";
import { eq, like } from "drizzle-orm";
import { db, merchantsTable, merchantUsersTable, rolesTable, usersTable } from "@workspace/db";
import BraleService, { BraleApiError } from "../services/brale-service";
import { issueAuthTokenPair } from "../services/auth-token-service";

const router = Router();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

function codePrefix(name: string) {
  const letters = name.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return (letters.slice(0, 3) || "MER").padEnd(3, "X");
}

/** Six-character, uppercase alphanumeric code; e.g. Liverpool FC -> LIV001. */
async function nextMerchantCode(name: string) {
  const prefix = codePrefix(name);
  const matching = await db.select({ merchantCode: merchantsTable.merchantCode }).from(merchantsTable)
    .where(like(merchantsTable.merchantCode, `${prefix}%`));
  const used = new Set(matching.map((merchant) => merchant.merchantCode));
  for (let value = 1; value < 36 ** 3; value += 1) {
    const code = `${prefix}${value.toString(36).toUpperCase().padStart(3, "0")}`;
    if (!used.has(code)) return code;
  }
  throw new Error("MERCHANT_CODE_SPACE_EXHAUSTED");
}

router.post("/merchant-auth/register", async (req, res) => {
  const merchantName = typeof req.body?.merchantName === "string" ? req.body.merchantName.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!merchantName || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    res.status(400).json({ error: "Merchant name, a valid email, and a password of at least 8 characters are required." });
    return;
  }

  const [existingUser] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.normalizedEmail, email)).limit(1);
  if (existingUser) { res.status(409).json({ error: "An account with this email already exists. Please sign in." }); return; }
  const [existingMerchant] = await db.select({ id: merchantsTable.id, merchantCode: merchantsTable.merchantCode, merchantName: merchantsTable.merchantName }).from(merchantsTable).where(eq(merchantsTable.email, email)).limit(1);
  // Development fixtures, including LIV001, can be activated by registering
  // with their configured merchant email and exact merchant name. Production
  // onboarding should put email verification in front of this ownership claim.
  if (existingMerchant) {
    if (existingMerchant.merchantName.toLocaleLowerCase() !== merchantName.toLocaleLowerCase()) { res.status(409).json({ error: "A merchant with this email already exists. Please sign in." }); return; }
    const [role] = await db.select({ id: rolesTable.id }).from(rolesTable).where(eq(rolesTable.name, "Merchant")).limit(1);
    if (!role) { res.status(500).json({ error: "Merchant role is not configured." }); return; }
    const [user] = await db.transaction(async (tx) => {
      const [createdUser] = await tx.insert(usersTable).values({ email, normalizedEmail: email, firstName: merchantName, lastName: "", zipCode: "00000", passwordHash: hashPassword(password), roleId: role.id, rewloPoints: 0, walletProvisioningStatus: "completed" }).returning();
      await tx.insert(merchantUsersTable).values({ merchantId: existingMerchant.id, userId: createdUser.id, role: "owner", status: "active" });
      return [createdUser];
    });
    const tokens = await issueAuthTokenPair(user.id, "Merchant");
    res.status(201).json({ merchant: { code: existingMerchant.merchantCode, name: existingMerchant.merchantName }, tokens });
    return;
  }

  let created: { userId: number; merchantId: number; merchantCode: string };
  try {
    created = await db.transaction(async (tx) => {
      const [role] = await tx.select({ id: rolesTable.id }).from(rolesTable).where(eq(rolesTable.name, "Merchant")).limit(1);
      if (!role) throw new Error("MERCHANT_ROLE_MISSING");
      const merchantCode = await nextMerchantCode(merchantName);
      const [merchant] = await tx.insert(merchantsTable).values({ merchantCode, merchantName, email, description: "Merchant account created through the Rewlo Merchant dashboard.", walletProvisioningStatus: "pending", walletProvisioningKey: randomUUID() }).returning();
      const [user] = await tx.insert(usersTable).values({ email, normalizedEmail: email, firstName: merchantName, lastName: "", zipCode: "00000", passwordHash: hashPassword(password), roleId: role.id, rewloPoints: 0, walletProvisioningStatus: "completed" }).returning();
      await tx.insert(merchantUsersTable).values({ merchantId: merchant.id, userId: user.id, role: "owner", status: "active" });
      return { userId: user.id, merchantId: merchant.id, merchantCode };
    });
  } catch (error) {
    req.log.error({ err: error, requestId: req.id }, "Merchant registration creation failed");
    res.status(500).json({ error: "Merchant registration could not be completed." });
    return;
  }

  try {
    const [merchant] = await db.select().from(merchantsTable).where(eq(merchantsTable.id, created.merchantId)).limit(1);
    const wallet = await new BraleService().provisionManagedWallet({ firstName: merchantName, lastName: "", email, zipCode: "00000", idempotencyKey: merchant!.walletProvisioningKey!, existingAccountId: merchant!.braleAccountId });
    await db.update(merchantsTable).set({ ...wallet, walletProvisioningStatus: "completed", walletProvisioningError: null, walletProvisionedAt: new Date() }).where(eq(merchantsTable.id, created.merchantId));
  } catch (error) {
    const code = error instanceof BraleApiError ? error.code : "provider_unavailable";
    await db.update(merchantsTable).set({ walletProvisioningStatus: "failed", walletProvisioningError: code }).where(eq(merchantsTable.id, created.merchantId));
    req.log.warn({ err: error, requestId: req.id, merchantId: created.merchantId }, "Merchant wallet provisioning failed");
    res.status(503).json({ error: "Merchant account was created, but wallet provisioning is unavailable. Please contact support to retry provisioning." });
    return;
  }
  const tokens = await issueAuthTokenPair(created.userId, "Merchant");
  res.status(201).json({ merchant: { code: created.merchantCode, name: merchantName }, tokens });
});

export default router;
