/**
 * Targeted Discover-feed seed (Faisal) — #315 manual UI verification.
 *
 * Creates a handful of clearly-labeled, discover-ELIGIBLE seeded posts (one per
 * Products / Services / Jobs tab), each with a pending seller offer, so the
 * populated buyer Discover feed can be eyeballed in the simulator. A post only
 * surfaces in Discover when it is active, publicly visible (publicAfter null), and
 * has >=1 pending offer — so unlike `db:seed-cold-start` (posts only, no offers)
 * this script also attaches offers.
 *
 * Everything is obviously test data:
 *   - titles are prefixed "[SEED · Faisal]" (visible in-app and in the DB),
 *   - all users live under the reserved @faisal.seed.invalid domain (RFC 2606),
 *     so they can never collide with real accounts and are trivial to clean up.
 *
 * Offers come from dedicated seed sellers (NOT seller@/both@test.com), so a real
 * viewer is never excluded by the "you already offered on this" filter, and the
 * author is a dedicated seed buyer (NOT buyer@/both@test.com), so BOTH test
 * accounts can see the posts.
 *
 * Idempotent — re-running clears the prior Faisal-seed rows first. `--reset` only
 * removes them. Run against the shared dev DB via Doppler:
 *   doppler run -- bash -c 'cd backend && npx tsx scripts/seed-discover-faisal.ts'
 *   doppler run -- bash -c 'cd backend && npx tsx scripts/seed-discover-faisal.ts --reset'
 */
import bcrypt from 'bcrypt';
import { prisma } from '../src/config/database.js';

const DOMAIN = 'faisal.seed.invalid';
const LABEL = '[SEED · Faisal]';

async function removeSeed(): Promise<number> {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: `@${DOMAIN}` } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length > 0) {
    // Delete posts first (offers cascade from posts / sellers), then the users.
    await prisma.post.deleteMany({ where: { buyerId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
  return ids.length;
}

async function main(): Promise<void> {
  const removed = await removeSeed();
  console.log(`cleanup: removed ${removed} prior Faisal-seed user(s) (+ their posts/offers).`);
  if (process.argv.includes('--reset')) {
    console.log('--reset complete.');
    return;
  }

  // Resolve root category UUIDs by slug from the SAME DB the app reads, so each
  // post's categoryId exactly matches the id the matching Discover tab queries.
  const cats = await prisma.category.findMany({ select: { id: true, slug: true } });
  const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id])) as Record<string, string>;
  // Every post must carry a subcategory (#321), so resolve those slugs too.
  for (const slug of ['products', 'services', 'jobs', 'furniture', 'cleaning', 'part_time']) {
    if (!catId[slug]) throw new Error(`Missing category '${slug}' — run: npm run db:seed`);
  }

  const passwordHash = await bcrypt.hash('SeedDisabled123!', 12); // accounts are not meant for login
  const mkUser = (local: string, accountType: 'buyer' | 'seller', firstName: string, lastName: string) =>
    prisma.user.create({
      data: {
        email: `${local}@${DOMAIN}`,
        passwordHash,
        accountType,
        firstName,
        lastName,
        emailVerified: true,
        status: 'active',
        locationCity: 'Dallas',
        locationState: 'TX',
        locationZip: '75201',
        latitude: 32.7767,
        longitude: -96.797,
      },
      select: { id: true },
    });

  const buyer = await mkUser('discover.buyer', 'buyer', 'Faisal', 'SeedBuyer');
  const sellerU1 = await mkUser('discover.seller1', 'seller', 'Faisal', 'SeedSellerA');
  const sellerU2 = await mkUser('discover.seller2', 'seller', 'Faisal', 'SeedSellerB');

  const allCats = [catId.products, catId.services, catId.jobs];
  const sp1 = await prisma.sellerProfile.create({
    data: { userId: sellerU1.id, businessName: `${LABEL} Lone Star Services`, categories: allCats },
    select: { id: true },
  });
  const sp2 = await prisma.sellerProfile.create({
    data: { userId: sellerU2.id, businessName: `${LABEL} Trinity Trades`, categories: allCats },
    select: { id: true },
  });

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const mkPost = (
    categoryId: string,
    subcategoryId: string,
    title: string,
    description: string,
    extra: Record<string, unknown> = {},
  ) =>
    prisma.post.create({
      data: {
        buyerId: buyer.id,
        categoryId,
        subcategoryId,
        title: `${LABEL} ${title}`,
        description,
        budgetType: 'open',
        locationCity: 'Dallas',
        locationState: 'TX',
        locationZip: '75201',
        latitude: 32.7767,
        longitude: -96.797,
        marketplaceContext: 'b2c',
        status: 'active',
        isSeed: true,
        publicAfter: null, // immediately public — no 3-day exclusivity hold
        expiresAt,
        ...extra,
      },
      select: { id: true },
    });
  const mkOffer = (
    postId: string,
    sellerId: string,
    offerType: 'service' | 'product' | 'job_application',
    quoteAmount: number,
    message: string,
    agoMs: number,
  ) =>
    prisma.offer.create({
      data: {
        postId,
        sellerId,
        offerType,
        quoteAmount,
        status: 'pending',
        message,
        createdAt: new Date(Date.now() - agoMs),
      },
      select: { id: true },
    });

  // Products tab — two offers (exercises the multi-offer card + oldest-first order).
  const prod = await mkPost(
    catId.products,
    catId.furniture,
    'Looking for a used standing desk in Fort Worth',
    'Want a height-adjustable standing desk in good condition, Fort Worth area. Flexible on pickup.',
    { budgetType: 'range', budgetMin: 50, budgetMax: 300, categorySpecific: { condition: 'good' } },
  );
  await mkOffer(prod.id, sp1.id, 'product', 180, 'Electric sit/stand desk, barely used — can deliver in DFW this week.', 2 * 60 * 60 * 1000);
  await mkOffer(prod.id, sp2.id, 'product', 150, 'Manual crank standing desk, solid condition, porch pickup in Fort Worth.', 1 * 60 * 60 * 1000);

  // Services tab — one offer.
  const svc = await mkPost(
    catId.services,
    catId.cleaning,
    'Need a house cleaner in Dallas',
    'Recurring biweekly cleaning for a 2-bedroom apartment in Dallas. Supplies provided.',
  );
  await mkOffer(svc.id, sp1.id, 'service', 120, 'Biweekly cleaning, flat rate, references available. Could start this weekend.', 90 * 60 * 1000);

  // Jobs tab — one offer.
  const job = await mkPost(
    catId.jobs,
    catId.part_time,
    'Hiring a part-time warehouse helper in Irving',
    'Part-time warehouse helper, ~20 hrs/week, lifting up to 40 lbs, Irving location.',
  );
  await mkOffer(job.id, sp2.id, 'job_application', 18, 'Available 20 hrs/week, warehouse experience, can start immediately.', 30 * 60 * 1000);

  console.log('Seeded discover-eligible posts:');
  console.log(`  Products: ${prod.id}  (2 offers)`);
  console.log(`  Services: ${svc.id}  (1 offer)`);
  console.log(`  Jobs:     ${job.id}  (1 offer)`);
  console.log(`All titled "${LABEL} ...". Author + sellers under @${DOMAIN}.`);
  console.log('View from buyer@test.com or both@test.com → Discover → pull to refresh each tab.');
}

main()
  .catch((e) => {
    console.error('Faisal discover seed failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
