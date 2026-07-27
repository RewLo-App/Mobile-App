import { sql } from "drizzle-orm";
import {
  appSettingsTable,
  db,
  offerCategoriesTable,
  offersTable,
  rolesTable,
} from "@workspace/db";

import { logger } from "./lib/logger";

// The fan-facing offer catalog. Only inserted when the offers table is empty
// (e.g. a freshly published production database) so existing data is never touched.
const starterOffers: Array<[category: string, merchant: string, title: string, discountLabel: string, pointsRequired: number]> = [
  ["Sports", "Nike", "20% off football boots", "20% OFF", 500],
  ["Sports", "Adidas", "Free jersey personalisation", "FREE", 800],
  ["Stadium", "Etihad Stadium", "Matchday meal bundle", "$10 OFF", 650],
  ["Sports", "Puma", "15% off training gear", "15% OFF", 400],
  ["Merchandise", "Fanatics", "$20 off licensed merchandise", "$20 OFF", 900],
  ["Stadium", "Wembley Stadium", "Stadium tour discount", "2 FOR 1", 1200],
  ["Tickets", "Ticketmaster", "No service fee on match tickets", "NO FEE", 1000],
  ["Media", "Sky Sports", "One month sports pass", "1 MONTH", 1400],
  ["Gaming", "EA Sports FC", "Bonus FC points", "5K POINTS", 600],
  ["Sports", "Under Armour", "25% off fan apparel", "25% OFF", 750],
  ["Stadium", "Old Trafford", "Free matchday programme", "FREE", 350],
  ["Stadium", "Anfield", "Museum entry discount", "30% OFF", 550],
  ["Merchandise", "New Era", "Club cap discount", "20% OFF", 450],
  ["Food", "Levy Restaurants", "Free stadium drink", "FREE", 300],
  ["Tickets", "SeatGeek", "$15 ticket credit", "$15 OFF", 850],
  ["Sports", "New Balance", "Running gear discount", "15% OFF", 500],
  ["Media", "ESPN+", "One month subscription", "1 MONTH", 1300],
  ["Gaming", "PlayStation", "Sports game credit", "$10 CREDIT", 700],
  ["Experiences", "Manchester City", "Training ground tour", "VIP TOUR", 2500],
  ["Experiences", "Arsenal FC", "Signed shirt prize draw", "ENTRY", 200],
];

/**
 * Ensures the reference data the app cannot run without exists. Idempotent and
 * additive only — safe to run on every server start in every environment.
 * Without the "Fan" role, registration fails with FAN_ROLE_MISSING.
 */
export async function ensureReferenceData(): Promise<void> {
  await db.insert(rolesTable).values([{ name: "Fan" }, { name: "Merchant" }]).onConflictDoNothing();
  await db.insert(appSettingsTable).values({ key: "welcome_points", value: "2350" }).onConflictDoNothing();

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(offersTable);
  if (Number(count) > 0) return;

  logger.info("Offers table is empty — seeding the starter reward catalog");
  const categoryNames = [...new Set(starterOffers.map((o) => o[0]))];
  await db.insert(offerCategoriesTable)
    .values(categoryNames.map((name) => ({ name, icon: "pricetag-outline" })))
    .onConflictDoNothing();
  const categories = await db.select().from(offerCategoriesTable);
  const categoryId = new Map(categories.map((c) => [c.name, c.id]));
  await db.insert(offersTable).values(
    starterOffers.map(([category, merchant, title, discountLabel, pointsRequired]) => ({
      categoryId: categoryId.get(category)!,
      merchant,
      title,
      description: title,
      discountLabel,
      pointsRequired,
      redemptionValueCents: 100,
      available: true,
      expiresAt: new Date("2027-12-31T23:59:59Z"),
    })),
  );
}
