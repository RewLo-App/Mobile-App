import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, refreshTokensTable, revokedAccessTokensTable, rolesTable, usersTable } from "@workspace/db";

const accessTokenLifetimeSeconds = 15 * 60;
const refreshTokenLifetimeMs = 30 * 24 * 60 * 60 * 1000;

export type AccessTokenClaims = { sub: string; role: string; jti: string; iat: number; exp: number; iss: string; aud: string };

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be configured on the backend.`);
  return value;
}
function issuer() { return requiredEnv("AUTH_JWT_ISSUER"); }
function audience() { return requiredEnv("AUTH_JWT_AUDIENCE"); }
function base64Url(value: string | Buffer) { return Buffer.from(value).toString("base64url"); }
function sign(value: string) { return createHmac("sha256", requiredEnv("AUTH_ACCESS_TOKEN_SECRET")).update(value).digest("base64url"); }
function hashRefreshToken(token: string) { return createHmac("sha256", requiredEnv("AUTH_ACCESS_TOKEN_SECRET")).update(`refresh:${token}`).digest("hex"); }

function accessToken(userId: number, role: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ sub: String(userId), role, jti: randomUUID(), iat: now, exp: now + accessTokenLifetimeSeconds, iss: issuer(), aud: audience() }));
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
}

export async function issueAuthTokenPair(userId: number, role: string) {
  const refreshToken = randomBytes(48).toString("base64url");
  const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenLifetimeMs);
  await db.insert(refreshTokensTable).values({ userId, tokenHash: hashRefreshToken(refreshToken), tokenFamily: randomUUID(), expiresAt: refreshTokenExpiresAt });
  return { accessToken: accessToken(userId, role), accessTokenExpiresIn: accessTokenLifetimeSeconds, refreshToken, refreshTokenExpiresAt };
}

export function verifyAccessToken(token: string): AccessTokenClaims | null {
  const [encodedHeader, encodedPayload, suppliedSignature, ...extra] = token.split(".");
  if (!encodedHeader || !encodedPayload || !suppliedSignature || extra.length) return null;
  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8")) as { alg?: unknown; typ?: unknown };
    const claims = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<AccessTokenClaims>;
    const now = Math.floor(Date.now() / 1000);
    if (header.alg !== "HS256" || header.typ !== "JWT" || claims.iss !== issuer() || claims.aud !== audience()
      || typeof claims.sub !== "string" || !/^\d+$/.test(claims.sub) || typeof claims.role !== "string" || typeof claims.jti !== "string"
      || typeof claims.iat !== "number" || typeof claims.exp !== "number" || claims.iat > now + 60 || claims.exp <= now) return null;
    return claims as AccessTokenClaims;
  } catch { return null; }
}

/** Rotates a refresh token atomically. A previously revoked token revokes its whole family. */
export async function rotateRefreshToken(token: string, role: string) {
  const tokenHash = hashRefreshToken(token);
  return db.transaction(async (tx) => {
    const [stored] = await tx.select().from(refreshTokensTable).where(eq(refreshTokensTable.tokenHash, tokenHash)).for("update");
    if (!stored || stored.expiresAt <= new Date()) return null;
    if (stored.revokedAt) {
      await tx.update(refreshTokensTable).set({ revokedAt: new Date() }).where(and(eq(refreshTokensTable.tokenFamily, stored.tokenFamily), isNull(refreshTokensTable.revokedAt)));
      return null;
    }
    const next = randomBytes(48).toString("base64url");
    const expiresAt = new Date(Date.now() + refreshTokenLifetimeMs);
    const [created] = await tx.insert(refreshTokensTable).values({ userId: stored.userId, tokenHash: hashRefreshToken(next), tokenFamily: stored.tokenFamily, expiresAt }).returning({ id: refreshTokensTable.id });
    await tx.update(refreshTokensTable).set({ revokedAt: new Date(), replacedByTokenId: created.id }).where(eq(refreshTokensTable.id, stored.id));
    return { accessToken: accessToken(stored.userId, role), accessTokenExpiresIn: accessTokenLifetimeSeconds, refreshToken: next, refreshTokenExpiresAt: expiresAt, userId: stored.userId };
  });
}

export async function getRefreshTokenUser(token: string) {
  const [session] = await db.select({ userId: refreshTokensTable.userId, status: usersTable.status, role: rolesTable.name })
    .from(refreshTokensTable)
    .innerJoin(usersTable, eq(refreshTokensTable.userId, usersTable.id))
    .innerJoin(rolesTable, eq(usersTable.roleId, rolesTable.id))
    .where(eq(refreshTokensTable.tokenHash, hashRefreshToken(token))).limit(1);
  return session;
}

export async function revokeRefreshToken(token: string, userId: number) {
  const result = await db.update(refreshTokensTable).set({ revokedAt: new Date() }).where(and(eq(refreshTokensTable.tokenHash, hashRefreshToken(token)), eq(refreshTokensTable.userId, userId), isNull(refreshTokensTable.revokedAt), gt(refreshTokensTable.expiresAt, new Date()))).returning({ id: refreshTokensTable.id });
  return result.length > 0;
}

export async function revokeAccessToken(tokenId: string, expiresAt: number) {
  await db.insert(revokedAccessTokensTable).values({ tokenId, expiresAt: new Date(expiresAt * 1000) }).onConflictDoNothing();
}
export async function isAccessTokenRevoked(tokenId: string) {
  const [row] = await db.select({ id: revokedAccessTokensTable.id }).from(revokedAccessTokensTable)
    .where(and(eq(revokedAccessTokensTable.tokenId, tokenId), gt(revokedAccessTokensTable.expiresAt, new Date()))).limit(1);
  return Boolean(row);
}

export function validateAuthTokenEnvironment() { requiredEnv("AUTH_ACCESS_TOKEN_SECRET"); issuer(); audience(); }
