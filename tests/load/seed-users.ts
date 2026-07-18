// Phase 4 load-test seed utility.
// Run once before each load test against staging:
//   STAGING_URL=https://staging.sorcyn.com npx tsx tests/load/seed-users.ts
//
// T-S-06 mitigation: All accounts use prefix `loadtest_` in email + firstName so
// they can be cleaned up via cleanupTestData(['loadtest_']) and never bleed into
// real production data. The cleanup step in .github/workflows/load-test.yml
// always runs (if: always()) to handle failures.
import { writeFileSync } from 'node:fs';

const STAGING_URL = process.env.STAGING_URL || 'https://staging.sorcyn.com';
const COUNT = 100;

interface SeedUser {
  id: string;
  token: string;
  role: 'buyer' | 'seller';
  categoryId: string;
}

async function getFirstCategory(): Promise<string> {
  const res = await fetch(`${STAGING_URL}/api/v1/categories`);
  if (!res.ok) {
    console.warn('Could not fetch categories, using empty categoryId');
    return '';
  }
  const body = await res.json() as { data?: { id: string }[] };
  return body.data?.[0]?.id ?? '';
}

async function register(role: 'buyer' | 'seller', n: number, categoryId: string): Promise<SeedUser> {
  const email = `loadtest_${role}_${n}_${Date.now()}@sorcyn.test`;
  const res = await fetch(`${STAGING_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'LoadTestPass!2026',
      firstName: `loadtest_${role}_${n}`,
      lastName: 'LoadTest',
      accountType: role === 'seller' ? 'seller' : 'buyer',
      agreeToTerms: true,
      agreeToPrivacy: true,
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
    }),
  });
  if (!res.ok) {
    throw new Error(`register failed for ${email}: ${res.status} ${await res.text()}`);
  }
  const body = await res.json() as { data: { user: { id: string }; tokens: { accessToken: string } } };
  return {
    id: body.data.user.id,
    token: body.data.tokens.accessToken,
    role,
    categoryId,
  };
}

(async () => {
  console.log(`Seeding ${COUNT} buyers + ${COUNT} sellers against ${STAGING_URL}...`);
  const categoryId = await getFirstCategory();

  // Register in batches of 10 to avoid overwhelming staging
  const allUsers: SeedUser[] = [];
  for (let i = 0; i < COUNT; i += 10) {
    const batchBuyers = await Promise.all(
      Array.from({ length: Math.min(10, COUNT - i) }, (_, j) => register('buyer', i + j, categoryId)),
    );
    const batchSellers = await Promise.all(
      Array.from({ length: Math.min(10, COUNT - i) }, (_, j) => register('seller', i + j, categoryId)),
    );
    allUsers.push(...batchBuyers, ...batchSellers);
    console.log(`  Batch ${i / 10 + 1}: ${batchBuyers.length} buyers + ${batchSellers.length} sellers`);
  }

  writeFileSync('tests/load/seed-users.json', JSON.stringify(allUsers, null, 2));
  console.log(`Seeded ${allUsers.length} users → tests/load/seed-users.json`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
