import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import {
  assistantRulesTable,
  db,
  draftedActionsTable,
  nudgesTable,
  offerCategoriesTable,
  offerRedemptionsTable,
  offersTable,
  usersTable,
  walletTransactionsTable,
} from "@workspace/db";
import type { ParsedRule } from "./assistant-ai";

const EXPIRY_WINDOW_DAYS = 7;
const INACTIVITY_DAYS = 14;
const MAX_PENDING_NUDGES = 5;

interface CandidateOffer {
  id: number;
  merchant: string;
  title: string;
  description: string;
  pointsRequired: number;
  expiresAt: Date;
  category: string;
}

async function unredeemedOffers(userId: number): Promise<CandidateOffer[]> {
  const rows = await db
    .select({
      id: offersTable.id,
      merchant: offersTable.merchant,
      title: offersTable.title,
      description: offersTable.description,
      pointsRequired: offersTable.pointsRequired,
      expiresAt: offersTable.expiresAt,
      category: offerCategoriesTable.name,
      redemptionId: offerRedemptionsTable.id,
    })
    .from(offersTable)
    .innerJoin(offerCategoriesTable, eq(offersTable.categoryId, offerCategoriesTable.id))
    .leftJoin(
      offerRedemptionsTable,
      and(eq(offerRedemptionsTable.offerId, offersTable.id), eq(offerRedemptionsTable.userId, userId)),
    )
    .where(and(eq(offersTable.available, true), gt(offersTable.expiresAt, new Date())));
  return rows.filter((r) => r.redemptionId === null);
}

/**
 * Generates in-app nudges from behavior patterns. Idempotent per patternKey:
 * a nudge is never re-created once the fan has seen/accepted/dismissed it, so
 * the assistant learns from dismissals by staying quiet.
 */
export async function generateNudges(userId: number): Promise<void> {
  const [user] = await db
    .select({ points: usersTable.rewloPoints })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  if (!user) return;

  const existing = await db
    .select({ patternKey: nudgesTable.patternKey, status: nudgesTable.status })
    .from(nudgesTable)
    .where(eq(nudgesTable.userId, userId));
  const knownKeys = new Set(existing.map((n) => n.patternKey));
  let pendingCount = existing.filter((n) => n.status === "pending").length;

  const candidates: Array<{
    patternKey: string;
    kind: string;
    title: string;
    body: string;
    offerId?: number;
  }> = [];

  const offers = await unredeemedOffers(userId);

  // 1. Offers expiring soon that the fan can already afford.
  const soon = new Date(Date.now() + EXPIRY_WINDOW_DAYS * 86_400_000);
  for (const offer of offers) {
    if (offer.expiresAt <= soon && offer.pointsRequired <= user.points) {
      const days = Math.max(1, Math.ceil((offer.expiresAt.getTime() - Date.now()) / 86_400_000));
      candidates.push({
        patternKey: `expiring_offer:${offer.id}`,
        kind: "expiring_offer",
        title: `${offer.merchant} deal ends soon`,
        body: `"${offer.title}" expires in ${days} day${days === 1 ? "" : "s"} and you already have the ${offer.pointsRequired.toLocaleString("en-US")} points it costs.`,
        offerId: offer.id,
      });
    }
  }

  // 2. Category habit: repeated redemptions in one category with a fresh offer available.
  const habit = await db.execute(sql`
    SELECT oc.name AS category, COUNT(*) AS cnt
    FROM offer_redemptions orr
    JOIN offers o ON o.id = orr.offer_id
    JOIN offer_categories oc ON oc.id = o.category_id
    WHERE orr.user_id = ${userId}
    GROUP BY oc.name HAVING COUNT(*) >= 2
    ORDER BY cnt DESC LIMIT 1
  `);
  const topCategory = habit.rows[0]?.category ? String(habit.rows[0].category) : null;
  if (topCategory) {
    const match = offers.find((o) => o.category === topCategory && o.pointsRequired <= user.points);
    if (match) {
      candidates.push({
        patternKey: `category_habit:${topCategory}:${match.id}`,
        kind: "category_habit",
        title: `More ${topCategory} for you`,
        body: `You keep grabbing ${topCategory} rewards — "${match.title}" from ${match.merchant} is live for ${match.pointsRequired.toLocaleString("en-US")} points.`,
        offerId: match.id,
      });
    }
  }

  // 3. Inactivity: points sitting idle with no recent wallet activity.
  const [lastTx] = await db
    .select({ createdAt: walletTransactionsTable.createdAt })
    .from(walletTransactionsTable)
    .where(eq(walletTransactionsTable.userId, userId))
    .orderBy(desc(walletTransactionsTable.createdAt))
    .limit(1);
  const idle = !lastTx || lastTx.createdAt < new Date(Date.now() - INACTIVITY_DAYS * 86_400_000);
  if (idle && user.points > 0) {
    const affordable = offers.filter((o) => o.pointsRequired <= user.points).length;
    if (affordable > 0) {
      const weekKey = new Date().toISOString().slice(0, 10);
      candidates.push({
        patternKey: `inactivity:${weekKey}`,
        kind: "inactivity",
        title: "Your points are sitting idle",
        body: `You have ${user.points.toLocaleString("en-US")} points and ${affordable} offer${affordable === 1 ? "" : "s"} you can redeem right now.`,
      });
    }
  }

  const fresh = candidates.filter((c) => !knownKeys.has(c.patternKey));
  for (const c of fresh) {
    if (pendingCount >= MAX_PENDING_NUDGES) break;
    // onConflictDoNothing keeps concurrent generation runs idempotent.
    await db.insert(nudgesTable).values({ userId, ...c }).onConflictDoNothing();
    pendingCount += 1;
  }
}

function offerMatchesRule(offer: CandidateOffer, parsed: ParsedRule): boolean {
  if (parsed.maxPointsCost !== null && offer.pointsRequired > parsed.maxPointsCost) return false;
  const haystack = `${offer.title} ${offer.description} ${offer.merchant}`.toLowerCase();
  const categoryHit = parsed.categories.length > 0 && parsed.categories.includes(offer.category);
  const merchantHit = parsed.merchants.length > 0 &&
    parsed.merchants.some((m) => offer.merchant.toLowerCase() === m.toLowerCase());
  const keywordHit = parsed.keywords.length > 0 && parsed.keywords.some((k) => haystack.includes(k));
  const hasSelectors = parsed.categories.length > 0 || parsed.merchants.length > 0 || parsed.keywords.length > 0;
  // A rule with only a points cap matches any affordable offer under the cap.
  return hasSelectors ? categoryHit || merchantHit || keywordHit : parsed.maxPointsCost !== null;
}

/**
 * Matches each active standing rule against live offers and drafts redemptions.
 * Drafts ALWAYS wait for the fan's explicit one-tap confirmation — this engine
 * never moves money. A rule+offer pair is drafted at most once, ever.
 */
export async function runStandingRules(userId: number): Promise<void> {
  const rules = await db
    .select()
    .from(assistantRulesTable)
    .where(and(eq(assistantRulesTable.userId, userId), eq(assistantRulesTable.active, true)));
  if (rules.length === 0) return;

  const offers = await unredeemedOffers(userId);
  if (offers.length === 0) return;

  const prior = await db
    .select({ ruleId: draftedActionsTable.ruleId, offerId: draftedActionsTable.offerId })
    .from(draftedActionsTable)
    .where(
      and(
        eq(draftedActionsTable.userId, userId),
        inArray(draftedActionsTable.ruleId, rules.map((r) => r.id)),
      ),
    );
  const drafted = new Set(prior.map((p) => `${p.ruleId}:${p.offerId}`));

  for (const rule of rules) {
    const parsed = rule.parsed as ParsedRule;
    for (const offer of offers) {
      if (drafted.has(`${rule.id}:${offer.id}`)) continue;
      if (!offerMatchesRule(offer, parsed)) continue;
      // onConflictDoNothing keeps concurrent matching runs idempotent.
      await db.insert(draftedActionsTable).values({
        userId,
        ruleId: rule.id,
        offerId: offer.id,
        summary: `${offer.title} at ${offer.merchant} for ${offer.pointsRequired.toLocaleString("en-US")} points — matches your rule "${parsed.summary ?? rule.ruleText}"`,
      }).onConflictDoNothing();
      drafted.add(`${rule.id}:${offer.id}`);
    }
  }
}
