import { and, eq, gt, sql } from "drizzle-orm";
import {
  db,
  offerRedemptionsTable,
  offersTable,
  rewardTransactionsTable,
  usersTable,
} from "@workspace/db";
import BraleService from "./brale-service";

const externalId = (value: unknown) =>
  typeof value === "object" && value !== null && "id" in value
    ? String((value as { id: unknown }).id)
    : null;

export interface RedemptionResult {
  reference: string;
  points: number;
  braleTransactionId: string | null;
}

/**
 * Redeems an offer for a user: burns stablecoin via Brale, deducts points, and
 * records the redemption. Throws coded errors: NOT_FOUND, INSUFFICIENT_POINTS,
 * WALLET_NOT_CONFIGURED, ALREADY_REDEEMED (or BraleApiError).
 *
 * Used by both the manual redeem endpoint and assistant-drafted confirmations,
 * so a fan's one-tap confirm goes through the identical money path.
 */
export async function redeemOfferForUser(userId: number, offerId: number): Promise<RedemptionResult> {
  // Validate first, then call Brale without holding a database lock; the
  // transaction below validates again before committing.
  const [preflightUser] = await db
    .select({ points: usersTable.rewloPoints, braleAddressId: usersTable.braleAddressId })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  const [preflightOffer] = await db
    .select()
    .from(offersTable)
    .where(and(eq(offersTable.id, offerId), eq(offersTable.available, true), gt(offersTable.expiresAt, new Date())));
  if (!preflightUser || !preflightOffer) throw new Error("NOT_FOUND");
  if (preflightUser.points < preflightOffer.pointsRequired) throw new Error("INSUFFICIENT_POINTS");
  if (!preflightUser.braleAddressId) throw new Error("WALLET_NOT_CONFIGURED");

  // The stable key makes a retry safe if the provider accepted the redemption
  // but the local database operation failed before its response was sent.
  const reference = `REDEEM-${userId}-${offerId}`;
  const brale = await new BraleService().redeemStablecoin({
    userId,
    sourceAddressId: preflightUser.braleAddressId,
    amount: { value: (preflightOffer.redemptionValueCents / 100).toFixed(2), currency: "USD" },
    idempotencyKey: reference,
  });

  return db.transaction(async (tx) => {
    const locked = await tx.execute(
      sql`SELECT id, rewlo_points, brale_address_id FROM users WHERE id=${userId} FOR UPDATE`,
    );
    const user = locked.rows[0] as
      | { rewlo_points: number; brale_address_id: string | null }
      | undefined;
    const [offer] = await tx
      .select()
      .from(offersTable)
      .where(
        and(
          eq(offersTable.id, offerId),
          eq(offersTable.available, true),
          gt(offersTable.expiresAt, new Date()),
        ),
      );
    if (!user || !offer) throw new Error("NOT_FOUND");
    if (user.rewlo_points < offer.pointsRequired) throw new Error("INSUFFICIENT_POINTS");
    if (!user.brale_address_id) throw new Error("WALLET_NOT_CONFIGURED");
    const [existingRedemption] = await tx
      .select({ id: offerRedemptionsTable.id })
      .from(offerRedemptionsTable)
      .where(and(eq(offerRedemptionsTable.userId, userId), eq(offerRedemptionsTable.offerId, offerId)))
      .limit(1);
    if (existingRedemption) throw new Error("ALREADY_REDEEMED");
    await tx
      .update(usersTable)
      .set({ rewloPoints: sql`${usersTable.rewloPoints}-${offer.pointsRequired}` })
      .where(eq(usersTable.id, userId));
    await tx.insert(offerRedemptionsTable).values({
      userId,
      offerId,
      pointsSpent: offer.pointsRequired,
      reference,
      braleTransactionId: externalId(brale),
    });
    await tx.insert(rewardTransactionsTable).values({
      userId,
      pointsDelta: -offer.pointsRequired,
      reason: `Redeemed: ${offer.title}`,
      reference: `${reference}:points`,
    });
    return {
      reference,
      points: user.rewlo_points - offer.pointsRequired,
      braleTransactionId: externalId(brale),
    };
  });
}
