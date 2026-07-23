import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { db, passwordResetRequestsTable, passwordResetTokensTable, refreshTokensTable, rewardTransactionsTable, rolesTable, usersTable } from "@workspace/db";
import { and, count, eq, gt, isNull } from "drizzle-orm";
import { getRefreshTokenUser, issueAuthTokenPair, revokeAccessToken, revokeRefreshToken, rotateRefreshToken } from "../services/auth-token-service";
import BraleService, { BraleApiError } from "../services/brale-service";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();
const welcomePoints = 2_350;
const allowedFields = new Set(["firstName", "lastName", "email", "password", "zipCode"]);
// Local-development escape hatch. Keep this disabled outside local testing.
const allowUnprovisionedRegistration = process.env["ALLOW_UNPROVISIONED_REGISTRATION"] === "true";

function passwordIsValid(password: string) {
  return password.length >= 12
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

function passwordMatches(password: string, storedHash: string) {
  const [algorithm, salt, digest] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !digest) return false;
  const expected = Buffer.from(digest, "hex");
  const candidate = scryptSync(password, salt, expected.length);
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

function resetTokenHash(token: string) {
  const secret = process.env["AUTH_ACCESS_TOKEN_SECRET"]!;
  return createHmac("sha256", secret).update(`password-reset:${token}`).digest("hex");
}
const resetResponse = { message: "If an account exists for that email, password reset instructions will be sent." };

router.post("/v1/auth/register", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  if (Object.keys(body).some((field) => !allowedFields.has(field))) {
    res.status(400).json({ error: "Role, points, and wallet fields are assigned by the server." });
    return;
  }

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const submittedEmail = typeof body.email === "string" ? body.email.trim() : "";
  const normalizedEmail = submittedEmail.toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const zipCode = typeof body.zipCode === "string" ? body.zipCode.trim() : "";
  if (!firstName || !lastName || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || !passwordIsValid(password) || !zipCode) {
    res.status(400).json({ error: "firstName, lastName, a valid email, a strong password, and zipCode are required." });
    return;
  }

  let user = await db.select().from(usersTable).where(eq(usersTable.normalizedEmail, normalizedEmail)).limit(1).then((rows) => rows[0]);
  if (user?.walletProvisioningStatus === "completed" || user?.walletProvisioningStatus === "provisioned") {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }
  if (user && !passwordMatches(password, user.passwordHash)) {
    res.status(409).json({ error: "Registration cannot be completed." });
    return;
  }

  try {
    if (!user) {
      const [fanRole] = await db.select({ id: rolesTable.id }).from(rolesTable).where(eq(rolesTable.name, "Fan")).limit(1);
      if (!fanRole) throw new Error("FAN_ROLE_MISSING");
      [user] = await db.transaction(async (tx) => {
        const [created] = await tx.insert(usersTable).values({
          firstName,
          lastName,
          // Email is the canonical, lower-case login identity everywhere.
          email: normalizedEmail,
          normalizedEmail,
          passwordHash: hashPassword(password),
          zipCode,
          roleId: fanRole.id,
          rewloPoints: welcomePoints,
          walletProvisioningStatus: "pending",
          walletProvisioningKey: randomUUID(),
        }).returning();
        await tx.insert(rewardTransactionsTable).values({
          userId: created.id,
          pointsDelta: welcomePoints,
          reason: "Welcome bonus",
          reference: `WELCOME-${created.id}`,
        });
        return [created];
      });
    } else {
      [user] = await db.update(usersTable).set({
        firstName,
        lastName,
        zipCode,
        walletProvisioningStatus: "pending",
        walletProvisioningError: null,
        walletProvisioningKey: user.walletProvisioningKey ?? randomUUID(),
      }).where(eq(usersTable.id, user.id)).returning();
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    req.log.error({ err: error, requestId: req.id }, "Registration user creation failed");
    res.status(500).json({ error: "Registration could not be completed." });
    return;
  }

  try {
    // Fans are recorded in RewLo's internal ledger. They do not receive a
    // separate Brale account or wallet: Brale custody belongs to the approved
    // RewLo business account. Resolve its compatible Solana address and keep
    // that platform-custody reference with the fan record for wallet actions.
    const wallet = await new BraleService().getPlatformCustodialAddress();
    [user] = await db.update(usersTable).set({
      ...wallet,
      braleWalletId: wallet.braleAddressId,
      walletProvisioningStatus: "completed",
      walletProvisioningError: null,
      walletProvisionedAt: new Date(),
    }).where(eq(usersTable.id, user.id)).returning();
  } catch (error) {
    const provisioningError = error instanceof BraleApiError ? error.code : "provider_unavailable";
    [user] = await db.update(usersTable).set({
      walletProvisioningStatus: "failed",
      walletProvisioningError: provisioningError,
    }).where(eq(usersTable.id, user.id)).returning();
    req.log.warn({ requestId: req.id, code: provisioningError }, "Wallet provisioning failed");
    if (!allowUnprovisionedRegistration) {
      res.status(503).json({ error: "Wallet provisioning is temporarily unavailable. Please retry registration." });
      return;
    }
  }

  try {
    const tokens = await issueAuthTokenPair(user.id, "Fan");
    res.status(201).json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        rewloPoints: user.rewloPoints,
        status: user.status,
        walletProvisioningStatus: user.walletProvisioningStatus,
      },
      tokens,
    });
  } catch (error) {
    req.log.error({ err: error, requestId: req.id }, "Registration token issuance failed");
    res.status(500).json({ error: "Account provisioned but authentication could not be completed. Please sign in." });
  }
});

router.post("/v1/auth/login", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const invalid = () => res.status(401).json({ error: "Invalid email or password." });
  if (!email || !password) { invalid(); return; }
  const [user] = await db.select({
    id: usersTable.id, passwordHash: usersTable.passwordHash, status: usersTable.status,
    walletStatus: usersTable.walletProvisioningStatus, role: rolesTable.name,
  }).from(usersTable).innerJoin(rolesTable, eq(usersTable.roleId, rolesTable.id)).where(eq(usersTable.normalizedEmail, email)).limit(1);
  if (!user || !passwordMatches(password, user.passwordHash) || user.status !== "active" || (user.walletStatus !== "completed" && user.walletStatus !== "provisioned")) { invalid(); return; }
  const tokens = await issueAuthTokenPair(user.id, user.role);
  res.json({ tokens });
});

router.post("/v1/auth/forgot-password", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  // Always record the attempt and return the identical response, including for
  // malformed/unknown addresses, to avoid account enumeration.
  const cutoff = new Date(Date.now() - 60 * 60 * 1000);
  const [recent] = await db.select({ total: count() }).from(passwordResetRequestsTable)
    .where(and(eq(passwordResetRequestsTable.normalizedEmail, email), gt(passwordResetRequestsTable.createdAt, cutoff)));
  await db.insert(passwordResetRequestsTable).values({ normalizedEmail: email });
  if (!email || recent.total >= 3) { res.status(202).json(resetResponse); return; }

  const [user] = await db.select({ id: usersTable.id, email: usersTable.email }).from(usersTable)
    .where(eq(usersTable.normalizedEmail, email)).limit(1);
  if (!user) { res.status(202).json(resetResponse); return; }

  const token = randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await db.transaction(async (tx) => {
    // A newer request supersedes earlier reset links for the same account.
    await tx.update(passwordResetTokensTable).set({ usedAt: new Date() })
      .where(and(eq(passwordResetTokensTable.userId, user.id), isNull(passwordResetTokensTable.usedAt)));
    await tx.insert(passwordResetTokensTable).values({ userId: user.id, tokenHash: resetTokenHash(token), expiresAt });
  });

  const resetUrl = `${process.env["PASSWORD_RESET_URL"] ?? "http://localhost:3001/reset-password"}?token=${encodeURIComponent(token)}`;
  if (process.env["RESET_EMAIL_FROM"]) {
    try {
      const connectors = new ReplitConnectors();
      const response = await connectors.proxy("resend", "/emails", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env["RESET_EMAIL_FROM"], to: [user.email], subject: "Reset your RewLo password", text: `Reset your password: ${resetUrl}` }),
      });
      if (!response.ok) req.log.warn({ status: response.status, requestId: req.id }, "Password reset email delivery failed");
    } catch { req.log.warn({ requestId: req.id }, "Password reset email delivery failed"); }
  } else if (process.env["NODE_ENV"] !== "production") {
    // Development-only fallback. Production never logs or returns reset secrets.
    req.log.info({ resetUrl, requestId: req.id }, "Password reset URL (development only)");
  }
  res.status(202).json(resetResponse);
});

router.post("/v1/auth/reset-password", async (req, res) => {
  const token = typeof req.body?.token === "string" ? req.body.token : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
  if (!passwordIsValid(newPassword)) { res.status(400).json({ error: "Password does not meet security requirements." }); return; }
  let reset = false;
  if (token) {
    await db.transaction(async (tx) => {
      const [record] = await tx.select().from(passwordResetTokensTable).where(eq(passwordResetTokensTable.tokenHash, resetTokenHash(token))).for("update");
      if (!record || record.usedAt || record.expiresAt <= new Date()) return;
      await tx.update(usersTable).set({ passwordHash: hashPassword(newPassword) }).where(eq(usersTable.id, record.userId));
      await tx.update(passwordResetTokensTable).set({ usedAt: new Date() }).where(eq(passwordResetTokensTable.id, record.id));
      await tx.update(refreshTokensTable).set({ revokedAt: new Date() }).where(and(eq(refreshTokensTable.userId, record.userId), isNull(refreshTokensTable.revokedAt)));
      reset = true;
    });
  }
  if (!reset) { res.status(400).json({ error: "Password reset link is invalid or expired." }); return; }
  res.status(204).end();
});

router.post("/v1/auth/refresh", async (req, res) => {
  const refreshToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";
  if (!refreshToken) { res.status(401).json({ error: "Invalid refresh token." }); return; }
  const session = await getRefreshTokenUser(refreshToken);
  if (!session || session.status !== "active") { res.status(401).json({ error: "Invalid refresh token." }); return; }
  const tokens = await rotateRefreshToken(refreshToken, session.role);
  if (!tokens) { res.status(401).json({ error: "Invalid refresh token." }); return; }
  res.json({ tokens: { accessToken: tokens.accessToken, accessTokenExpiresIn: tokens.accessTokenExpiresIn, refreshToken: tokens.refreshToken, refreshTokenExpiresAt: tokens.refreshTokenExpiresAt } });
});

router.post("/v1/auth/logout", requireAuth, async (req: AuthenticatedRequest, res) => {
  const refreshToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";
  if (!refreshToken || !req.auth || !await revokeRefreshToken(refreshToken, req.auth.userId)) {
    res.status(401).json({ error: "Invalid refresh token." }); return;
  }
  await revokeAccessToken(req.auth.tokenId, req.auth.expiresAt);
  res.status(204).end();
});

router.get("/v1/auth/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const [user] = await db.select({
    id: usersTable.id, firstName: usersTable.firstName, lastName: usersTable.lastName,
    email: usersTable.email, role: rolesTable.name, zipCode: usersTable.zipCode,
    createdAt: usersTable.createdAt,
    rewloPoints: usersTable.rewloPoints, walletProvisioningStatus: usersTable.walletProvisioningStatus,
    braleAccountId: usersTable.braleAccountId, braleWalletId: usersTable.braleWalletId,
    braleAddressId: usersTable.braleAddressId, blockchainAddress: usersTable.blockchainAddress,
    blockchainNetwork: usersTable.blockchainNetwork,
  }).from(usersTable).innerJoin(rolesTable, eq(usersTable.roleId, rolesTable.id)).where(eq(usersTable.id, req.auth!.userId)).limit(1);
  if (!user) { res.status(401).json({ error: "Authentication is required." }); return; }
  res.json({ ...user, createdAt: user.createdAt.toISOString(), fullName: `${user.firstName} ${user.lastName}`.trim() });
});

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export default router;
