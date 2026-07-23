import type { NextFunction, Request, Response } from "express";
import { db, rolesTable, usersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { isAccessTokenRevoked, verifyAccessToken } from "../services/auth-token-service";

export type AuthenticatedRequest = Request & { auth?: { userId: number; role: string; tokenId: string; expiresAt: number } };

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authorization = req.header("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  const claims = match ? verifyAccessToken(match[1]) : null;
  if (!claims || await isAccessTokenRevoked(claims.jti)) { res.status(401).json({ error: "Authentication is required." }); return; }
  const userId = Number(claims.sub);
  const [user] = await db.select({ id: usersTable.id, role: rolesTable.name, status: usersTable.status }).from(usersTable).innerJoin(rolesTable, eq(usersTable.roleId, rolesTable.id)).where(eq(usersTable.id, userId)).limit(1);
  if (!user || user.status !== "active" || user.role !== claims.role) { res.status(401).json({ error: "Authentication is required." }); return; }
  req.auth = { userId, role: user.role, tokenId: claims.jti, expiresAt: claims.exp };
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) { res.status(401).json({ error: "Authentication is required." }); return; }
    if (!roles.includes(req.auth.role)) { res.status(403).json({ error: "You are not authorized to perform this action." }); return; }
    next();
  };
}
