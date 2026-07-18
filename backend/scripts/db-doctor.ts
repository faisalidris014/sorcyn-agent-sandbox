/**
 * db:doctor — fast-fail check that the local DEV database is ready for a sim
 * session (issue #133).
 *
 * Verifies, against whatever DATABASE_URL resolves to in your `.env` (the dev
 * DB):
 *   1. The 4 standard seed accounts exist.
 *   2. Each has the expected password (bcrypt.compare) and active status.
 *   3. All 38 categories are seeded.
 *   4. No Redis login-lockout is currently blocking a seed account.
 *
 * Exits 0 when healthy, 1 with copy-pasteable recovery steps otherwise. Run this
 * BEFORE standing up the app on the iOS sim — it surfaces "seed accounts gone"
 * in one line instead of a misleading "Session expired" in the app.
 *
 * Usage: npm run db:doctor
 */
import dotenv from 'dotenv';
dotenv.config();

import { readFileSync } from 'node:fs';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import Redis from 'ioredis';

import { parseModelAccessors, findMissingModelAccessors } from '../src/common/utils/prisma-drift.js';
import { urlNeedsSsl, stripSslMode } from '../src/config/db-ssl.js';

const SEED_ACCOUNTS = [
  { email: 'buyer@test.com', password: 'TestPassword123!' },
  { email: 'seller@test.com', password: 'TestPassword123!' },
  { email: 'both@test.com', password: 'TestPassword123!' },
  { email: 'admin@reversemarketplace.com', password: 'AdminSecure456!' },
];
const EXPECTED_CATEGORY_COUNT = 38;

function databaseNameOf(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\//, '').split('?')[0];
  } catch {
    return '(unparseable)';
  }
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('✖ DATABASE_URL is not set. Copy .env.example → .env, then run `npm run db:bootstrap`.');
    process.exit(1);
  }

  const dbName = databaseNameOf(url);
  if (/_test$/.test(dbName)) {
    console.warn(`⚠ DATABASE_URL points at the TEST database "${dbName}". db:doctor checks the DEV DB — running anyway.`);
  }
  console.log(`db:doctor — checking database "${dbName}"\n`);

  const problems: string[] = [];

  const pool = new pg.Pool({
    connectionString: stripSslMode(url),
    ...(urlNeedsSsl(url, process.env.NODE_ENV) ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1 + 2. Seed accounts present, correct password, active.
    for (const acct of SEED_ACCOUNTS) {
      const user = await prisma.user.findUnique({ where: { email: acct.email } });
      if (!user) {
        problems.push(`Seed account MISSING: ${acct.email}`);
        continue;
      }
      const passwordOk = await bcrypt.compare(acct.password, user.passwordHash);
      if (!passwordOk) problems.push(`Wrong password hash for ${acct.email} (re-seed to repair)`);
      if (user.status !== 'active') problems.push(`${acct.email} status is "${user.status}", expected "active"`);
      const mark = passwordOk && user.status === 'active' ? '✔' : '✖';
      console.log(`  ${mark} ${acct.email}`);
    }

    // 3. Category count.
    const catCount = await prisma.category.count();
    if (catCount < EXPECTED_CATEGORY_COUNT) {
      problems.push(`Only ${catCount}/${EXPECTED_CATEGORY_COUNT} categories seeded`);
    }
    console.log(`  ${catCount >= EXPECTED_CATEGORY_COUNT ? '✔' : '✖'} ${catCount} categories`);

    // Prisma client in sync with schema.prisma (issue #159). A model added to
    // schema.prisma without a follow-up `prisma generate` leaves its client
    // accessor undefined, which crash-loops workers (e.g. stripe-retry on
    // `prisma.paymentIntentQueue`) with a cryptic "reading 'findMany'" error.
    const schemaPath = new URL('../prisma/schema.prisma', import.meta.url);
    const accessors = parseModelAccessors(readFileSync(schemaPath, 'utf8'));
    const missingAccessors = findMissingModelAccessors(
      prisma as unknown as Record<string, unknown>,
      accessors,
    );
    if (missingAccessors.length > 0) {
      problems.push(
        `Prisma client out of sync with schema.prisma — missing accessor(s): ${missingAccessors.join(', ')}. Run \`npm run db:generate\`.`,
      );
    }
    console.log(
      `  ${missingAccessors.length === 0 ? '✔' : '✖'} Prisma client in sync (${accessors.length} models)`,
    );
  } finally {
    await prisma.$disconnect();
  }

  // 4. Redis login lockouts on seed accounts (warn — not fatal, but reported).
  const lockedOut: string[] = [];
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
  try {
    await redis.connect();
    for (const acct of SEED_ACCOUNTS) {
      if (await redis.exists(`auth:login_lockout:${acct.email}`)) lockedOut.push(acct.email);
    }
  } catch {
    console.warn('  ⚠ Redis unreachable — skipped lockout check');
  } finally {
    redis.disconnect();
  }
  if (lockedOut.length > 0) {
    problems.push(`Redis login-lockout active for: ${lockedOut.join(', ')}`);
  }

  console.log('');
  if (problems.length === 0) {
    console.log('✔ db:doctor passed — seed accounts, categories, and Redis are healthy.');
    process.exit(0);
  }

  console.error('✖ db:doctor found problems:');
  for (const p of problems) console.error(`   - ${p}`);
  console.error('\nRecovery:');
  console.error('   1. Regenerate Prisma client (if out of sync): npm run db:generate');
  console.error('   2. Clear any Redis login lockouts:  npm run db:reset-lockout');
  console.error('   3. Re-seed (repairs/creates accounts): npm run db:seed');
  console.error('   4. Re-check:                          npm run db:doctor');
  console.error('\nSee docs/DATABASE_CONFIG.md → "seed accounts missing / login fails".');
  process.exit(1);
}

main().catch((e) => {
  console.error('db:doctor crashed:', e);
  process.exit(1);
});
