import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env.js';
import { urlNeedsSsl, stripSslMode } from './db-ssl.js';

// Build pg Pool — enables SSL for Supabase/production and manages connection limits.
// Detect SSL from the raw URL, then strip `sslmode` so it can't escalate to
// `verify-full` and reject Supabase's self-signed chain (see db-ssl.ts).
const needsSsl = urlNeedsSsl(env.DATABASE_URL, env.NODE_ENV);
const connectionString = stripSslMode(env.DATABASE_URL);

const pool = new pg.Pool({
  connectionString,
  max: env.NODE_ENV === 'test' ? 5 : 20,
  // In test mode, close idle connections quickly (2 s) so back-to-back
  // `vitest run` invocations don't fight over Postgres connection slots.
  // Without this, the previous run's pool holds connections open until the
  // Node process is fully GC'd, which can overlap with the next run's workers.
  ...(env.NODE_ENV === 'test' ? { idleTimeoutMillis: 2000, connectionTimeoutMillis: 10000 } : {}),
  ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
