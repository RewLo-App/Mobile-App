export type MerchantIdentity = { merchantId: number; merchantCode: string; merchantName: string; membershipRole: string };

/** A request is intentionally denied when its JWT identity has zero or ambiguous merchant scopes. */
export function singleMerchantMembership(memberships: MerchantIdentity[]): MerchantIdentity | null {
  return memberships.length === 1 ? memberships[0]! : null;
}
