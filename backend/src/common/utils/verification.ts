/**
 * Shared seller-verification helpers.
 *
 * Extracted from admin.service.ts (#336) so both the admin verification-review
 * flow and the seller category-access grant flow compute badges/tiers the same
 * way. Pure functions — no Prisma, no I/O.
 */

/** Map a verification/document type to its SellerProfile boolean badge field. */
export function getBadgeField(verificationType: string): string {
  const map: Record<string, string> = {
    id: 'idVerified',
    ein: 'einVerified',
    sales_tax: 'salesTaxVerified',
    license: 'licenseVerified',
    insurance: 'insuranceVerified',
    background_check: 'backgroundCheckVerified',
  };
  return map[verificationType] ?? 'idVerified';
}

/** Owner-facing credential status (license/insurance) derived at serialize time. */
export type CredentialStatus = 'verified' | 'expiring' | 'expired';

/**
 * Remove a badge string from the seller's `verificationBadges` array (#382 PR2).
 * Inverse of the `newBadges.push(...)` in `grantCategoryAccess`. Returns a new
 * array; a no-op (returns an equal copy) when the badge isn't present.
 */
export function removeBadge(badges: string[], badgeName: string): string[] {
  return badges.filter((b) => b !== badgeName);
}

/**
 * True once a dated credential has fully lapsed (#382 PR2). Day-granular in UTC to
 * match `@db.Date` storage and the `deriveCredentialStatus` boundary: a credential
 * whose `expiresAt` is *today* is still valid (owner sees `expiring`); it lapses the
 * day AFTER, exactly when `deriveCredentialStatus` starts returning `expired`. Kept
 * strictly `<` (not `<=`) so the sweep and the owner serializer never disagree.
 */
export function isCredentialExpired(expiry: Date | null, now: Date): boolean {
  if (!expiry) return false;
  return startOfDayUTC(expiry).getTime() < startOfDayUTC(now).getTime();
}

/**
 * Normalize a Date to UTC midnight (start of day). `@db.Date` columns store a
 * date with no time, so all expiry comparisons must be day-granular in UTC to
 * avoid an off-by-one lapse depending on the server clock's time-of-day. Shared
 * by the owner serializer (#382 PR1) and the daily lapse sweep (PR2).
 */
export function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Owner-facing derived status for a license/insurance credential (#382). Computed
 * at serialize time, never persisted — mirrors the `salesTaxStatus` precedent.
 *
 * MUST consult the persisted request status, not just the boolean: once the daily
 * sweep lapses a credential it flips the boolean to false AND sets the request
 * `status='expired'`. Reading only the boolean would render a lapsed credential as
 * "never earned" (null) instead of "renew" (`expired`).
 *
 * @param verified  the SellerProfile.{license,insurance}Verified boolean
 * @param expiry    the SellerProfile.{license,insurance}Expiry date (or null)
 * @param latestRequestStatus  status of the seller's latest request of this type
 * @param now       current time (injected for testability)
 * @param windowDays how many days ahead counts as "expiring" (default 30)
 */
export function deriveCredentialStatus(
  verified: boolean,
  expiry: Date | null,
  latestRequestStatus: string | null,
  now: Date,
  windowDays = 30,
): CredentialStatus | null {
  // The sweep marked it lapsed — surface "renew", not "never earned".
  if (latestRequestStatus === 'expired') return 'expired';
  // Never earned (and not lapsed) → nothing to show.
  if (!verified) return null;
  // Verified with no expiry on file → treat as valid.
  if (!expiry) return 'verified';

  const today = startOfDayUTC(now).getTime();
  const exp = startOfDayUTC(expiry).getTime();
  // Expiry day has fully passed but the daily sweep hasn't run yet.
  if (exp < today) return 'expired';
  const daysUntil = Math.round((exp - today) / 86_400_000);
  if (daysUntil <= windowDays) return 'expiring';
  return 'verified';
}

/**
 * Derive the seller's verification tier from their badge booleans.
 * Tier 1 = email base, 2 = id/ein/sales_tax, 3 = license/insurance, 4 = background_check.
 */
export function calculateVerificationTier(seller: {
  emailVerified: boolean;
  idVerified: boolean;
  einVerified: boolean;
  salesTaxVerified?: boolean;
  licenseVerified: boolean;
  insuranceVerified: boolean;
  backgroundCheckVerified: boolean;
}): number {
  let tier = 1; // Base tier (email)
  if (seller.idVerified || seller.einVerified || seller.salesTaxVerified) tier = 2;
  if (seller.licenseVerified || seller.insuranceVerified) tier = 3;
  if (seller.backgroundCheckVerified) tier = 4;
  return tier;
}
