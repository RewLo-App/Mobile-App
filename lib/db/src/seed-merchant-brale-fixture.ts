import { eq } from "drizzle-orm";
import { db } from "./index";
import { merchantsTable, usersTable } from "./schema";

const SOURCE_FAN_EMAIL = "rata@rewlo.dev";
const TARGET_MERCHANT_CODE = "LIV001";

/**
 * Local integration-test fixture only. It deliberately reuses the configured
 * fan's Brale custody identifiers for LIV001, so Merchant Pay can be tested
 * without creating another provider wallet. Do not use in production.
 */
async function seedMerchantBraleFixture() {
  await db.transaction(async (tx) => {
    const [fan] = await tx
      .select({
        id: usersTable.id,
        braleAccountId: usersTable.braleAccountId,
        braleWalletId: usersTable.braleWalletId,
        braleAddressId: usersTable.braleAddressId,
        blockchainAddress: usersTable.blockchainAddress,
        blockchainNetwork: usersTable.blockchainNetwork,
        walletProvisioningStatus: usersTable.walletProvisioningStatus,
        walletProvisionedAt: usersTable.walletProvisionedAt,
      })
      .from(usersTable)
      .where(eq(usersTable.normalizedEmail, SOURCE_FAN_EMAIL));
    if (!fan) throw new Error(`Fan ${SOURCE_FAN_EMAIL} was not found.`);
    if (!fan.braleAddressId) throw new Error(`Fan ${SOURCE_FAN_EMAIL} does not have a Brale address to seed.`);

    const [merchant] = await tx
      .select({ id: merchantsTable.id })
      .from(merchantsTable)
      .where(eq(merchantsTable.merchantCode, TARGET_MERCHANT_CODE));
    if (!merchant) throw new Error(`Merchant ${TARGET_MERCHANT_CODE} was not found.`);

    await tx.update(usersTable)
      .set({ status: "suspended" })
      .where(eq(usersTable.id, fan.id));

    await tx.update(merchantsTable)
      .set({
        braleAccountId: fan.braleAccountId,
        braleWalletId: fan.braleWalletId ?? fan.braleAddressId,
        braleAddressId: fan.braleAddressId,
        blockchainAddress: fan.blockchainAddress,
        blockchainNetwork: fan.blockchainNetwork,
        walletProvisioningStatus: fan.walletProvisioningStatus,
        walletProvisioningError: null,
        // Do not copy the fan's provisioning key: it is unique and scoped to
        // its original provisioning attempt.
        walletProvisioningKey: null,
        walletProvisionedAt: fan.walletProvisionedAt ?? new Date(),
      })
      .where(eq(merchantsTable.id, merchant.id));
  });

  console.log(`Suspended ${SOURCE_FAN_EMAIL} and seeded Brale custody on ${TARGET_MERCHANT_CODE}.`);
}

seedMerchantBraleFixture().catch((error: unknown) => {
  console.error("Merchant Brale fixture seed failed", error);
  process.exitCode = 1;
});
