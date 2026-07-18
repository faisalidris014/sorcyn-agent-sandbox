/**
 * Backfill (#363): assign a valid subcategory to every post where
 * `subcategory_id IS NULL`.
 *
 * Context: #321 (PR #361) made a subcategory REQUIRED on new posts at the Zod +
 * service layer, but — per the forward-compatible-migration rule — left
 * `posts.subcategory_id` NULLABLE in the database. Legacy/seed rows created
 * before #321 can still hold NULL. This grandfathers them so the app-layer
 * invariant also holds for existing data. It is the prerequisite for the later
 * `ALTER TABLE posts ALTER COLUMN subcategory_id SET NOT NULL` migration, which
 * is NOT part of this script — that change is forward-incompatible and must ship
 * in a release window AFTER the prior version has drained (CLAUDE.md rule +
 * closeout-audit gate). This script only backfills data.
 *
 * Assignment rule, per null-subcategory post:
 *   1. Prefer the `other_*` catch-all child of the post's category.
 *   2. Else the first active child (lowest sortOrder).
 *   3. Else (the category has no active children): log loudly and SKIP — never
 *      guess a subcategory from a different category.
 *
 * The chosen subcategory is always a child of the post's own `category_id`, so
 * the service-layer parent/child consistency invariant is preserved.
 *
 * Idempotent: only rows where `subcategory_id IS NULL` are touched, so re-runs
 * are safe. Soft-deleted posts (`deleted_at IS NOT NULL`) are INCLUDED — the
 * future NOT NULL constraint applies to every row in the table, not just live
 * ones.
 *
 * Usage (targets the Doppler `dev` DATABASE_URL = shared Supabase dev DB):
 *   doppler run -- bash -c 'cd backend && npm run db:backfill-subcategories -- --dry-run'
 *   doppler run -- bash -c 'cd backend && npm run db:backfill-subcategories'
 */
import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { urlNeedsSsl, stripSslMode } from '../src/config/db-ssl.js';

const DRY_RUN = process.argv.includes('--dry-run');

const rawDatabaseUrl = process.env.DATABASE_URL;
if (!rawDatabaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. Run under Doppler: ' +
      "doppler run -- bash -c 'cd backend && npm run db:backfill-subcategories'",
  );
}

const pool = new pg.Pool({
  connectionString: stripSslMode(rawDatabaseUrl),
  ...(urlNeedsSsl(rawDatabaseUrl, process.env.NODE_ENV)
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TAG = '[backfill-subcategories]';

async function main() {
  // 1. Load all categories once; index active children by parent, pre-sorted by
  //    sortOrder so `find(other_*)` and the `[0]` fallback are both cheap.
  const categories = await prisma.category.findMany({
    select: { id: true, slug: true, parentCategoryId: true, isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  const slugOf = new Map(categories.map((c) => [c.id, c.slug]));
  const childrenByParent = new Map<string, { id: string; slug: string }[]>();
  for (const c of categories) {
    if (!c.parentCategoryId || !c.isActive) continue;
    const arr = childrenByParent.get(c.parentCategoryId) ?? [];
    arr.push({ id: c.id, slug: c.slug });
    childrenByParent.set(c.parentCategoryId, arr);
  }

  // 2. Every post still missing a subcategory (incl. soft-deleted).
  const posts = await prisma.post.findMany({
    where: { subcategoryId: null },
    select: { id: true, categoryId: true, deletedAt: true },
  });

  const deletedCount = posts.filter((p) => p.deletedAt !== null).length;
  console.log(
    `${TAG} mode=${DRY_RUN ? 'DRY-RUN (no writes)' : 'APPLY'} — ` +
      `${posts.length} posts with NULL subcategory_id ` +
      `(${posts.length - deletedCount} live, ${deletedCount} soft-deleted).`,
  );
  if (posts.length === 0) {
    console.log(`${TAG} Nothing to backfill. ✅`);
    return;
  }

  // 3. Audit summary: null rows grouped by their current category.
  const byCategory = new Map<string, number>();
  for (const p of posts) {
    byCategory.set(p.categoryId, (byCategory.get(p.categoryId) ?? 0) + 1);
  }
  console.log(`${TAG} null rows by category:`);
  for (const [cid, n] of [...byCategory.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${slugOf.get(cid) ?? cid}: ${n}`);
  }

  // 4. Resolve a target subcategory per post; apply unless dry-run.
  let updated = 0;
  const skipped: { postId: string; category: string }[] = [];
  const plan = new Map<string, number>(); // target slug -> count

  for (const post of posts) {
    const children = childrenByParent.get(post.categoryId) ?? [];
    if (children.length === 0) {
      const category = slugOf.get(post.categoryId) ?? post.categoryId;
      skipped.push({ postId: post.id, category });
      console.warn(
        `${TAG} ⚠️  post ${post.id}: category "${category}" has no active ` +
          `children — SKIPPED (needs manual triage).`,
      );
      continue;
    }
    const target = children.find((c) => c.slug.startsWith('other_')) ?? children[0];
    plan.set(target.slug, (plan.get(target.slug) ?? 0) + 1);

    if (DRY_RUN) {
      updated++;
    } else {
      // Guard the write with `subcategoryId: null` (updateMany no-ops on 0
      // matches instead of throwing like update() would) so a subcategory
      // assigned concurrently between the read above and this write is never
      // clobbered — the count stays truthful too.
      const { count } = await prisma.post.updateMany({
        where: { id: post.id, subcategoryId: null },
        data: { subcategoryId: target.id },
      });
      updated += count;
    }
  }

  console.log(`${TAG} ${DRY_RUN ? 'planned assignments (dry-run)' : 'applied assignments'}:`);
  for (const [slug, n] of [...plan.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  -> ${slug}: ${n}`);
  }
  console.log(
    `${TAG} ${updated} ${DRY_RUN ? 'would be updated' : 'updated'}, ` +
      `${skipped.length} skipped (no children).`,
  );
  if (skipped.length > 0) {
    console.log(`${TAG} straggler post IDs (manual triage needed):`);
    for (const s of skipped) console.log(`  ${s.postId} (category "${s.category}")`);
    // Non-zero exit so CI / operators notice unresolved rows without failing hard.
    process.exitCode = 2;
  }
}

main()
  .catch((err) => {
    console.error(`${TAG} failed:`, err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
