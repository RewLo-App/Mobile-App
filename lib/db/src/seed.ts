import { eq, inArray } from "drizzle-orm";
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
const cardLastFour = ["4821", "7394", "1048", "6612", "9035", "2576", "8140", "3906", "5268", "1479"] as const;
const transactionTypes = [
  "top_up", "send", "receive", "reward", "redeem",
  "merchant_payment", "mint", "burn", "transfer",
] as const;
type TransactionType = (typeof transactionTypes)[number];

async function seed() {
  await db.transaction(async (tx) => {
    await tx.insert(rolesTable).values([{ name: "Fan" }, { name: "Merchant" }]).onConflictDoNothing();
    const [fanRole] = await tx.select().from(rolesTable).where(eq(rolesTable.name, "Fan"));
    if (!fanRole) throw new Error("Fan role was not created");
    await tx.insert(appSettingsTable).values({key:"welcome_points",value:"500"}).onConflictDoUpdate({target:appSettingsTable.key,set:{value:"500"}});
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
      demoUsers.map(async ([firstName, lastName, email, phoneNumber, primaryClubId, rewloCashBalance, rewloRewardPoints]) => {
        const [user] = await tx
          .insert(usersTable)
          .values({
            firstName,
            lastName,
            email,
            phoneNumber,
            roleId: fanRole.id,
            rewloCashBalance,
            rewloRewardPoints,
            primaryClubId,
            followedClubIds: JSON.stringify([primaryClubId]),
            zip: "10001",
          })
          .onConflictDoUpdate({
            target: usersTable.email,
            set: { firstName, lastName, phoneNumber, roleId: fanRole.id, rewloCashBalance, rewloRewardPoints, primaryClubId },
          })
          .returning();
        return user;
      }),
    );

    const userIds = userRows.map((user) => user.id);
    await tx.delete(userCardsTable).where(inArray(userCardsTable.userId, userIds));
    await tx.insert(userCardsTable).values(
      userRows.map((user, index) => ({
        userId: user.id,
        cardHolder: `${user.firstName} ${user.lastName}`.toUpperCase(),
        last4Digits: cardLastFour[index % cardLastFour.length],
        expiry: `${String((index % 12) + 1).padStart(2, "0")}/${27 + (index % 4)}`,
        cardType: "Debit",
        provider: cardProviders[index % cardProviders.length],
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

  console.log("Seeded 2 roles, 20 fan users, 10 merchants, 20 debit cards, and demo wallet transactions.");
}

seed().catch((error: unknown) => {
  console.error("Demo seed failed", error);
  process.exitCode = 1;
});
