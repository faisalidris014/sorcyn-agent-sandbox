# Prisma 7 Patterns

Prisma 7 introduces breaking changes from v6. This project uses Prisma 7 with the `@prisma/adapter-pg` driver adapter pattern. These notes are critical for future development sessions.

## Key Differences from Prisma 6

### 1. No `url` in schema datasource block

The `datasource db` block in `schema.prisma` only declares the provider — no connection URL:

```prisma
datasource db {
  provider = "postgresql"
}
```

### 2. Connection URL goes in `prisma.config.ts`

```typescript
// backend/prisma.config.ts
import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

dotenv.config();

export default defineConfig({
  schema: path.join(import.meta.dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://...',
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
});
```

### 3. PrismaClient requires a driver adapter

The `@prisma/adapter-pg` package wraps the `pg` driver:

```typescript
// backend/src/config/database.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env.js';

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
```

### 4. Removed PrismaClient options

These options from Prisma 6 are **removed** in v7:
- `datasourceUrl` — use the adapter instead
- `datasources` — use the adapter instead

### 5. Seed config location

Seed configuration goes in `prisma.config.ts` under `migrations.seed`, not in `package.json`. However, `package.json` may also have a `prisma.seed` entry for backward compatibility.

## Patterns Used in This Project

### `Unsupported()` for PostgreSQL-specific types

PostgreSQL's `tsvector` type isn't natively supported by Prisma, so we use `Unsupported`:

```prisma
searchVector Unsupported("tsvector")? @map("search_vector")
```

This column is managed by a raw SQL trigger (see `prisma/custom-migrations/001_search_vector_trigger.sql`), not through Prisma's query API.

### JSONB columns

Prisma's `Json` type maps to PostgreSQL `jsonb`:

```prisma
categories        Json @default("[]")
categorySpecific  Json @default("{}")
```

### UUID primary keys

All models use UUID PKs with `@default(uuid())`:

```prisma
id String @id @default(uuid()) @map("user_id") @db.Uuid
```

### Soft deletes

All models (except AuditLog) include:

```prisma
deletedAt DateTime? @map("deleted_at")
```

Queries should filter `WHERE deleted_at IS NULL` (handled in service layer).

## JSON Null Handling (Session 3)

Prisma distinguishes between "do not update" (`undefined` / JS `null`) and "set to SQL NULL" (`Prisma.JsonNull`) for JSONB columns:

```typescript
import { Prisma } from '@prisma/client';

// WRONG: JavaScript null means "don't update this field"
await prisma.sellerProfile.update({
  data: { businessHours: null },  // Field is NOT cleared
});

// CORRECT: Prisma.JsonNull sets the column to SQL NULL
await prisma.sellerProfile.update({
  data: { businessHours: Prisma.JsonNull },  // Field is cleared
});
```

This pattern is used in `sellers.service.ts` for nullable JSONB fields like `businessHours`.

## Partial Updates with Spread Pattern (Session 3)

For PATCH endpoints where only provided fields should be updated:

```typescript
const data: Prisma.UserUpdateInput = {};
if (input.firstName !== undefined) data.firstName = input.firstName;
if (input.bio !== undefined) data.bio = input.bio;
// ... only set fields that were explicitly provided

await prisma.user.update({ where: { id: userId }, data });
```

This avoids overwriting fields that weren't included in the request body.

## Common Pitfalls

1. **Don't pass `datasourceUrl` to `new PrismaClient()`** — Prisma 7 will throw an error
2. **Always create the adapter first** — `PrismaPg` needs the connection string, then pass the adapter to `PrismaClient`
3. **The seed command in prisma.config.ts** is what `prisma db seed` uses — make sure it points to the correct file
4. **After schema changes**, always run `npx prisma generate` before `npx prisma migrate dev`
5. **Use `Prisma.JsonNull` not `null`** when setting a JSONB column to SQL NULL (Session 3)

## Raw SQL for Unsupported Operations (Session 4)

Prisma doesn't support PostgreSQL full-text search operators (`@@`, `plainto_tsquery`, `ts_rank`). Use `$queryRawUnsafe` for these:

```typescript
// Full-text search with relevance ranking
const posts = await prisma.$queryRawUnsafe(`
  SELECT p.*, ts_rank(p.search_vector, plainto_tsquery('english', $1)) AS rank
  FROM posts p
  WHERE p.search_vector @@ plainto_tsquery('english', $1)
    AND p.status = 'active'
    AND p.deleted_at IS NULL
  ORDER BY rank DESC
  LIMIT $2 OFFSET $3
`, searchQuery, limit, offset);
```

**Important:** Always use parameterized queries (`$1`, `$2`) to prevent SQL injection. Never interpolate user input into the SQL string.

## Prisma InputJsonValue Cast (Session 4)

When passing `Record<string, any>` to a JSONB column, TypeScript requires an explicit cast:

```typescript
import { Prisma } from '@prisma/client';

await prisma.post.create({
  data: {
    categorySpecific: input.categorySpecific as Prisma.InputJsonValue,
    requirements: input.requirements as Prisma.InputJsonValue,
  },
});
```

## Prisma $transaction Array Form (Session 5)

For atomic multi-write operations, use the array form of `prisma.$transaction`:

```typescript
// Atomic: accept offer + decline others + fill post + create transaction
const [acceptedOffer, , filledPost, transaction] = await prisma.$transaction([
  prisma.offer.update({
    where: { id: offerId },
    data: { status: 'accepted', acceptedAt: new Date() },
  }),
  prisma.offer.updateMany({
    where: { postId, status: 'pending', id: { not: offerId } },
    data: { status: 'declined' },
  }),
  prisma.post.update({
    where: { id: postId },
    data: { status: 'filled' },
  }),
  prisma.transaction.create({
    data: { /* ... */ },
  }),
]);
```

**Key points:**
- All writes succeed or all fail (atomic)
- Returns an array of results in the same order as the input
- Use destructuring to skip unused results with `,`

## Compound Unique Key Lookup (Session 5)

For models with `@@unique([fieldA, fieldB])`, Prisma generates a compound key name `fieldA_fieldB`:

```typescript
// @@unique([postId, sellerId]) generates the key "postId_sellerId"
const existing = await prisma.offer.findUnique({
  where: {
    postId_sellerId: {
      postId: post.id,
      sellerId: seller.id,
    },
  },
});
```

## Interactive Transaction for Read-Modify-Write (Session 7)

When you need to read data, compute new values, and write them back atomically, use the **interactive** form of `prisma.$transaction`:

```typescript
// Review submission: read seller stats, compute new average, write back
const review = await prisma.$transaction(async (tx) => {
  // 1. Create the review
  const newReview = await tx.review.create({ data: { ... } });

  // 2. Read current seller stats
  const seller = await tx.sellerProfile.findUniqueOrThrow({
    where: { id: sellerId },
    select: { averageRating: true, totalReviews: true },
  });

  // 3. Compute new average
  const newTotal = seller.totalReviews + 1;
  const currentSum = (seller.averageRating?.toNumber() ?? 0) * seller.totalReviews;
  const newAverage = (currentSum + overallRating) / newTotal;

  // 4. Determine rating badge
  let ratingBadge = null;
  if (newAverage >= 4.8 && newTotal >= 5) ratingBadge = 'top_rated';
  else if (newAverage >= 4.5 && newTotal >= 3) ratingBadge = 'highly_rated';
  else if (newAverage >= 4.0 && newTotal >= 2) ratingBadge = 'good';

  // 5. Write back
  await tx.sellerProfile.update({
    where: { id: sellerId },
    data: { averageRating: newAverage, totalReviews: newTotal, ratingBadge },
  });

  return newReview;
});
```

**Key difference from array form:**
- Array form (`prisma.$transaction([...])`) — all operations must be independent (no reading results from earlier operations)
- Interactive form (`prisma.$transaction(async (tx) => {...})`) — operations can depend on each other, supports read-modify-write patterns

**When to use which:**
| Pattern | Use Case | Example |
|---|---|---|
| Array form | Independent writes that must all succeed or fail | Accept offer (4 writes) |
| Interactive form | Read-modify-write or conditional logic | Submit review (read stats → compute → write) |

## Built In

- **Session 1:** All Prisma 7 patterns established (driver adapter, config, seed, Unsupported types)
- **Session 3:** JSON null handling pattern, partial update pattern
- **Session 4:** Raw SQL for full-text search, InputJsonValue cast for JSONB columns
- **Session 5:** `$transaction` array form for atomic writes, compound unique key lookups
- **Session 6:** No new Prisma patterns. Payments module uses standard `findFirst`/`update`/`updateMany` operations.
- **Session 7:** Interactive `$transaction` for read-modify-write (review submission with seller stats recomputation).
- **Session 8:** No new Prisma patterns. AI module uses standard `findUnique`/`findFirst` for category slug resolution.
- **Session 9:** Migration `20260219180140_add_is_admin` adds `isAdmin` boolean to User model. No new Prisma query patterns — admin module uses standard `findMany`/`update`/`count` operations with pagination and filtering.
