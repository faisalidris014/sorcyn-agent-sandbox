import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedCategories } from '../prisma/seed-categories.js';
import { seedCategoryVerificationConfig } from '../prisma/seed-category-verification.js';
import { assertTestDatabase } from './db-guard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setup() {
  // Issue #133: load the dedicated test env (NODE_ENV=test + *_test DB), then
  // refuse to proceed unless we are pointed at a real test database. This is the
  // enforceable "tests never touch dev data" guarantee — the DELETEs below run
  // ONLY after this passes.
  dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });
  assertTestDatabase(process.env.DATABASE_URL);

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    // Purge all test-generated data before each run so stale rows from
    // previous runs don't slow down beforeAll cleanup queries.
    // Delete in FK-safe order: RESTRICT constraints block user deletion until
    // payouts → transactions → messages/conversations are gone first.
    await prisma.$executeRawUnsafe('DELETE FROM payouts');
    await prisma.$executeRawUnsafe('DELETE FROM transactions');
    // CASCADE from transactions already removed disputes and reviews;
    // messages and conversations still block user deletion (RESTRICT).
    await prisma.$executeRawUnsafe('DELETE FROM messages');
    await prisma.$executeRawUnsafe('DELETE FROM conversations');
    // Deleting users cascades to: posts, offers, seller_profiles, notifications,
    // saved_searches, saved_sellers, reviews, blocked_users, phone_verifications.
    await prisma.$executeRawUnsafe('DELETE FROM users');

    const catId = await seedCategories(prisma);
    await seedCategoryVerificationConfig(prisma, catId);

    // Apply the full-text search trigger so search tests work
    const triggerSql = fs.readFileSync(
      path.resolve(__dirname, '../prisma/custom-migrations/001_search_vector_trigger.sql'),
      'utf-8',
    );
    await prisma.$executeRawUnsafe(triggerSql);

    console.log('[globalSetup] DB purged, categories seeded, search trigger applied');
  } finally {
    await prisma.$disconnect();
  }
}
