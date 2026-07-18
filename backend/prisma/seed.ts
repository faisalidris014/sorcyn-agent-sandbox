import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
import { PrismaClient, AccountType, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { seedCategories } from './seed-categories.js';
import { seedCategoryVerificationConfig } from './seed-category-verification.js';
import { urlNeedsSsl, stripSslMode } from '../src/config/db-ssl.js';
import { CURRENT_TERMS_VERSION } from '../src/common/constants/terms.js';

// Enable SSL (without full chain verification — Supabase uses a self-signed
// chain) when pointed at a hosted/Supabase DB. Without this, seeding the shared
// Supabase dev DB (#214) fails with a TLS "self-signed certificate" error.
const rawDatabaseUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({
  connectionString: stripSslMode(rawDatabaseUrl),
  ...(urlNeedsSsl(rawDatabaseUrl, process.env.NODE_ENV) ? { ssl: { rejectUnauthorized: false } } : {}),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // ─── Categories ───────────────────────────────────────────
  // catId maps slug -> UUID. SellerProfile.categories/subcategories must store
  // UUIDs (not slugs) so the Jobs notification + targeted-feed queries match
  // posts' categoryId (issue #179).
  const catId = await seedCategories(prisma);

  // ─── Category verification policy (#336) ──────────────────
  // Per-subcategory mode (instant / verify / manual_only) for the seller
  // category-access router. Idempotent; keyed by subcategory UUID.
  const configCount = await seedCategoryVerificationConfig(prisma, catId);

  // ─── Test Users ───────────────────────────────────────────
  const passwordHash = await bcrypt.hash('TestPassword123!', 12);

  // Terms acceptance recorded at signup (#314). Set on create only so a re-seed
  // never rewrites an already-accepted version on an existing account.
  const termsFields = {
    termsAcceptedAt: new Date(),
    termsVersion: CURRENT_TERMS_VERSION,
  };

  const testBuyer = await prisma.user.upsert({
    where: { email: 'buyer@test.com' },
    // Issue #133: refresh the canonical fields so re-seeding REPAIRS a
    // corrupted-but-present account (password/status/verified) instead of
    // silently no-op'ing.
    update: {
      passwordHash,
      accountType: AccountType.buyer,
      firstName: 'Test',
      lastName: 'Buyer',
      emailVerified: true,
      status: UserStatus.active,
    },
    create: {
      email: 'buyer@test.com',
      passwordHash,
      accountType: AccountType.buyer,
      firstName: 'Test',
      lastName: 'Buyer',
      phone: '+12145551001',
      emailVerified: true,
      locationCity: 'Dallas',
      locationState: 'TX',
      locationZip: '75201',
      latitude: 32.7767,
      longitude: -96.797,
      status: UserStatus.active,
      ...termsFields,
    },
  });

  const testSeller = await prisma.user.upsert({
    where: { email: 'seller@test.com' },
    update: {
      passwordHash,
      accountType: AccountType.seller,
      firstName: 'Test',
      lastName: 'Seller',
      emailVerified: true,
      status: UserStatus.active,
    },
    create: {
      email: 'seller@test.com',
      passwordHash,
      accountType: AccountType.seller,
      firstName: 'Test',
      lastName: 'Seller',
      phone: '+12145551002',
      emailVerified: true,
      locationCity: 'Fort Worth',
      locationState: 'TX',
      locationZip: '76102',
      latitude: 32.7555,
      longitude: -97.3308,
      status: UserStatus.active,
      ...termsFields,
    },
  });

  // Create seller profile for test seller.
  // Includes the 'jobs' category so the ranked Jobs-post notification is
  // actually testable end-to-end (issue #179 / #119). Categories stored as
  // UUIDs; the `update` branch re-writes them too so re-seeding an already-seeded
  // dev DB REPAIRS stale slug-based data (issue #133 re-seed-repairs pattern).
  // Store real arrays (NOT JSON.stringify): the `categories` column is a Prisma
  // Json field, and the real seller-registration path (sellers.service.ts) writes
  // the validated array directly. A pre-stringified string would persist as a JSON
  // *string*, so both `array_contains` (Jobs notify) and the `Array.isArray()`
  // read in the targeted feed would silently fail (issue #179).
  const sellerCategories = [catId.services, catId.jobs];
  const sellerSubcategories = [catId.plumbing, catId.handyman];
  await prisma.sellerProfile.upsert({
    where: { userId: testSeller.id },
    update: {
      businessName: 'Test Seller Services',
      categories: sellerCategories,
      subcategories: sellerSubcategories,
      emailVerified: true,
      profileStrength: 60,
    },
    create: {
      userId: testSeller.id,
      businessName: 'Test Seller Services',
      serviceRadiusMiles: 30,
      categories: sellerCategories,
      subcategories: sellerSubcategories,
      bio: 'Experienced handyman and plumber serving the DFW area.',
      yearsExperience: 10,
      verificationTier: 1,
      emailVerified: true,
      profileStrength: 60,
    },
  });

  const testBoth = await prisma.user.upsert({
    where: { email: 'both@test.com' },
    update: {
      passwordHash,
      accountType: AccountType.both,
      firstName: 'Test',
      lastName: 'BothRoles',
      emailVerified: true,
      status: UserStatus.active,
    },
    create: {
      email: 'both@test.com',
      passwordHash,
      accountType: AccountType.both,
      firstName: 'Test',
      lastName: 'BothRoles',
      phone: '+12145551003',
      emailVerified: true,
      locationCity: 'Arlington',
      locationState: 'TX',
      locationZip: '76010',
      latitude: 32.7357,
      longitude: -97.1081,
      status: UserStatus.active,
      ...termsFields,
    },
  });

  const bothCategories = [catId.products, catId.services];
  const bothSubcategories = [catId.electronics, catId.cleaning];
  await prisma.sellerProfile.upsert({
    where: { userId: testBoth.id },
    update: {
      businessName: 'Multi-Role Services',
      categories: bothCategories,
      subcategories: bothSubcategories,
      emailVerified: true,
      profileStrength: 45,
    },
    create: {
      userId: testBoth.id,
      businessName: 'Multi-Role Services',
      serviceRadiusMiles: 25,
      categories: bothCategories,
      subcategories: bothSubcategories,
      bio: 'Buyer and seller in the DFW marketplace.',
      yearsExperience: 5,
      verificationTier: 1,
      emailVerified: true,
      profileStrength: 45,
    },
  });

  // Admin user
  const adminPasswordHash = await bcrypt.hash('AdminSecure456!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@reversemarketplace.com' },
    update: {
      passwordHash: adminPasswordHash,
      emailVerified: true,
      status: UserStatus.active,
      isAdmin: true,
    },
    create: {
      email: 'admin@reversemarketplace.com',
      passwordHash: adminPasswordHash,
      accountType: AccountType.both,
      firstName: 'Platform',
      lastName: 'Admin',
      emailVerified: true,
      locationCity: 'Dallas',
      locationState: 'TX',
      locationZip: '75201',
      status: UserStatus.active,
      isAdmin: true,
      ...termsFields,
    },
  });

  console.log('Seed completed successfully!');
  console.log(`  - 40 categories seeded`);
  console.log(`  - ${configCount} category verification config rows seeded`);
  console.log(`  - 4 test users (buyer, seller, both, admin)`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
