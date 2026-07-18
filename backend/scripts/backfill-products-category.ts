/**
 * Backfill (#301): ensure every existing seller profile has the Products MAJOR
 * category in its `categories` array. Products is auto-granted to new sellers at
 * creation; this grandfathers profiles created before that change.
 *
 * ADDITIVE ONLY — never removes existing Services/Jobs grants. Those stay until the
 * seller re-verifies them under the new gated category-request flow.
 *
 * Idempotent: skips profiles that already include Products. Safe to re-run.
 *
 * Usage:
 *   doppler run -- bash -c 'cd backend && npm run db:backfill-products'
 */
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.category.findUnique({
    where: { slug: 'products' },
    select: { id: true },
  });
  if (!products) {
    throw new Error('Products category is not seeded — run the category seed first.');
  }

  const profiles = await prisma.sellerProfile.findMany({
    where: { deletedAt: null },
    select: { id: true, categories: true },
  });

  let updated = 0;
  for (const p of profiles) {
    const cats = Array.isArray(p.categories) ? (p.categories as string[]) : [];
    if (cats.includes(products.id)) continue;
    await prisma.sellerProfile.update({
      where: { id: p.id },
      // Prepend Products; keep any existing grants untouched (grandfathered).
      data: { categories: [products.id, ...cats] },
    });
    updated++;
  }

  console.log(
    `[backfill-products] ${profiles.length} profiles scanned, ${updated} updated, ` +
      `${profiles.length - updated} already had Products.`,
  );
}

main()
  .catch((err) => {
    console.error('[backfill-products] failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
