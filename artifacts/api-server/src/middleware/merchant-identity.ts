import type { NextFunction, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db, merchantsTable, merchantUsersTable } from "@workspace/db";
import type { AuthenticatedRequest } from "./auth";
import { singleMerchantMembership, type MerchantIdentity } from "./merchant-scope";

export type { MerchantIdentity } from "./merchant-scope";
export type MerchantAuthenticatedRequest = AuthenticatedRequest & { merchant?: MerchantIdentity };

/** Resolves scope from the JWT user, never from a URL, header, or request body. */
export async function requireMerchantMembership(req: MerchantAuthenticatedRequest, res: Response, next: NextFunction) {
  const userId = req.auth?.userId;
  if (!userId) { res.status(401).json({ error: "Authentication is required." }); return; }
  const memberships = await db.select({
    merchantId: merchantsTable.id, merchantCode: merchantsTable.merchantCode,
    merchantName: merchantsTable.merchantName, membershipRole: merchantUsersTable.role,
  }).from(merchantUsersTable).innerJoin(merchantsTable, eq(merchantUsersTable.merchantId, merchantsTable.id))
    .where(and(eq(merchantUsersTable.userId, userId), eq(merchantUsersTable.status, "active"))).limit(2);
  const membership = singleMerchantMembership(memberships);
  if (!membership) {
    res.status(403).json({ error: memberships.length ? "Select a single merchant context before continuing." : "No active merchant membership was found." });
    return;
  }
  req.merchant = membership;
  next();
}
