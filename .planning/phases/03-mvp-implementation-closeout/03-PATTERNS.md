# Phase 3: MVP Implementation Closeout — Pattern Map

**Mapped:** 2026-04-29
**Files analyzed:** 14 (8 net-new + modified, 6 verify-only)
**Analogs found:** 14 / 14
**Source of truth:** `03-CONTEXT.md` Addendum (A-01..A-05 supersede D-01/D-03/D-05/D-06/D-09/D-10-partial/D-19) + `03-RESEARCH.md`

> Skip both PostGIS and OfferRevision new-table work entirely (per Addendum A-01 / A-02). Saved-sellers, archive endpoint, video MIMEs, counter-offer chain, geocoding utility, Haversine filter, 3-day exclusivity write/read paths are already shipped — verify-only.

---

## File Classification

### Net-new files

| New File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `backend/tests/audit/closeout-audit.test.ts` | test (audit suite) | request-response + schema introspection | `backend/tests/saved-sellers.test.ts` + `backend/tests/payments.test.ts` (Stripe mock pattern) | role-match (no existing audit-only suite) |
| `mobile/lib/features/sellers/presentation/screens/identity_verify_screen.dart` | screen | request-response + url_launcher redirect | `mobile/lib/features/sellers/presentation/screens/stripe_onboard_screen.dart` | exact (same hosted-flow shape) |

### Modified files

| Modified File | Role | Data Flow | Closest Analog (in-file) | Match Quality |
|---|---|---|---|---|
| `backend/src/modules/offers/offers.service.ts` (line 21 const + counterOffer depth-cap) | service | CRUD + business rule | existing `MAX_OFFERS_PER_POST` const + existing `counterOffer()` | exact (in-place) |
| `backend/src/modules/posts/posts.service.ts` (3-day targeted-seller carve-out in `getFeed`; PII redaction in `toPostResponse`) | service | CRUD + filter | existing `where.OR: [publicAfter null/lte]` block + existing `stripBudgetForNonOwner()` helper | exact (in-place) |
| `backend/src/modules/offers/offers.service.ts` (PII redaction in `toOfferResponse`) | service | CRUD + filter | existing `toOfferResponse` shape | exact (in-place) |
| `backend/src/modules/payments/payments.service.ts` (`handleWebhookEvent` switch — add `identity.*` cases) | service | event-driven | existing `case 'account.updated':` handler | exact (sibling case) |
| `backend/src/modules/sellers/sellers.service.ts` (NEW method `createIdentitySession()`) | service | request-response (Stripe SDK call) | `paymentsService.startSellerOnboarding()` lines 205–237 | exact |
| `backend/src/modules/auth/auth.service.ts` + `auth.schemas.ts` (EIN gate at register) | service + schema | request-response | existing `registerSchema` zod block + existing `register()` flow | exact (extend, don't replace) |
| `backend/src/config/env.ts` (Stripe Connect prod hardening) | config | startup validation | existing `validateProductionEnv()` lines 86–107 | exact (extend list) |
| `mobile/lib/features/sellers/presentation/screens/stripe_onboard_screen.dart` (WidgetsBindingObserver + drop ephemeral state — D-24) | screen | event-driven (lifecycle) | existing `initState`/`Future.microtask` block (lines 62–68) | exact (in-place refactor) |
| `mobile/lib/features/profile/presentation/screens/profile_screen.dart` (line 531 route change — D-25) | screen | navigation | existing `_ProfileMenuItem.onTap: context.push(...)` pattern | exact (in-place) |
| `mobile/lib/features/auth/presentation/screens/register_screen.dart` (business toggle reveals EIN input) | screen | form input | existing `_AccountTypeSelector` + `AppInputField` pattern | exact |
| `mobile/lib/features/posts/presentation/screens/post_detail_screen.dart` (PII gate lock-icon UI — D-13) | screen | conditional rendering | existing `_InfoGrid` lines 320–360 (location row) | role-match |
| Job-creation flow (mobile post creation — A-05 role-tier dropdown) | screen | form input | existing manual_post_creation_screen `categorySpecific` pattern + register's `_AccountTypeSelector` | role-match |
| `mobile/lib/features/offers/presentation/widgets/counter_offer_modal.dart` (verify wired; possibly cap-warning) | widget | request-response | existing modal at lines 8–120 | exact (verify only) |

### Verify-only (no code change — assertion targets for `closeout-audit.test.ts`)

| File | What to verify | Source |
|---|---|---|
| `backend/src/modules/saved-sellers/` | module exists with routes/service/schemas; `POST /:sellerId`, `DELETE /:sellerId`, `GET /` shipped | `saved-sellers.routes.ts` lines 1–40 |
| `backend/src/common/utils/storage.ts` | `ALLOWED_VIDEO_TYPES` includes `'video/mp4'` and `'video/quicktime'`; `MAX_VIDEO_SIZE = 100MB` | lines 40–47 |
| `backend/src/modules/posts/posts.service.ts` archive endpoint | `archivePost()` exists; `POST /:postId/archive` route registered | `posts.service.ts:387–402`, `posts.routes.ts:191–202` |
| `backend/src/config/geocoding.ts` | `geocodeAddress()` exported with Google Maps fetch path + null-safe failure | full file (52 lines) |
| `backend/prisma/schema.prisma` | `enum PostStatus { ... archived }` present | line 50 |
| `backend/src/modules/offers/offers.service.ts` counter-offer chain | `counterOffer()` exists; `parentOfferId` self-relation creates new `pending` offer linked to parent | lines 455–541 |
| `mobile/lib/features/offers/presentation/widgets/counter_offer_modal.dart` | shipped 419-line modal with `showCounterOfferModal()` entry | lines 7–26 |

---

## Pattern Assignments

### `backend/tests/audit/closeout-audit.test.ts` (test, audit suite)

**Analog:** `backend/tests/saved-sellers.test.ts` (test scaffold) + `backend/tests/payments.test.ts` lines 1–49 (Stripe mock pattern).

**Imports + scaffold** (saved-sellers.test.ts:1–46):
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/database.js';
import { redis } from '../src/config/redis.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let buyerToken: string;
let buyerUserId: string;
let sellerToken: string;
let sellerUserId: string;

// ...

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();
  // (clean previous data, register users, login)
});
```

**Reusable test-user helper** (`backend/tests/helpers.ts:20–75`):
```typescript
export async function createTestUser(
  app: FastifyInstance,
  overrides?: Partial<{...}>,
): Promise<TestUser> {
  // Register → DB-flip emailVerified=true → login → return token + userId
}

export function authHeaders(token: string) {
  return { authorization: `Bearer ${token}` };
}
```

**Stripe mock pattern when audit tests must call payment-touching paths** (payments.test.ts:9–49):
```typescript
vi.mock('../src/config/stripe.js', () => {
  const mockAccountLinks = {
    create: vi.fn().mockResolvedValue({ url: 'https://connect.stripe.com/setup/test_onboarding' }),
  };
  // ...
  return {
    getStripe: () => ({ paymentIntents, refunds, accounts, accountLinks, transfers }),
    verifyWebhookSignature: vi.fn(),
  };
});
```

**Assertion shapes the audit suite must produce — one block per Phase 3 success criterion (D-15):**

```typescript
// SC1 — geocoding precision (verify shipped utility, exists)
describe('SC1: geocoding utility shipped', () => {
  it('exports geocodeAddress with null-safe failure', async () => {
    const mod = await import('../../src/config/geocoding.js');
    expect(typeof mod.geocodeAddress).toBe('function');
    // No API key → graceful null
    const orig = process.env.GOOGLE_MAPS_API_KEY;
    delete process.env.GOOGLE_MAPS_API_KEY;
    expect(await mod.geocodeAddress('Dallas, TX')).toBeNull();
    if (orig) process.env.GOOGLE_MAPS_API_KEY = orig;
  });
});

// SC2 — counter-offer cap (D-07: 5 total, depth ≥ 4 rejected)
describe('SC2: counter-offer chain enforces 5-round cap', () => {
  it('rejects 5th counter on a chain', async () => {
    // Walk parentOfferId chain via 4 successive POST /offers/:id/counter calls,
    // then expect the 5th to return 409 with detail matching /maximum.*counter/i
  });
});

// SC3 — audit-gap reconciliations
describe('SC3: audit-gap micro-fixes implemented', () => {
  it('MAX_OFFERS_PER_POST raised to 25', async () => {
    // Submit 25 offers from distinct sellers on a post; the 26th should 409.
    // OR: import the constant — but service file does not export it; prefer behavioral test.
  });
  it('PostStatus.archived enum value present', async () => {
    // Lightweight: query Prisma DMMF
    const { Prisma } = await import('@prisma/client');
    const enumDef = (Prisma.dmmf as any).datamodel.enums.find((e: any) => e.name === 'PostStatus');
    expect(enumDef.values.map((v: any) => v.name)).toContain('archived');
  });
  it('storage allowlist includes video/mp4 + video/quicktime', async () => {
    // Inspect via uploadFile rejection paths or import the constants if exported.
    // If not exported, post a presigned-URL request with each MIME and assert 200.
  });
  it('saved-sellers module endpoints reachable', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/saved-sellers', headers: authHeaders(buyerToken) });
    expect([200, 401]).toContain(res.statusCode); // auth-protected, but route exists (not 404)
    expect(res.statusCode).not.toBe(404);
  });
  it('archive endpoint reachable', async () => {
    const res = await app.inject({ method: 'POST', url: `/api/v1/posts/${someExpiredPostId}/archive`, headers: authHeaders(buyerToken) });
    expect(res.statusCode).not.toBe(404);
  });
  it('PII gate redacts pre-funding location address + buyer contact', async () => {
    // Seller GETs a post they have no funded transaction on → expect locationAddress omitted/redacted
  });
});

// SC4 — Stripe Identity → ID Verified badge auto-award
describe('SC4: Stripe Identity webhook awards ID Verified badge', () => {
  it('handles identity.verification_session.verified', async () => {
    // POST /api/v1/payments/webhook with a mocked verifyWebhookSignature returning a fake event;
    // assert prisma.verificationRequest now has approved row + sellerProfile.idVerified=true.
  });
  it('EIN required when accountType=business at register', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/auth/register',
      payload: { ...validRegister, accountType: 'business' /* no ein */ },
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.stringify(res.json())).toMatch(/ein/i);
  });
});

// SC5 — Stripe Connect carry-over fix shipped
describe('SC5: Stripe Connect bug-fix + env hardening', () => {
  it('production startup rejects unset STRIPE_CONNECT_RETURN_URL', async () => {
    // Spawn validateProductionEnv with NODE_ENV=production + missing var; expect process.exit
    // (use vi.spyOn(process, 'exit') and capture the call).
  });
});

afterAll(async () => {
  await redis.quit();
  await prisma.$disconnect();
  await app.close();
});
```

**Run command (no Vitest project nesting per Pitfall 5):**
```bash
npx vitest run tests/audit
```

---

### `backend/src/modules/sellers/sellers.service.ts` — NEW `createIdentitySession()` method

**Analog:** `backend/src/modules/payments/payments.service.ts:205–237` (`startSellerOnboarding`).

**Imports pattern to copy** (payments.service.ts:1–11):
```typescript
import type Stripe from 'stripe';
import { prisma } from '../../config/database.js';
import { getStripe } from '../../config/stripe.js';
import { env } from '../../config/env.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../../common/utils/errors.js';
```

**Stripe-SDK + getSellerProfile pattern** (payments.service.ts:205–237 — exact analog):
```typescript
async startSellerOnboarding(userId: string) {
  const seller = await prisma.sellerProfile.findFirst({
    where: { userId, deletedAt: null },
  });
  if (!seller) throw new NotFoundError('Seller profile');

  const stripe = getStripe();
  let accountId = seller.stripeAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'standard',
      metadata: { sellerId: seller.id, userId },
    }, {
      idempotencyKey: `acct_create_${seller.id}`,
    });
    accountId = account.id;

    await prisma.sellerProfile.update({
      where: { id: seller.id },
      data: { stripeAccountId: accountId },
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: env.STRIPE_CONNECT_REFRESH_URL ?? `${env.FRONTEND_URL}/seller/stripe/refresh`,
    return_url: env.STRIPE_CONNECT_RETURN_URL ?? `${env.FRONTEND_URL}/seller/stripe/complete`,
    type: 'account_onboarding',
  });

  return { url: accountLink.url, accountId };
}
```

**Apply to new method (concrete shape per RESEARCH.md Pattern 2 + D-16/D-18):**
```typescript
// In SellersService — co-locate near submitVerification (sellers.service.ts:188)
async createIdentitySession(userId: string): Promise<{ sessionId: string; url: string | null }> {
  const seller = await prisma.sellerProfile.findFirst({
    where: { userId, deletedAt: null },
  });
  if (!seller) throw new NotFoundError('Seller profile');

  const stripe = getStripe();
  const session = await stripe.identity.verificationSessions.create({
    type: 'document',
    options: { document: { require_matching_selfie: true } },
    metadata: { sellerProfileId: seller.id, userId },          // routes the webhook (D-16)
    return_url: env.STRIPE_IDENTITY_RETURN_URL
      ?? env.STRIPE_CONNECT_RETURN_URL
      ?? `${env.FRONTEND_URL}/seller/identity/complete`,
  }, {
    idempotencyKey: `identity_session_${seller.id}`,            // mirror startSellerOnboarding pattern
  });

  return { sessionId: session.id, url: session.url };
}
```

**Why no `STRIPE_IDENTITY_WEBHOOK_SECRET`** (RESEARCH.md Pitfall 2): one signing secret per webhook URL. Identity events flow through the existing `/api/v1/payments/webhook` endpoint and reuse `STRIPE_WEBHOOK_SECRET` (env.ts:30).

---

### `backend/src/modules/payments/payments.service.ts` `handleWebhookEvent` (extend switch)

**Analog:** lines 266–289 (existing switch with `account.updated` case).

**Pattern to extend** (payments.service.ts:266–289):
```typescript
async handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    case 'charge.refunded':
      await this.handleChargeRefunded(event.data.object as Stripe.Charge);
      break;
    case 'account.updated':
      await this.handleAccountUpdated(event.data.object as Stripe.Account);
      break;
    default:
      await this.handleExtendedEvent(event);
      break;
  }
}
```

**Cohort the new handlers next to `handleAccountUpdated`** (payments.service.ts:380–390):
```typescript
private async handleAccountUpdated(account: Stripe.Account) {
  if (!account.id) return;

  await prisma.sellerProfile.updateMany({
    where: { stripeAccountId: account.id },
    data: {
      stripeChargesEnabled: account.charges_enabled ?? false,
      stripePayoutsEnabled: account.payouts_enabled ?? false,
    },
  });
}
```

**Apply (per RESEARCH.md Pattern 1 + D-16):**
```typescript
case 'identity.verification_session.verified':
  await this.handleIdentitySessionVerified(event.data.object as Stripe.Identity.VerificationSession);
  break;
case 'identity.verification_session.requires_input':
case 'identity.verification_session.canceled':
  // Log but do not auto-reject; buyer can retry hosted flow
  break;

// New private handler
private async handleIdentitySessionVerified(vs: Stripe.Identity.VerificationSession) {
  const sellerProfileId = vs.metadata?.sellerProfileId;
  if (!sellerProfileId) return;                                // dedup'd at payments.webhook.ts:46

  await prisma.$transaction(async (tx) => {
    await tx.verificationRequest.create({
      data: {
        sellerId: sellerProfileId,
        verificationType: 'id',
        tier: 2,
        status: 'approved',
        reviewedAt: new Date(),
        notes: `Auto-approved via Stripe Identity ${vs.id}`,
      },
    });
    await tx.sellerProfile.update({
      where: { id: sellerProfileId },
      data: { idVerified: true },
    });
  });
}
```

> **Webhook signature scaffolding** (payments.webhook.ts:24–53) is already correct — do NOT touch. The dedup `stripe:event:${event.id}` SETNX with 24h TTL at line 46 handles Identity event retries with zero changes.

---

### `backend/src/modules/offers/offers.service.ts` (line 21 const + counterOffer depth-cap)

**Analog:** the file itself — modify the existing constant + extend `counterOffer()`.

**Constant change** (offers.service.ts:21):
```typescript
// BEFORE
const MAX_OFFERS_PER_POST = 10;
// AFTER
const MAX_OFFERS_PER_POST = 25;          // Phase 3 D-XX (audit reconciliation)
```

**Counter-offer depth cap pattern** (extend offers.service.ts:455–541; per Addendum A-02 + D-07 + RESEARCH.md Pitfall 6).

The existing `counterOffer()` already creates a new `Offer` row with `parentOfferId: offerId`. Add a depth check BEFORE the `prisma.$transaction` block at line 478:

```typescript
const MAX_COUNTER_DEPTH = 4;             // 5 total = original + 4 counters (D-07)

async counterOffer(userId: string, offerId: string, input: CounterOfferInput) {
  // ... existing load + auth checks (lines 457–473) ...

  // Depth-cap check — walk parentOfferId chain (Addendum A-02 + D-07)
  let depth = 0;
  let cursor: { parentOfferId: string | null } | null = offer;
  while (cursor?.parentOfferId) {
    cursor = await prisma.offer.findUnique({
      where: { id: cursor.parentOfferId },
      select: { parentOfferId: true },
    });
    depth++;
    if (depth >= MAX_COUNTER_DEPTH) {
      throw new ConflictError(
        `Counter-offer chain has reached the maximum of ${MAX_COUNTER_DEPTH + 1} rounds`,
      );
    }
  }

  // ... existing prisma.$transaction at line 478 unchanged ...
}
```

**Privacy enforcement (D-08) — verify, don't add:** the existing `getPostOffers()` at line 545 already filters by `post.buyerId === userId` (admin role excepted) and the `getMyOffers()` filters by `seller.id === seller.id`. The ancestor chain is naturally scoped because every offer in the chain shares `postId + sellerId`. Add an audit-suite assertion that a third-party seller GETs the post and does NOT see the counter chain.

---

### `backend/src/modules/posts/posts.service.ts` (3-day targeted-seller carve-out + PII redaction)

**Analog:** the file itself — `getFeed()` at line 510 + `toPostResponse()` at line 782 + `stripBudgetForNonOwner()` at line 883.

**Existing 3-day exclusivity gate** (posts.service.ts:516–520):
```typescript
// Only show posts past the 3-day exclusivity window
OR: [
  { publicAfter: null },
  { publicAfter: { lte: new Date() } },
],
```

**Targeted-seller carve-out pattern (Addendum A-03 — category match):**

Replace the simple `OR` with a request-aware variant. The seller feed needs access to the calling seller's `categories` to include posts where `post.categoryId ∈ seller.categories`. This requires `getFeed()` to accept an optional `requestingUserId` (already exists in some callsites) so it can resolve the seller profile and inject the carve-out:

```typescript
// In getFeed(), early in the method — load seller categories if request is from a seller
let sellerCategories: string[] | null = null;
if (requestingUserId) {
  const seller = await prisma.sellerProfile.findFirst({
    where: { userId: requestingUserId, deletedAt: null },
    select: { categories: true },
  });
  sellerCategories = (seller?.categories as string[] | null) ?? null;
}

// Replace where.OR (lines 517–520) with:
where.OR = [
  { publicAfter: null },
  { publicAfter: { lte: new Date() } },
  ...(sellerCategories && sellerCategories.length > 0
    ? [{ categoryId: { in: sellerCategories } }]    // targeted-seller carve-out
    : []),
];
```

**PII redaction at the response shape** (D-11/D-12 — extend posts.service.ts:782–858 `toPostResponse()`):

The existing `stripBudgetForNonOwner()` at line 883 is the exact pattern to mirror for PII. Add a sibling helper `redactPiiForNonFundedRequester(post, requestingUserId)`:

```typescript
private async redactPiiForNonFundedRequester<T extends { buyerId: string; locationAddress: string | null; latitude?: unknown; longitude?: unknown }>(
  post: T,
  requestingUserId?: string,
): Promise<T> {
  if (!requestingUserId || requestingUserId === post.buyerId) return post;

  // Funded-status check via transactions table (escrow held = funded)
  const funded = await prisma.transaction.findFirst({
    where: {
      postId: (post as any).id,
      buyer: { id: post.buyerId },
      seller: { user: { id: requestingUserId } },
      escrowStatus: { in: ['held', 'released'] },
      deletedAt: null,
    },
    select: { id: true },
  });
  if (funded) return post;

  // Pre-funded view: city + state + zip only (D-11) — strip address + buyer phone/email
  return { ...post, locationAddress: null };
}
```

Apply at every callsite that returns a post to a non-owner: `getFeed` (line 595–620), `getPostById` (line 178–183), `searchPosts` (line 750–778). Mirror the imperative shape of `stripBudgetForNonOwner`.

---

### `backend/src/modules/offers/offers.service.ts` — `toOfferResponse` PII redaction

**Analog:** `toOfferResponse()` at lines 717–800 (offers.service.ts).

The shape to extend (offers.service.ts:780–800):
```typescript
post: offer.post ? {
  id: offer.post.id,
  title: offer.post.title,
  ...('status' in offer.post ? { status: offer.post.status } : {}),
  ...('locationCity' in offer.post ? { locationCity: offer.post.locationCity } : {}),
  ...('locationState' in offer.post ? { locationState: offer.post.locationState } : {}),
} : undefined,
```

**Apply (D-11/D-12):** when the requesting user is a seller and there is no funded transaction tying them to the post, strip `locationAddress` (already absent above — verify it stays absent), and ensure buyer contact details (`buyer.email`, `buyer.phone`) are not joined. Add a service-level branch where, only on funded transactions, the seller sees the full address — same funded-check helper as the posts service.

---

### `backend/src/modules/auth/auth.service.ts` + `auth.schemas.ts` (EIN gate at register)

**Analog:** `auth.schemas.ts:14–32` (existing `registerSchema`) + `auth.service.ts:64–104` (existing `register()`).

**Schema pattern to extend** (auth.schemas.ts:14–32):
```typescript
export const registerSchema = z.object({
  email: z.string().email().max(255).describe('User email').transform((v) => v.toLowerCase().trim()),
  password: passwordSchema.describe('Password'),
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  phone: z.string().max(20).optional(),
  accountType: z.enum(['buyer', 'seller', 'both']).default('buyer'),
  locationZip: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
  agreeToTerms: z.literal(true, { message: 'You must agree to the Terms of Service' }),
  agreeToPrivacy: z.literal(true, { message: 'You must agree to the Privacy Policy' }),
});
```

**Apply (D-XX EIN gate + RESEARCH.md "EIN format validation" recommendation):**
```typescript
// Add to accountType enum
accountType: z.enum(['buyer', 'seller', 'both', 'business']).default('buyer'),

// New optional EIN field
ein: z.string()
  .regex(/^\d{2}-\d{7}$/, 'Invalid EIN format (expected XX-XXXXXXX)')
  .optional()
  .describe('US EIN (e.g. 12-3456789) — required when accountType=business'),

// Cross-field requirement via .superRefine (Zod 4 idiom; consistent with passwordSchema regex pile)
}).superRefine((data, ctx) => {
  if (data.accountType === 'business' && !data.ein) {
    ctx.addIssue({
      code: 'custom',
      path: ['ein'],
      message: 'EIN is required for business accounts',
    });
  }
});
```

**Service-level persistence** (auth.service.ts:79–91): add `ein: input.ein ?? null` to the `prisma.user.create({ data: ... })` block. (Schema column may need adding — confirm in Prisma schema; `User` model can absorb a nullable `ein VARCHAR(10)`.)

---

### `backend/src/config/env.ts` (Stripe Connect prod hardening — D-26)

**Analog:** `validateProductionEnv()` at lines 86–107.

**Existing pattern to extend** (env.ts:86–107):
```typescript
function validateProductionEnv(config: Env): void {
  if (config.NODE_ENV !== 'production') return;

  const warnings: string[] = [];
  const errors: string[] = [];

  if (!config.STRIPE_SECRET_KEY) errors.push('STRIPE_SECRET_KEY is required in production');
  if (!config.STRIPE_WEBHOOK_SECRET) errors.push('STRIPE_WEBHOOK_SECRET is required in production');

  if (!config.SENDGRID_API_KEY) warnings.push('SENDGRID_API_KEY not set — emails will be stubbed');
  // ...
  if (config.FRONTEND_URL === 'http://localhost:8080') warnings.push('FRONTEND_URL still set to localhost');
  // ...

  for (const w of warnings) console.warn(`[ENV WARNING] ${w}`);
  if (errors.length > 0) {
    for (const e of errors) console.error(`[ENV ERROR] ${e}`);
    process.exit(1);
  }
}
```

**Apply (D-26 — promote two checks from "warning" to "error" + add Identity return URL):**
```typescript
if (!config.STRIPE_CONNECT_RETURN_URL) errors.push('STRIPE_CONNECT_RETURN_URL is required in production');
if (config.FRONTEND_URL === 'http://localhost:8080') errors.push('FRONTEND_URL still set to localhost — refusing to start in production');
// Optional but recommended (D-18 fallback)
if (!config.GOOGLE_MAPS_API_KEY) warnings.push('GOOGLE_MAPS_API_KEY not set — geocoding will return null and post creation will reject location');
```

**Schema-side default candidates** (env.ts:52–53 — leave optional, just add zod `.default()`):
```typescript
STRIPE_CONNECT_RETURN_URL: z.string().url().default('reversemarket://seller/stripe/complete').optional(),
STRIPE_CONNECT_REFRESH_URL: z.string().url().default('reversemarket://seller/stripe/refresh').optional(),
// New (optional — Identity falls back to Connect URL per RESEARCH.md Runtime State Inventory)
STRIPE_IDENTITY_RETURN_URL: z.string().url().default('reversemarket://seller/identity/complete').optional(),
```

> **Note:** existing `STRIPE_CONNECT_RETURN_URL` is `.url()` — `reversemarket://...` IS a valid URL by Zod's default URL parser, but verify in tests. If Zod 4 rejects custom schemes, switch to `z.string().min(1)` and validate by regex.

---

### `mobile/lib/features/sellers/presentation/screens/identity_verify_screen.dart` (NEW screen)

**Analog:** `mobile/lib/features/sellers/presentation/screens/stripe_onboard_screen.dart` (full file — exact pattern).

**Imports + scaffold** (stripe_onboard_screen.dart:1–22):
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../data/models/seller_profile_model.dart';
import '../../providers/seller_provider.dart';

class StripeOnboardScreen extends ConsumerStatefulWidget {
  const StripeOnboardScreen({super.key});

  @override
  ConsumerState<StripeOnboardScreen> createState() => _StripeOnboardScreenState();
}

class _StripeOnboardScreenState extends ConsumerState<StripeOnboardScreen> {
  bool _isLoading = false;
  bool _onboardingStarted = false;     // <- DROP this in identity_verify_screen (D-24 lesson)
  String? _error;
```

**url_launcher hosted-flow pattern** (stripe_onboard_screen.dart:24–53 — the pattern to copy verbatim):
```dart
Future<void> _startOnboarding() async {
  setState(() { _isLoading = true; _error = null; });
  try {
    final result = await ref.read(sellerProfileProvider.notifier).startStripeOnboarding();
    if (result != null && mounted) {
      setState(() => _onboardingStarted = true);
      final uri = Uri.parse(result.url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        setState(() => _error = 'Could not open Stripe onboarding URL');
      }
    } else if (mounted) {
      setState(() => _error = ref.read(sellerProfileProvider).error ?? 'Failed to start onboarding');
    }
  } catch (e) {
    if (mounted) setState(() => _error = e.toString());
  } finally {
    if (mounted) setState(() => _isLoading = false);
  }
}
```

**Apply to identity_verify_screen.dart (single-button hosted-flow + lifecycle observer baked in from day one — avoid Bug B repeat):**
```dart
class IdentityVerifyScreen extends ConsumerStatefulWidget { ... }

class _IdentityVerifyScreenState extends ConsumerState<IdentityVerifyScreen>
    with WidgetsBindingObserver {                               // bake in from start
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    Future.microtask(() => ref.read(sellerProfileProvider.notifier).loadProfile());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(sellerProfileProvider.notifier).loadProfile();   // refetch idVerified flag
    }
  }

  Future<void> _startVerification() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final result = await ref.read(sellerProfileProvider.notifier).startIdentityVerification();
      if (result != null && mounted) {
        final uri = Uri.parse(result.url);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } else {
          setState(() => _error = 'Could not open Stripe verification');
        }
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
  // ... build() copies stripe_onboard_screen.dart's CTA button + status card patterns,
  //     keyed off seller.idVerified instead of seller.canAcceptPaidOffers ...
}
```

> The `seller_provider.dart` will need a new notifier method `startIdentityVerification()` that wraps the new backend `POST /api/v1/sellers/identity/verify` route. Mirror the existing `startStripeOnboarding()` method 1:1.

---

### `mobile/lib/features/sellers/presentation/screens/stripe_onboard_screen.dart` (D-24 refactor)

**In-file analog:** lines 19–22 (drop `_onboardingStarted`), lines 62–68 (extend `initState`), line 76 (replace `isInProgress` derivation).

**Anti-pattern in current code (DROP this — D-24):**
```dart
// stripe_onboard_screen.dart:21
bool _onboardingStarted = false;

// stripe_onboard_screen.dart:76 — derives state from a transient widget flag
final isInProgress = _onboardingStarted && !isConnected;
```

**Pattern to apply** (per RESEARCH.md Pattern 3 — server-derived + lifecycle observer):
```dart
class _StripeOnboardScreenState extends ConsumerState<StripeOnboardScreen>
    with WidgetsBindingObserver {                              // ADD mixin
  bool _isLoading = false;
  String? _error;
  // (DROP _onboardingStarted entirely)

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);                 // ADD
    Future.microtask(() {
      ref.read(sellerProfileProvider.notifier).loadStripeStatus();
      ref.read(sellerProfileProvider.notifier).loadProfile();  // ADD load profile too
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);              // ADD
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {   // ADD
    if (state == AppLifecycleState.resumed) {
      ref.read(sellerProfileProvider.notifier).loadStripeStatus();
      ref.read(sellerProfileProvider.notifier).loadProfile();
    }
  }

  // build() — derive isInProgress from server state
  bool get _isInProgress {
    final s = ref.read(sellerProfileProvider).stripeStatus;
    return s?.onboarded == true && s?.chargesEnabled == false;
  }
}
```

---

### `mobile/lib/features/profile/presentation/screens/profile_screen.dart` (line 531 — D-25)

**In-file analog:** the existing `_ProfileMenuItem` block at lines 526–533.

**Existing (BUG):**
```dart
if (appMode == AppMode.seller) ...[
  _ProfileMenuDivider(),
  _ProfileMenuItem(
    icon: Icons.account_balance_wallet_outlined,
    label: 'Earnings Dashboard',
    onTap: () => context.push('/seller/stripe-onboard'),       // ← WRONG (line 531)
  ),
],
```

**Apply (D-25 — 1-line fix; route already exists at app.dart:455):**
```dart
onTap: () => context.push('/seller/earnings'),
```

> **Sibling concern (D-25 second sentence):** Payment Methods at line 538 also routes to `/seller/stripe-onboard`. Either repurpose this menu entry to a buyer-side payment-methods screen or remove the entry entirely. Planner decides.

---

### `mobile/lib/features/auth/presentation/screens/register_screen.dart` (business toggle reveals EIN)

**In-file analog:** lines 28 (`_accountType` state), 250–276 (ZIP + Account Type pattern), 272–275 (`_AccountTypeSelector`).

**Pattern to extend:**
```dart
// register_screen.dart:28 — already exists
String _accountType = 'buyer';

// Add a new TextEditingController
final _einController = TextEditingController();

@override
void dispose() {
  _einController.dispose();
  // ... existing disposes
  super.dispose();
}

// In build(), AFTER the AccountTypeSelector at line 275:
const SizedBox(height: 24),
_AccountTypeSelector(
  value: _accountType,
  onChanged: (v) => setState(() => _accountType = v),
),
if (_accountType == 'business') ...[                           // NEW conditional reveal
  const SizedBox(height: 16),
  AppInputField(
    controller: _einController,
    label: 'EIN',
    hint: '12-3456789',
    prefixIcon: Icons.business_outlined,
    keyboardType: TextInputType.text,
    textInputAction: TextInputAction.done,
    validator: (v) {
      if (_accountType != 'business') return null;
      if (v == null || v.isEmpty) return 'EIN is required for business accounts';
      if (!RegExp(r'^\d{2}-\d{7}$').hasMatch(v)) return 'Format: XX-XXXXXXX';
      return null;
    },
  ),
],

// In _handleRegister() — pass ein to provider
await ref.read(authProvider.notifier).register(
  // ... existing fields
  accountType: _accountType,
  ein: _accountType == 'business' ? _einController.text.trim() : null,  // NEW
);
```

> The `authProvider.register()` Dart method signature needs `ein` added — mirror existing `phone`/`locationZip` optional pattern.

---

### `mobile/lib/features/posts/presentation/screens/post_detail_screen.dart` (PII gate lock-icon UI — D-13)

**In-file analog:** `_InfoGrid` at lines 320–360 (location row).

**Existing pattern (lines 339–344):**
```dart
if (post.locationAddress != null)
  _InfoItem(
    icon: Icons.location_on_outlined,
    label: 'Location',
    value: post.locationAddress!,
  ),
```

**Apply (D-13 — when seller has no funded transaction, show city/state/zip + lock icon):**
```dart
// Backend redacts post.locationAddress to null pre-funding (per posts.service.ts redaction).
// Show city/state/zip view + lock icon + microcopy.
if (post.locationAddress != null)
  _InfoItem(
    icon: Icons.location_on_outlined,
    label: 'Location',
    value: post.locationAddress!,
  )
else if (post.locationCity != null && post.locationState != null)
  _InfoItem(
    icon: Icons.lock_outline,                                  // NEW — D-13 lock affordance
    label: 'Location',
    value: '${post.locationCity}, ${post.locationState}'
           '${post.locationZip != null ? ' ${post.locationZip}' : ''}',
    subtext: 'Full address shared after payment',              // microcopy (add to _InfoItem if absent)
  ),
```

> Verify the `Post` model has `locationCity`/`locationState`/`locationZip` fields — they ARE on the backend response (`toPostResponse` posts.service.ts:835–836) so the Dart model should already have them. If `_InfoItem` doesn't accept `subtext`, add the param mirroring its existing `value` field.

---

### Job-creation flow — A-05 role-tier dropdown (mobile post creation)

**Analog:** `register_screen.dart` `_AccountTypeSelector` (lines 272–275) for the dropdown widget shape; `manual_post_creation_screen.dart` for the form step shape.

**Apply (Addendum A-05):** during a Jobs-category post creation, surface a dropdown bound to `categorySpecific.roleTier` (one of `entry` | `mid` | `specialized_senior`). Mirror the AccountTypeSelector card pattern. Persist into the existing `categorySpecific` JSONB field — no schema change needed (posts.schemas.ts:49).

```dart
// In manual_post_creation_screen.dart's Jobs branch:
DropdownButtonFormField<String>(
  decoration: const InputDecoration(labelText: 'Role Tier'),
  value: _roleTier,
  items: const [
    DropdownMenuItem(value: 'entry', child: Text('Entry')),
    DropdownMenuItem(value: 'mid', child: Text('Mid')),
    DropdownMenuItem(value: 'specialized_senior', child: Text('Specialized / Senior')),
  ],
  onChanged: (v) => setState(() => _roleTier = v ?? 'entry'),
  validator: (v) => v == null ? 'Required for job posts' : null,
),

// On submit, fold into categorySpecific:
categorySpecific: { 'roleTier': _roleTier, ...otherFields },
```

**Backend lead-pricing engine** (jobs lead-fee — Addendum A-05 + RESEARCH.md table row "Jobs lead pricing"):

Add a function to `backend/src/common/utils/fees.ts` (sibling to `calculateFees`). Pattern to mirror — the existing `calculateFees` switch (fees.ts:21–113):
```typescript
export function calculateJobLeadFee(roleTier: 'entry' | 'mid' | 'specialized_senior'): number {
  switch (roleTier) {
    case 'entry':              return 10;     // $10 per lead
    case 'mid':                return 50;
    case 'specialized_senior': return 500;
  }
}
```

Wire into transactions.service.ts at the same place `calculateFees()` is invoked, gated by `transactionType === 'job_milestone'`.

---

## Shared Patterns

### Authentication / Authorization
**Source:** `backend/src/modules/saved-sellers/saved-sellers.routes.ts:14–24` (and every route file).
**Apply to:** every new endpoint (Stripe Identity session creation, audit suite endpoint coverage).
```typescript
typedApp.post(
  '/identity/verify',
  {
    schema: { tags: ['Sellers'], description: 'Start Stripe Identity verification', security: [{ bearerAuth: [] }] },
    onRequest: [app.authenticate],
  },
  async (request, reply) => {
    const result = await sellersService.createIdentitySession(request.user.sub);
    return reply.status(201).send({ success: true, data: result });
  },
);
```

### Error Handling
**Source:** `backend/src/common/utils/errors.ts` via the `AppError` family (`NotFoundError`, `ConflictError`, `ForbiddenError`, `ValidationError`).
**Apply to:** every new service path. Already imported by every analog above (e.g., sellers.service.ts:3–7, payments.service.ts:6–10).
```typescript
import { NotFoundError, ConflictError, ForbiddenError } from '../../common/utils/errors.js';
// ...
if (!seller) throw new NotFoundError('Seller profile');
if (depth >= MAX_COUNTER_DEPTH) throw new ConflictError(`Counter chain at max ${MAX_COUNTER_DEPTH + 1} rounds`);
```

### Validation (Zod)
**Source:** `backend/src/modules/auth/auth.schemas.ts:14–32` (`registerSchema` with regex + describe).
**Apply to:** EIN regex, role-tier enum, any new DTO. Use `.describe()` for Swagger docs — every existing schema does.
```typescript
ein: z.string().regex(/^\d{2}-\d{7}$/, 'Invalid EIN format').optional().describe('US EIN (XX-XXXXXXX)'),
roleTier: z.enum(['entry', 'mid', 'specialized_senior']).describe('Job role tier'),
```

### Response shape
**Source:** every service `toXxxResponse()` private method (`toAuthUser` auth.service.ts:523, `toSellerProfileResponse` sellers.service.ts:340, `toOfferResponse` offers.service.ts:717, `toPostResponse` posts.service.ts:782).
**Apply to:** new identity-session response, new audit assertion fixtures.
```typescript
return reply.status(201).send({ success: true, data: result });   // never raw, always wrapped
```

### Lazy SDK init pattern
**Source:** `backend/src/modules/payments/payments.service.ts:41,128,186,211` — every Stripe call goes through `getStripe()`.
**Apply to:** new `createIdentitySession()` (`stripe.identity.verificationSessions.create(...)`). Never instantiate `new Stripe(...)` directly — always `const stripe = getStripe();`.

### Webhook dedup
**Source:** `backend/src/modules/payments/payments.webhook.ts:45–50`.
**Apply to:** Identity events flow through identical path; do not add any dedup logic in the Identity handler.
```typescript
const dedupKey = `stripe:event:${event.id}`;
const alreadyProcessed = await redis.set(dedupKey, '1', 'EX', WEBHOOK_DEDUP_TTL, 'NX');
if (!alreadyProcessed) { return reply.status(200).send({ received: true }); }
```

### Test bootstrap
**Source:** `backend/tests/saved-sellers.test.ts:43–118` (register/login + cleanup) + `backend/tests/helpers.ts:20–75` (`createTestUser` + `authHeaders`).
**Apply to:** `closeout-audit.test.ts` setup. Use `helpers.ts` to keep boilerplate minimal.

### Mobile lifecycle observer
**Source:** RESEARCH.md Pattern 3 (canonical `WidgetsBindingObserver` snippet).
**Apply to:** both `stripe_onboard_screen.dart` (D-24 fix) and the new `identity_verify_screen.dart` from day one.
```dart
class _State extends ConsumerState<...> with WidgetsBindingObserver {
  @override void initState() { super.initState(); WidgetsBinding.instance.addObserver(this); }
  @override void dispose() { WidgetsBinding.instance.removeObserver(this); super.dispose(); }
  @override void didChangeAppLifecycleState(AppLifecycleState s) {
    if (s == AppLifecycleState.resumed) { /* refetch server state */ }
  }
}
```

### Mobile network call pattern
**Source:** `mobile/lib/features/sellers/providers/seller_provider.dart` `startStripeOnboarding()` (referenced by stripe_onboard_screen.dart:33). Confirm shape during plan; new `startIdentityVerification()` mirrors it 1:1.

### Mobile UI primitives in use
**Source:** `mobile/lib/shared/widgets/section_card.dart`, `gradient_button.dart`, `styled_app_bar.dart`, `app_input_field.dart`, `status_badge.dart` — every screen above already imports these. Use them; do not introduce new primitives.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| (none) | — | — | All Phase 3 files have a clear analog in the shipped codebase. |

---

## Metadata

**Analog search scope:**
- `backend/src/modules/{auth,sellers,payments,offers,posts,saved-sellers}/` — full module reads
- `backend/src/config/{env,geocoding,stripe}.ts`, `backend/src/common/utils/{storage,fees,errors}.ts`
- `backend/tests/` — saved-sellers, payments, sellers, offers, helpers, global-setup, vitest.config.ts
- `backend/prisma/schema.prisma` — `PostStatus` + enum block
- `mobile/lib/features/{sellers,profile,auth,offers,posts}/presentation/screens/` — all relevant screens
- `mobile/lib/features/offers/presentation/widgets/counter_offer_modal.dart`
- `mobile/lib/app.dart` (route registry)

**Files scanned:** 24
**Pattern extraction date:** 2026-04-29

---

## PATTERN MAPPING COMPLETE

**Phase:** 03 — MVP Implementation Closeout
**Files classified:** 14 (8 net-new/modified + 6 verify-only)
**Analogs found:** 14 / 14

### Coverage
- Files with exact analog: 12
- Files with role-match analog: 2
- Files with no analog: 0

### Key Patterns Identified
- Backend services co-locate Stripe SDK calls behind `getStripe()` (lazy singleton). Identity session creation mirrors `paymentsService.startSellerOnboarding()` line-for-line.
- Webhook handler is a single `switch (event.type)` block in `payments.service.ts:266` — Identity events extend it; the wrapper at `payments.webhook.ts` (signature verify + Redis dedup) is reused unchanged. ONE secret, ONE endpoint.
- Counter-offer chain already exists via `Offer.parentOfferId`. Phase 3 only adds a depth check before the existing `prisma.$transaction([...])` block. No new table, no schema change.
- PII redaction follows the existing `stripBudgetForNonOwner()` shape — add a sibling `redactPiiForNonFundedRequester()` helper, apply at every callsite where a non-owner reads a post.
- Vitest audit suite uses the existing `tests/global-setup.ts` + `helpers.ts:createTestUser` scaffolding and runs via `npx vitest run tests/audit` — no project nesting (per RESEARCH.md Pitfall 5).
- Mobile screens that depend on server-side state changes outside the app must implement `WidgetsBindingObserver.didChangeAppLifecycleState` and refetch on `resumed`. Bake this into Identity verify screen from day one to avoid the Stripe Connect Bug B regression.
- Env hardening promotes two existing warnings to errors in `validateProductionEnv` — no new logic, just two strings move from `warnings.push` to `errors.push`.

### File Created
`/Users/faisalidris/ReverseMarketplace/.planning/phases/03-mvp-implementation-closeout/03-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Planner can now reference analog patterns in PLAN.md files. Every Phase 3 plan should include a `<read_first>` block citing the relevant analog file:line range and an `<acceptance_criteria>` line that confirms shipped behavior is preserved.
