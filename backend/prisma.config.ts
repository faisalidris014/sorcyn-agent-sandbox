import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

dotenv.config();

// Migrations must run over a DIRECT connection. Supabase's transaction pooler
// (port 6543, pgbouncer) does not support the advisory locks / prepared
// statements Prisma migrations need, so prefer DIRECT_DATABASE_URL when set and
// fall back to DATABASE_URL for local Postgres (where they're the same host).
const databaseUrl =
  process.env.DIRECT_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/reverse_marketplace';

export default defineConfig({
  schema: path.join(import.meta.dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
});
