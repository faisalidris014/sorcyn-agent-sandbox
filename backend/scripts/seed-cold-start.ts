/**
 * Cold-start generation (#207): seed FAKE BUYER posts across the DFW metroplex so
 * the marketplace looks active at launch. NEVER seeds fake sellers.
 *
 * Pairs with the seeded-post behavior already in the app (#37): once a real seller
 * offers on one of these posts it surfaces in the buyer discovery feed, and a real
 * buyer can clone it into their own real post. A seeded post is never a real
 * counterparty — no money ever touches it.
 *
 * Idempotent: each post carries a stable `requirements.coldStartKey`; re-running
 * only creates the keys that don't exist yet (safe to re-run; never duplicates and
 * never deletes posts that may have drawn real offers).
 *
 * Usage:
 *   doppler run -- bash -c 'cd backend && npm run db:seed-cold-start'
 *   SEED_POSTS_PER_ZIP=2 SEED_BUYER_POOL=50 SEED_POST_TTL_DAYS=30 ... (env overrides)
 *   npm run db:seed-cold-start -- --reset   # DESTRUCTIVE: removes all seeded data
 *
 * See docs/COLD_START.md.
 */
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, AccountType, UserStatus, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { readFileSync } from 'node:fs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Reserved .invalid TLD (RFC 2606) → these can never collide with real users and
// are trivially identifiable for cleanup.
const SEED_EMAIL_DOMAIN = 'seed.sorcyn.invalid';
const POSTS_PER_ZIP = Number(process.env.SEED_POSTS_PER_ZIP ?? 2);
const BUYER_POOL = Number(process.env.SEED_BUYER_POOL ?? 50);
const TTL_DAYS = Number(process.env.SEED_POST_TTL_DAYS ?? 30);
// ~60% services / 40% products — DFW launch leans local services.
const SERVICES_SHARE = 0.6;

const FIRST_NAMES = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Jamie', 'Avery', 'Quinn', 'Sam', 'Drew', 'Skyler'];
const LAST_NAMES = ['Nguyen', 'Patel', 'Garcia', 'Smith', 'Johnson', 'Lee', 'Martinez', 'Brown', 'Davis', 'Lopez', 'Wilson', 'Khan'];

// Per-subcategory templates: { sub slug, title items }. Each produces a plausible,
// obviously-generic buyer request — never impersonating a real person.
const SERVICE_TEMPLATES: Array<{ sub: string; verb: string; items: string[] }> = [
  { sub: 'plumbing', verb: 'Need a plumber for', items: ['a leaking kitchen faucet', 'a running toilet', 'a water heater install', 'a clogged main line'] },
  { sub: 'electrical', verb: 'Need an electrician for', items: ['installing ceiling fans', 'adding outlets in the garage', 'a panel upgrade', 'a breaker that keeps tripping'] },
  { sub: 'hvac', verb: 'Need HVAC help with', items: ['an AC that won\'t cool', 'a furnace tune-up', 'a smart thermostat install', 'a full system inspection'] },
  { sub: 'cleaning', verb: 'Need house cleaning for', items: ['a 3-bedroom deep clean', 'a move-out clean', 'recurring biweekly cleaning', 'a post-construction clean'] },
  { sub: 'landscaping', verb: 'Need landscaping for', items: ['weekly lawn mowing', 'tree trimming', 'flower bed cleanup', 'new sod installation'] },
  { sub: 'handyman', verb: 'Need a handyman for', items: ['mounting a large TV', 'assembling flat-pack furniture', 'fixing a sagging fence gate', 'patching and painting drywall'] },
];
const PRODUCT_TEMPLATES: Array<{ sub: string; items: string[] }> = [
  { sub: 'electronics', items: ['a used iPad', 'a gaming laptop', 'a 55-inch TV', 'noise-cancelling headphones'] },
  { sub: 'furniture', items: ['a sectional couch', 'a solid wood dining table', 'a queen bed frame', 'a standing desk'] },
  { sub: 'appliances', items: ['a refrigerator', 'a washer and dryer set', 'a countertop microwave', 'a dishwasher'] },
];
const CONDITIONS = ['new', 'like_new', 'excellent', 'good'];

interface ZipRec { zip: string; lat: number; lng: number; city: string }

function loadZips(): ZipRec[] {
  const path = new URL('./data/dfw-zips.json', import.meta.url);
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as { zips: ZipRec[] };
  return parsed.zips;
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

// Every post must carry a subcategory (#321) — fail loudly rather than seed a
// top-level-only post if a template slug ever drifts from the seeded categories.
function resolveSub(catId: Record<string, string>, slug: string): string {
  const id = catId[slug];
  if (!id) throw new Error(`Template subcategory '${slug}' not seeded — run npm run db:seed first`);
  return id;
}

async function resetSeedData(): Promise<void> {
  const buyers = await prisma.user.findMany({
    where: { email: { endsWith: `@${SEED_EMAIL_DOMAIN}` } },
    select: { id: true },
  });
  const ids = buyers.map((b) => b.id);
  console.log(`--reset: deleting ${ids.length} synthetic buyers (cascades to their seeded posts + any offers on them)...`);
  if (ids.length > 0) {
    // Cloned REAL posts keep their rows — sourceSeedPostId/referredSellerId are
    // SET NULL on delete, so real buyers' posts are never removed.
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
  console.log('--reset complete. Re-run without --reset to regenerate.');
}

async function ensureBuyerPool(zips: ZipRec[]): Promise<string[]> {
  const passwordHash = await bcrypt.hash(`seed-${Date.now()}-disabled`, 12); // never used to log in
  const ids: string[] = [];
  for (let i = 0; i < BUYER_POOL; i++) {
    const email = `coldstart+${String(i).padStart(3, '0')}@${SEED_EMAIL_DOMAIN}`;
    const loc = pick(zips, i * 7);
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        accountType: AccountType.buyer,
        firstName: pick(FIRST_NAMES, i),
        lastName: pick(LAST_NAMES, i * 3),
        emailVerified: true,
        status: UserStatus.active,
        locationCity: loc.city,
        locationState: 'TX',
        locationZip: loc.zip,
        latitude: loc.lat,
        longitude: loc.lng,
      },
      select: { id: true },
    });
    ids.push(user.id);
  }
  return ids;
}

async function main(): Promise<void> {
  if (process.argv.includes('--reset')) {
    await resetSeedData();
    return;
  }

  const zips = loadZips();
  console.log(`Cold-start: ${zips.length} DFW zips × ${POSTS_PER_ZIP} posts, pool ${BUYER_POOL} buyers, TTL ${TTL_DAYS}d`);

  // Resolve category UUIDs (slug -> id) for services/products + their subcategories.
  const cats = await prisma.category.findMany({ select: { id: true, slug: true } });
  const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id])) as Record<string, string>;
  if (!catId.services || !catId.products) {
    throw new Error('Categories not seeded (missing services/products). Run npm run db:seed first.');
  }

  const buyerIds = await ensureBuyerPool(zips);

  // Existing seed keys → idempotent skip.
  const existing = await prisma.post.findMany({
    where: { isSeed: true },
    select: { requirements: true },
  });
  const seen = new Set<string>();
  for (const p of existing) {
    const key = (p.requirements as Record<string, unknown> | null)?.coldStartKey;
    if (typeof key === 'string') seen.add(key);
  }

  const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
  let created = 0;
  let skipped = 0;
  let n = 0;

  for (const z of zips) {
    for (let i = 0; i < POSTS_PER_ZIP; i++) {
      const coldStartKey = `${z.zip}-${i}`;
      if (seen.has(coldStartKey)) {
        skipped++;
        continue;
      }
      const isService = (n % 10) / 10 < SERVICES_SHARE;
      n++;

      let categoryId: string;
      let subcategoryId: string;
      let title: string;
      let categorySpecific: Prisma.InputJsonValue = {};

      if (isService) {
        const t = pick(SERVICE_TEMPLATES, n);
        const item = pick(t.items, i + n);
        categoryId = catId.services;
        subcategoryId = resolveSub(catId, t.sub);
        title = `${t.verb} ${item} in ${z.city}`;
      } else {
        const t = pick(PRODUCT_TEMPLATES, n);
        const item = pick(t.items, i + n);
        categoryId = catId.products;
        subcategoryId = resolveSub(catId, t.sub);
        title = `Looking to buy ${item} in ${z.city}`;
        categorySpecific = { condition: pick(CONDITIONS, n) };
      }

      const buyerId = pick(buyerIds, n);
      const description =
        `${title}. Local to ${z.city}, TX (${z.zip}) and flexible on timing — ` +
        `reach out with what you can offer and your availability.`;

      await prisma.post.create({
        data: {
          buyerId,
          categoryId,
          subcategoryId,
          title,
          description,
          budgetType: isService ? 'open' : 'range',
          budgetMin: isService ? null : 50,
          budgetMax: isService ? null : 600,
          locationCity: z.city,
          locationState: 'TX',
          locationZip: z.zip,
          latitude: z.lat,
          longitude: z.lng,
          categorySpecific,
          requirements: { coldStart: true, coldStartKey },
          marketplaceContext: 'b2c',
          status: 'active',
          isSeed: true,
          publicAfter: null, // immediately public — no exclusivity hold
          expiresAt,
        },
      });
      created++;
    }
  }

  console.log(`Done. Created ${created} seeded posts, skipped ${skipped} already-present.`);
  console.log(`Synthetic buyers: ${buyerIds.length} (emails @${SEED_EMAIL_DOMAIN}).`);
}

main()
  .catch((e) => {
    console.error('Cold-start seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
