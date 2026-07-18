import { Prisma } from '@prisma/client';
import { NotFoundError } from '../../common/utils/errors.js';
import { calculateVerificationTier } from '../../common/utils/verification.js';

/**
 * Atomic category-access grant (#336). Shared by the seller auto-approve path and
 * the admin manual-approve path. MUST run inside a `$transaction` (pass the `tx`
 * client) so the profile update is atomic with the request-row update.
 *
 * Escrow safety: only ever called on a CLEAN approval (instant or verified), never
 * optimistically. Granting a category here is what unlocks the Find Work feed.
 */
export interface GrantCategoryAccessParams {
  sellerId: string;
  /** Granted subcategory UUIDs (these gate the feed). */
  subcategoryIds: string[];
  /** Whether any granted subcategory is licensed → flips the Licensed badge. */
  isLicensed: boolean;
  /** Whether any granted subcategory needs a background check → flips that badge. */
  requiresBackgroundCheck: boolean;
}

function unionUnique(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}

export async function grantCategoryAccess(
  tx: Prisma.TransactionClient,
  params: GrantCategoryAccessParams,
): Promise<void> {
  const seller = await tx.sellerProfile.findUnique({
    where: { id: params.sellerId },
    select: {
      categories: true,
      subcategories: true,
      verificationBadges: true,
      emailVerified: true,
      idVerified: true,
      einVerified: true,
      salesTaxVerified: true,
      licenseVerified: true,
      insuranceVerified: true,
      backgroundCheckVerified: true,
    },
  });
  if (!seller) throw new NotFoundError('Seller profile', params.sellerId);

  const currentCategories = Array.isArray(seller.categories)
    ? (seller.categories as string[])
    : [];
  const currentSubcategories = Array.isArray(seller.subcategories)
    ? (seller.subcategories as string[])
    : [];
  const badges = Array.isArray(seller.verificationBadges)
    ? (seller.verificationBadges as string[])
    : [];

  // getFeed scopes SellerProfile.categories against post.categoryId OR
  // post.subcategoryId, so union the granted SUB ids into `categories` (NOT the
  // major id — that would match post.categoryId and over-grant the whole major).
  // Mirror into `subcategories` for granularity / future UI.
  const newCategories = unionUnique(currentCategories, params.subcategoryIds);
  const newSubcategories = unionUnique(currentSubcategories, params.subcategoryIds);

  // A clean grant of a licensed / background-check category establishes that badge.
  // `id` is intentionally never auto-flipped here — Stripe Identity stays authoritative.
  const licenseVerified = seller.licenseVerified || params.isLicensed;
  const backgroundCheckVerified =
    seller.backgroundCheckVerified || params.requiresBackgroundCheck;

  const newBadges = [...badges];
  if (params.isLicensed && !newBadges.includes('license_verified')) {
    newBadges.push('license_verified');
  }
  if (
    params.requiresBackgroundCheck &&
    !newBadges.includes('background_check_verified')
  ) {
    newBadges.push('background_check_verified');
  }

  const tier = calculateVerificationTier({
    emailVerified: seller.emailVerified,
    idVerified: seller.idVerified,
    einVerified: seller.einVerified,
    salesTaxVerified: seller.salesTaxVerified,
    licenseVerified,
    insuranceVerified: seller.insuranceVerified,
    backgroundCheckVerified,
  });

  await tx.sellerProfile.update({
    where: { id: params.sellerId },
    data: {
      categories: newCategories as Prisma.InputJsonValue,
      subcategories: newSubcategories as Prisma.InputJsonValue,
      verificationBadges: newBadges as Prisma.InputJsonValue,
      licenseVerified,
      backgroundCheckVerified,
      verificationTier: tier,
    },
  });
}
