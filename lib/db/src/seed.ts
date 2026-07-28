import { eq, inArray, sql } from "drizzle-orm";
import { db } from "./index";
import {
  merchantsTable,
  rolesTable,
  userCardsTable,
  usersTable,
  walletTransactionsTable,
  appSettingsTable,
  offerCategoriesTable,
  offersTable,
  offerRedemptionsTable,
  merchantAlertsTable,
  merchantLoyaltyLedgerEntriesTable,
  merchantLoyaltyTransfersTable,
  merchantSettlementsTable,
  merchantCampaignIssuancesTable,
  merchantLoyaltyCampaignsTable,
  merchantLoyaltyRulesTable,
} from "./schema";

const demoUsers = [
  ["Maya", "Patel", "maya.patel@example.com", "+1-415-555-0101", "sf-49ers", 124_50, 2_450],
  ["Liam", "Carter", "liam.carter@example.com", "+1-212-555-0102", "ny-giants", 86_25, 1_875],
  ["Sofia", "Martinez", "sofia.martinez@example.com", "+1-305-555-0103", "mia-dolphins", 310_00, 3_220],
  ["Ethan", "Brooks", "ethan.brooks@example.com", "+1-312-555-0104", "chi-bears", 57_80, 940],
  ["Olivia", "Nguyen", "olivia.nguyen@example.com", "+1-206-555-0105", "sea-seahawks", 442_15, 4_180],
  ["Noah", "Williams", "noah.williams@example.com", "+1-214-555-0106", "dal-cowboys", 199_95, 2_100],
  ["Ava", "Johnson", "ava.johnson@example.com", "+1-617-555-0107", "bos-celtics", 78_40, 1_120],
  ["Lucas", "Thompson", "lucas.thompson@example.com", "+1-303-555-0108", "den-nuggets", 265_70, 2_960],
  ["Isabella", "Reed", "isabella.reed@example.com", "+1-404-555-0109", "atl-hawks", 143_60, 1_640],
  ["James", "Wilson", "james.wilson@example.com", "+1-702-555-0110", "vgk-knights", 520_25, 5_430],
  ["Emma", "Davis", "emma.davis@example.com", "+1-310-555-0111", "la-lakers", 91_10, 1_300],
  ["Benjamin", "Moore", "benjamin.moore@example.com", "+1-713-555-0112", "hou-astros", 237_85, 2_740],
  ["Charlotte", "Taylor", "charlotte.taylor@example.com", "+1-704-555-0113", "cha-hornets", 65_55, 780],
  ["Henry", "Anderson", "henry.anderson@example.com", "+1-412-555-0114", "pit-steelers", 388_90, 3_600],
  ["Amelia", "Thomas", "amelia.thomas@example.com", "+1-602-555-0115", "phx-suns", 176_30, 2_050],
  ["Alexander", "Jackson", "alexander.jackson@example.com", "+1-718-555-0116", "ny-knicks", 109_45, 1_510],
  ["Harper", "White", "harper.white@example.com", "+1-503-555-0117", "por-timbers", 295_75, 3_090],
  ["Daniel", "Harris", "daniel.harris@example.com", "+1-813-555-0118", "tb-lightning", 48_20, 620],
  ["Evelyn", "Clark", "evelyn.clark@example.com", "+1-314-555-0119", "stl-cardinals", 352_65, 4_010],
  ["Michael", "Lewis", "michael.lewis@example.com", "+1-646-555-0120", "ny-rangers", 215_35, 2_280],
] as const;

const demoMerchants = [
  ["MANC001", "Manchester City Official Store", "store@manc001.demo.rewlo.io", "Official match-day merchandise and supporter gear."],
  ["ARS001", "Arsenal Fan Shop", "store@ars001.demo.rewlo.io", "Licensed Arsenal apparel and match-day essentials."],
  ["CHE001", "Chelsea Stadium Catering", "ops@che001.demo.rewlo.io", "Food, drinks, and hospitality at Stamford Bridge."],
  ["LIV001", "Liverpool FC Retail", "store@liv001.demo.rewlo.io", "Official Liverpool FC retail partner."],
  ["LAL001", "Lakers Team Store", "store@lal001.demo.rewlo.io", "Los Angeles Lakers merchandise and tickets."],
  ["NYK001", "Knicks Garden Market", "ops@nyk001.demo.rewlo.io", "Madison Square Garden concessions and fan items."],
  ["DAL001", "Dallas Matchday Market", "ops@dal001.demo.rewlo.io", "Cowboys match-day retail and concessions."],
  ["MIA001", "Miami Fan Zone", "store@mia001.demo.rewlo.io", "Dolphins fan merchandise and experiences."],
  ["SEA001", "Seattle Supporters Shop", "store@sea001.demo.rewlo.io", "Seahawks supporter gear and stadium offers."],
  ["BOS001", "Boston Championship Store", "store@bos001.demo.rewlo.io", "Celtics and Red Sox licensed products."],
] as const;

const demoOffers = [
  ["Sports","Nike","20% off football boots","20% OFF",500],["Sports","Adidas","Free jersey personalisation","FREE",800],
  ["Stadium","Etihad Stadium","Matchday meal bundle","$10 OFF",650],["Sports","Puma","15% off training gear","15% OFF",400],
  ["Merchandise","Fanatics","$20 off licensed merchandise","$20 OFF",900],["Stadium","Wembley Stadium","Stadium tour discount","2 FOR 1",1200],
  ["Tickets","Ticketmaster","No service fee on match tickets","NO FEE",1000],["Media","Sky Sports","One month sports pass","1 MONTH",1400],
  ["Gaming","EA Sports FC","Bonus FC points","5K POINTS",600],["Sports","Under Armour","25% off fan apparel","25% OFF",750],
  ["Stadium","Old Trafford","Free matchday programme","FREE",350],["Stadium","Anfield","Museum entry discount","30% OFF",550],
  ["Merchandise","New Era","Club cap discount","20% OFF",450],["Food","Levy Restaurants","Free stadium drink","FREE",300],
  ["Tickets","SeatGeek","$15 ticket credit","$15 OFF",850],["Sports","New Balance","Running gear discount","15% OFF",500],
  ["Media","ESPN+","One month subscription","1 MONTH",1300],["Gaming","PlayStation","Sports game credit","$10 CREDIT",700],
  ["Experiences","Manchester City","Training ground tour","VIP TOUR",2500],["Experiences","Arsenal FC","Signed shirt prize draw","ENTRY",200],
] as const;

const cardProviders = ["Visa", "Mastercard", "Visa", "Mastercard"] as const;
const demoUserRewloPoints = 2_350;
const cardLastFour = ["4821", "7394", "1048", "6612", "9035", "2576", "8140", "3906", "5268", "1479"] as const;
const transactionTypes = [
  "top_up", "send", "receive", "reward", "redeem",
  "merchant_payment", "mint", "burn", "transfer",
] as const;
type TransactionType = (typeof transactionTypes)[number];

const daysBefore = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

async function seed() {
  await db.transaction(async (tx) => {
    await tx.insert(rolesTable).values([{ name: "Fan" }, { name: "Merchant" }]).onConflictDoNothing();
    const [fanRole] = await tx.select().from(rolesTable).where(eq(rolesTable.name, "Fan"));
    if (!fanRole) throw new Error("Fan role was not created");
    await tx.insert(appSettingsTable).values({key:"welcome_points",value:"2350"}).onConflictDoUpdate({target:appSettingsTable.key,set:{value:"2350"}});
    const categoryNames=[...new Set(demoOffers.map(o=>o[0]))];
    const categories=await Promise.all(categoryNames.map(async name=>(await tx.insert(offerCategoriesTable).values({name,icon:"pricetag-outline"}).onConflictDoUpdate({target:offerCategoriesTable.name,set:{icon:"pricetag-outline"}}).returning())[0]));
    await tx.delete(offerRedemptionsTable);
    await tx.delete(offersTable);
    await tx.insert(offersTable).values(demoOffers.map(([category,merchant,description,discountLabel,pointsRequired])=>({categoryId:categories.find(c=>c.name===category)!.id,merchant,title:description,description,discountLabel,pointsRequired,redemptionValueCents:100,available:true,expiresAt:new Date("2027-12-31T23:59:59Z")})));

    const merchantRows = await Promise.all(
      demoMerchants.map(async ([merchantCode, merchantName, email, description]) => {
        const [merchant] = await tx
          .insert(merchantsTable)
          .values({ merchantCode, merchantName, email, description })
          .onConflictDoUpdate({ target: merchantsTable.merchantCode, set: { merchantName, email, description } })
          .returning();
        return merchant;
      }),
    );

    const userRows = await Promise.all(
      demoUsers.map(async ([firstName, lastName, email, phoneNumber, primaryClubId, rewloCashBalance]) => {
        const [user] = await tx
          .insert(usersTable)
          .values({
            firstName,
            lastName,
            email,
            phoneNumber,
            roleId: fanRole.id,
            rewloCashBalance,
            normalizedEmail: email.toLowerCase(),
            passwordHash: "demo-users-require-a-real-password-hash",
            rewloPoints: demoUserRewloPoints,
            primaryClubId,
            followedClubIds: JSON.stringify([primaryClubId]),
            zipCode: "10001",
          })
          .onConflictDoUpdate({
            target: usersTable.email,
            set: { firstName, lastName, phoneNumber, roleId: fanRole.id, rewloCashBalance, rewloPoints: demoUserRewloPoints, primaryClubId },
          })
          .returning();
        return user;
      }),
    );

    // Merchant dashboard development fixtures are additive and idempotent.
    // In particular, LIV001's existing Brale provisioning and cash/payment
    // history are never modified; this only adds merchant-loyalty records.
    const liv = merchantRows.find((merchant) => merchant.merchantCode === "LIV001");
    const manc = merchantRows.find((merchant) => merchant.merchantCode === "MANC001");
    if (!liv || !manc) throw new Error("Merchant dashboard fixtures require LIV001 and MANC001");
    await tx.insert(appSettingsTable).values({
      key: "rwlo_point_value_preview",
      value: JSON.stringify({ version: 1, label: "RWLO programme points", unit: "RWLO", pointsPerUnit: 1, disclaimer: "Programme value display only; not cash, yield, or an investment return." }),
    }).onConflictDoNothing();

    const [livCampaign] = await tx.insert(merchantLoyaltyCampaignsTable).values({
      merchantId: liv.id, name: "Matchday Founding Rewards", description: "Development fixture for LIV001 merchant reporting.", status: "active", startsAt: daysBefore(30), endsAt: daysBefore(-30), pointsBudget: 15_000, pointsIssued: 12_500, eligibility: { audience: "matchday_fans" },
    }).onConflictDoUpdate({ target: [merchantLoyaltyCampaignsTable.merchantId, merchantLoyaltyCampaignsTable.name], set: { pointsBudget: 15_000, pointsIssued: 12_500, status: "active" } }).returning();
    const [mancCampaign] = await tx.insert(merchantLoyaltyCampaignsTable).values({
      merchantId: manc.id, name: "Store Opening Bonus", description: "Development fixture for MANC001 merchant reporting.", status: "paused", startsAt: daysBefore(14), endsAt: daysBefore(-14), pointsBudget: 7_000, pointsIssued: 4_200, eligibility: { audience: "club_supporters" },
    }).onConflictDoUpdate({ target: [merchantLoyaltyCampaignsTable.merchantId, merchantLoyaltyCampaignsTable.name], set: { pointsBudget: 7_000, pointsIssued: 4_200, status: "paused" } }).returning();
    if (!livCampaign || !mancCampaign) throw new Error("Campaign fixtures were not created");
    await tx.insert(merchantLoyaltyRulesTable).values([
      { merchantId: liv.id, ruleKey: "LIV-SPEND", version: 1, name: "Matchday spend", ruleType: "per_dollar", status: "active", priority: 100, pointsNumerator: 2, spendDenominatorCents: 100, conditions: { channel: "in_store" } },
      { merchantId: liv.id, ruleKey: "LIV-VISIT", version: 1, name: "Stadium visit", ruleType: "per_visit", status: "draft", priority: 50, pointsPerVisit: 100 },
      { merchantId: liv.id, ruleKey: "LIV-CAMPAIGN", version: 1, name: "Founding rewards campaign", ruleType: "campaign", status: "active", priority: 200, campaignId: livCampaign.id },
      { merchantId: manc.id, ruleKey: "MANC-SPEND", version: 1, name: "Store spend", ruleType: "per_dollar", status: "paused", priority: 100, pointsNumerator: 1, spendDenominatorCents: 100 },
    ]).onConflictDoNothing();

    await tx.insert(merchantLoyaltyTransfersTable).values([
      {
        sourceMerchantId: liv.id, destinationMerchantId: manc.id, points: 900,
        status: "completed", idempotencyKey: "DEMO-MERCHANT-TRANSFER-LIV-MANC-001",
        externalReference: "DEMO-XFER-LIV-MANC-001", metadata: { demo: true, seedVersion: 1 },
        initiatedAt: daysBefore(18), completedAt: daysBefore(18),
      },
      {
        sourceMerchantId: manc.id, destinationMerchantId: liv.id, points: 650,
        status: "pending", idempotencyKey: "DEMO-MERCHANT-TRANSFER-MANC-LIV-002",
        externalReference: "DEMO-XFER-MANC-LIV-002", metadata: { demo: true, seedVersion: 1 }, initiatedAt: daysBefore(1),
      },
    ]).onConflictDoNothing();

    const [completedTransfer] = await tx.select({ id: merchantLoyaltyTransfersTable.id })
      .from(merchantLoyaltyTransfersTable)
      .where(eq(merchantLoyaltyTransfersTable.idempotencyKey, "DEMO-MERCHANT-TRANSFER-LIV-MANC-001"));
    if (!completedTransfer) throw new Error("Completed merchant transfer fixture was not created");

    await tx.insert(merchantLoyaltyLedgerEntriesTable).values([
      { merchantId: liv.id, fanUserId: userRows[0]?.id, entryType: "issuance", status: "posted", pointsDelta: 10_000, reserveDeltaCents: 1_000, sourceType: "seed_campaign", sourceId: "LIV-SEASON-OPENING", idempotencyKey: "DEMO-LEDGER-LIV-001", externalReference: "DEMO-LIV-ISSUE-001", metadata: { demo: true, seedVersion: 1 }, occurredAt: daysBefore(28) },
      { merchantId: liv.id, fanUserId: userRows[1]?.id, entryType: "redemption", status: "posted", pointsDelta: -2_400, reserveDeltaCents: -240, sourceType: "seed_redemption", sourceId: "LIV-ANFIELD-OFFER", idempotencyKey: "DEMO-LEDGER-LIV-002", externalReference: "DEMO-LIV-REDEEM-001", metadata: { demo: true, seedVersion: 1 }, occurredAt: daysBefore(21) },
      { merchantId: liv.id, entryType: "transfer_out", status: "posted", pointsDelta: -900, reserveDeltaCents: 0, sourceType: "merchant_transfer", sourceId: String(completedTransfer.id), idempotencyKey: "DEMO-LEDGER-LIV-003", externalReference: "DEMO-LIV-XFER-OUT-001", metadata: { demo: true, seedVersion: 1 }, occurredAt: daysBefore(18) },
      { merchantId: liv.id, fanUserId: userRows[2]?.id, entryType: "issuance", status: "posted", pointsDelta: 2_500, reserveDeltaCents: 250, sourceType: "seed_campaign", sourceId: "LIV-MATCHDAY-BOOST", idempotencyKey: "DEMO-LEDGER-LIV-004", externalReference: "DEMO-LIV-ISSUE-002", metadata: { demo: true, seedVersion: 1 }, occurredAt: daysBefore(4) },
      { merchantId: liv.id, fanUserId: userRows[3]?.id, entryType: "redemption", status: "posted", pointsDelta: -350, reserveDeltaCents: -35, sourceType: "seed_redemption", sourceId: "LIV-MERCH-OFFER", idempotencyKey: "DEMO-LEDGER-LIV-005", externalReference: "DEMO-LIV-REDEEM-002", metadata: { demo: true, seedVersion: 1 }, occurredAt: daysBefore(2) },
      { merchantId: manc.id, entryType: "transfer_in", status: "posted", pointsDelta: 900, reserveDeltaCents: 0, sourceType: "merchant_transfer", sourceId: String(completedTransfer.id), idempotencyKey: "DEMO-LEDGER-MANC-001", externalReference: "DEMO-MANC-XFER-IN-001", metadata: { demo: true, seedVersion: 1 }, occurredAt: daysBefore(18) },
      { merchantId: manc.id, fanUserId: userRows[4]?.id, entryType: "issuance", status: "posted", pointsDelta: 4_200, reserveDeltaCents: 420, sourceType: "seed_campaign", sourceId: "MANC-STORE-OPENING", idempotencyKey: "DEMO-LEDGER-MANC-002", externalReference: "DEMO-MANC-ISSUE-001", metadata: { demo: true, seedVersion: 1 }, occurredAt: daysBefore(12) },
      { merchantId: manc.id, fanUserId: userRows[5]?.id, entryType: "redemption", status: "posted", pointsDelta: -950, reserveDeltaCents: -95, sourceType: "seed_redemption", sourceId: "MANC-KIT-OFFER", idempotencyKey: "DEMO-LEDGER-MANC-003", externalReference: "DEMO-MANC-REDEEM-001", metadata: { demo: true, seedVersion: 1 }, occurredAt: daysBefore(6) },
    ]).onConflictDoNothing();

    const issuanceLedgerEntries = await tx.execute(sql`
      SELECT id, external_reference FROM merchant_loyalty_ledger_entries
      WHERE external_reference IN ('DEMO-LIV-ISSUE-001', 'DEMO-LIV-ISSUE-002', 'DEMO-MANC-ISSUE-001')
    `);
    const ledgerId = (reference: string) => Number(issuanceLedgerEntries.rows.find((row) => row.external_reference === reference)?.id ?? 0);
    await tx.insert(merchantCampaignIssuancesTable).values([
      { merchantId: liv.id, campaignId: livCampaign.id, fanUserId: userRows[0]!.id, ledgerEntryId: ledgerId("DEMO-LIV-ISSUE-001"), issuedPoints: 10_000, status: "posted", sourceEventKey: "LIV-OPENING-USER-1", idempotencyKey: "DEMO-CAMPAIGN-ISSUANCE-LIV-001", metadata: { demo: true } },
      { merchantId: liv.id, campaignId: livCampaign.id, fanUserId: userRows[2]!.id, ledgerEntryId: ledgerId("DEMO-LIV-ISSUE-002"), issuedPoints: 2_500, status: "posted", sourceEventKey: "LIV-OPENING-USER-3", idempotencyKey: "DEMO-CAMPAIGN-ISSUANCE-LIV-002", metadata: { demo: true } },
      { merchantId: manc.id, campaignId: mancCampaign.id, fanUserId: userRows[4]!.id, ledgerEntryId: ledgerId("DEMO-MANC-ISSUE-001"), issuedPoints: 4_200, status: "posted", sourceEventKey: "MANC-OPENING-USER-5", idempotencyKey: "DEMO-CAMPAIGN-ISSUANCE-MANC-001", metadata: { demo: true } },
    ]).onConflictDoNothing();

    await tx.insert(merchantSettlementsTable).values([
      { merchantId: liv.id, periodStart: daysBefore(31), periodEnd: daysBefore(15), status: "settled", issuedPoints: 10_000, redeemedPoints: 2_400, transferInPoints: 0, transferOutPoints: 900, reserveContributionCents: 1_000, reserveReleaseCents: 240, netFloatCents: 760, externalReference: "DEMO-SETTLEMENT-LIV-001", settledAt: daysBefore(14) },
      { merchantId: liv.id, periodStart: daysBefore(14), periodEnd: daysBefore(1), status: "pending", issuedPoints: 2_500, redeemedPoints: 350, transferInPoints: 0, transferOutPoints: 0, reserveContributionCents: 250, reserveReleaseCents: 35, netFloatCents: 215, externalReference: "DEMO-SETTLEMENT-LIV-002" },
      { merchantId: manc.id, periodStart: daysBefore(20), periodEnd: daysBefore(5), status: "processing", issuedPoints: 4_200, redeemedPoints: 950, transferInPoints: 900, transferOutPoints: 0, reserveContributionCents: 420, reserveReleaseCents: 95, netFloatCents: 325, externalReference: "DEMO-SETTLEMENT-MANC-001" },
      { merchantId: manc.id, periodStart: daysBefore(40), periodEnd: daysBefore(21), status: "failed", externalReference: "DEMO-SETTLEMENT-MANC-000", failureReason: "Demo provider reconciliation delay" },
    ]).onConflictDoNothing();

    await tx.insert(merchantAlertsTable).values([
      { merchantId: liv.id, severity: "warning", category: "transfer", title: "Incoming transfer pending", message: "650 RWLO from Manchester City Official Store is awaiting network confirmation.", actionPath: "/app/transfers", state: "open", createdAt: daysBefore(1) },
      { merchantId: liv.id, severity: "info", category: "settlement", title: "Settlement prepared", message: "Your current settlement period is ready for processing.", actionPath: "/app/settlements", state: "read", createdAt: daysBefore(2) },
      { merchantId: manc.id, severity: "critical", category: "settlement", title: "Settlement needs attention", message: "A previous demo settlement requires reconciliation before it can be closed.", actionPath: "/app/settlements", state: "open", createdAt: daysBefore(4) },
      { merchantId: manc.id, severity: "info", category: "system", title: "Ledger migration complete", message: "Merchant loyalty reporting is available for this development fixture.", state: "resolved", createdAt: daysBefore(10), resolvedAt: daysBefore(9) },
    ]).onConflictDoNothing();

    const userIds = userRows.map((user) => user.id);
    await tx.delete(userCardsTable).where(inArray(userCardsTable.userId, userIds));
    await tx.insert(userCardsTable).values(
      userRows.map((user, index) => ({
        userId: user.id,
        cardHolder: `${user.firstName} ${user.lastName}`.toUpperCase(),
        last4Digits: cardLastFour[index % cardLastFour.length],
        expiry: `${String((index % 12) + 1).padStart(2, "0")}/${27 + (index % 4)}`,
        cardType: "REWLO PREMIUM",
        provider: "Mastercard",
        isDefault: true,
      })),
    );

    await tx.insert(walletTransactionsTable).values(
      userRows.flatMap((user, index) => {
        const merchant = merchantRows[index % merchantRows.length];
        const type = transactionTypes[index % transactionTypes.length];
        const amountCents = type === "reward" || type === "mint" ? 0 : index % 2 === 0 ? -((index + 2) * 525) : (index + 2) * 525;
        const points = type === "reward" || type === "mint" ? 100 + index * 25 : type === "redeem" || type === "burn" ? -(100 + index * 10) : 0;
        const entries: TransactionType[] = ["top_up", type, "merchant_payment"];
        return entries.map((entryType, sequence) => ({
          userId: user.id,
          relatedUserId: entryType === "send" || entryType === "receive" || entryType === "transfer" ? userRows[(index + 1) % userRows.length].id : null,
          merchantId: entryType === "merchant_payment" ? merchant.id : null,
          type: sequence === 1 ? type : entryType,
          status: "completed" as const,
          amountCents: sequence === 1 ? amountCents : entryType === "top_up" ? 5_000 : -2_500,
          rewardPointsDelta: sequence === 1 ? points : entryType === "merchant_payment" ? 75 : 0,
          reference: `DEMO-${user.id}-${sequence + 1}`,
          externalTransactionId: entryType === "merchant_payment" ? `EXT-${user.id}-${sequence + 1}` : null,
          blockchainHash: type === "mint" || type === "burn" || type === "transfer" ? `0xdemo${String(user.id).padStart(8, "0")}${sequence}` : null,
          description: `Demo ${String(sequence === 1 ? type : entryType).replaceAll("_", " ")} transaction`,
          metadata: { demo: true, seedVersion: 1 },
        }));
      }),
    ).onConflictDoNothing();
  });

  console.log("Seeded 2 roles, 20 fan users, 10 merchants, wallet transactions, and additive merchant-ledger fixtures for LIV001 and MANC001.");
}

seed().catch((error: unknown) => {
  console.error("Demo seed failed", error);
  process.exitCode = 1;
});
