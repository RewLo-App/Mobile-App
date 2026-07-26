import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { offerCategoriesTable, offersTable } from "./schema";

const clubOffers = [
  {
    merchant: "Chicago Fire FC",
    title: "20% off an official home jersey",
    description: "Save on an official Chicago Fire FC home jersey.",
    discountLabel: "20% OFF",
    pointsRequired: 750,
  },
  {
    merchant: "St. Louis Cardinals",
    title: "$15 off a Cardinals game ticket",
    description: "Apply a $15 credit toward a regular-season St. Louis Cardinals game ticket.",
    discountLabel: "$15 OFF",
    pointsRequired: 1_000,
  },
  {
    merchant: "Green Bay Packers",
    title: "15% off a Lambeau Field stadium tour",
    description: "Save on a Green Bay Packers Lambeau Field stadium tour.",
    discountLabel: "15% OFF",
    pointsRequired: 900,
  },
] as const;

async function seedClubOffers() {
  await db.transaction(async (tx) => {
    const [clubCategory] = await tx
      .insert(offerCategoriesTable)
      .values({ name: "Club", icon: "shield-outline" })
      .onConflictDoUpdate({
        target: offerCategoriesTable.name,
        set: { icon: "shield-outline" },
      })
      .returning();

    for (const offer of clubOffers) {
      const values = {
        categoryId: clubCategory.id,
        ...offer,
        redemptionValueCents: 100,
        available: true,
        expiresAt: new Date("2027-12-31T23:59:59Z"),
      };
      const [existingOffer] = await tx
        .select({ id: offersTable.id })
        .from(offersTable)
        .where(and(eq(offersTable.categoryId, clubCategory.id), eq(offersTable.merchant, offer.merchant)))
        .limit(1);

      if (existingOffer) {
        await tx.update(offersTable).set(values).where(eq(offersTable.id, existingOffer.id));
      } else {
        await tx.insert(offersTable).values(values);
      }
    }
  });

  console.log("Seeded the Club category and 3 club offers.");
}

seedClubOffers().catch((error: unknown) => {
  console.error("Club offer seed failed", error);
  process.exitCode = 1;
});
