# Phase 3: MVP Implementation Closeout — Research

**Researched:** 2026-04-29
**Domain:** Backend audit reconciliation, geosearch, Stripe Identity, counter-offer flow, Vitest audit harness, Flutter Stripe Connect carry-over fix
**Confidence:** HIGH on what's already shipped (verified by codebase grep + file reads). HIGH on Stripe Identity / Vitest 4 / PostGIS-on-Supabase (verified via context7 + Stripe + Supabase docs). MEDIUM on the optimal PostGIS-vs-Haversine tradeoff — judgment call once the planner sees the size of the existing Haversine implementation.

## Summary

**The biggest finding is that CONTEXT.md materially overstates the missing surface area.** Many items that D-01 through D-28 frame as net-new work are ALREADY shipped. Phase 3 is roughly **half the size CONTEXT.md implies**, and the planner should not write plans that re-build existing modules. Specifically:

- `MAX_OFFERS_PER_POST` cap, `Archived` PostStatus, video MIMEs, SavedSeller model+module+tests, counter-offer endpoint, counter-offer Flutter modal, geocoding utility, Haversine SQL radius filter, and the 3-day exclusivity write/read paths are **all already implemented**.
- The genuinely-new surface area is: a targeted-seller carve-out (the *positive* half of exclusivity), Stripe Identity webhook handler + verification-session creation endpoint, EIN gate at registration, Jobs lead-pricing engine, PII gate redaction, the Stripe Connect 3-bug fix + env hardening, and the Vitest closeout audit suite.
- D-01's PostGIS migration is a **rewrite of working code**, not a fill-in for missing code. The planner should treat this as a "should we rewrite the working Haversine SQL?" decision, not as a "PostGIS is required to make geosearch work" assumption.
- D-05/D-06's new `OfferRevision` table **conflicts with shipped counter-offer code** that uses Offer self-relation chain (`parentOfferId` + `counterOffers`). Reconciling this is a higher-risk decision than CONTEXT.md anticipates and needs explicit user re-confirmation before plan-time.

**Primary recommendation:** Planner should split Phase 3 into two tracks: (a) *closeout micro-fixes* against the actual delta (constant change + targeted-seller carve-out + Stripe Connect 3-bug + env hardening + audit suite), and (b) *new feature work* (Stripe Identity, EIN gate, Jobs lead pricing, PII gate). The geosearch and counter-offer "rebuilds" should go through a discuss-phase re-confirmation pass before being planned because the existing implementations either work or partially work — rebuilding from scratch creates regression risk Phase 1 didn't.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Geocoding (address → lat/lng) | API / Backend | — | Network call to Google Maps; result cached on row. Already implemented at `backend/src/config/geocoding.ts` |
| Distance computation (radius filter) | Database (PostGIS) **OR** API (Haversine SQL) | — | Currently API-tier with raw SQL Haversine in `posts.service.ts`. PostGIS rewrite would push the math into the DB engine for index-backed performance. Decision required from planner. |
| 3-day exclusivity filter | API / Backend | — | Service-layer time predicate on `posts.public_after`. Exclusion half shipped; targeted-seller inclusion half missing. |
| Counter-offer state | API / Backend | Mobile (modal UI) | Linear chain via `Offer.parentOfferId` already shipped. Mobile modal already shipped. Net new: Phase 3 *only* needs to expose the existing `/offers/:id/counter` endpoint via the existing modal. |
| Stripe Identity webhook | API / Backend | Mobile (redirect to hosted URL) | Webhook signature verification reuses `payments.webhook.ts` plugin pattern. Mobile uses `url_launcher` redirect (no Flutter SDK exists for Identity). |
| EIN gate at registration | API / Backend | Mobile (form field) | Business-account branch in `auth.service.ts` checks `businessType === 'business'` → require EIN field present. |
| Jobs lead pricing | API / Backend | Mobile (employer email-domain check on registration form) | Per-lead $10–500 charge engine on transaction creation when `transactionType === 'job_milestone'`. |
| PII redaction (city+state+zip pre-funding) | API / Backend | Mobile (lock-icon UI) | Service-layer field stripping in `posts.service.ts` and `offers.service.ts` based on requester+escrow status. UI shows microcopy. |
| Stripe Connect 3-bug fix | API / Backend (env defaults) **+** Mobile (lifecycle observer + route correction) | — | Bug A is env. Bugs B/C are Flutter widget state + GoRouter route wiring. Cross-tier coordination required. |

## Standard Stack

### Core (already in place — DO NOT change)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Fastify | 5.7.4 | HTTP framework | [VERIFIED: backend/package.json:73] Locked DEC-fastify-framework |
| Prisma | 7.4.0 | ORM | [VERIFIED: backend/package.json:65] Locked DEC-prisma-7-driver-adapter |
| `@prisma/adapter-pg` | 7.4.0 | Driver adapter (Postgres) | [VERIFIED: backend/package.json:64] |
| Zod | 4.3.6 | Validation | [VERIFIED: backend/package.json:78] Locked DEC-zod-4-validation |
| Stripe (Node SDK) | 20.3.1 | Payments + Identity | [VERIFIED: backend/package.json:75] Already supports Identity API surface |
| Vitest | 4.0.18 | Test framework | [VERIFIED: backend/package.json:93] |
| `@vitest/coverage-v8` | 4.0.18 | Coverage | [VERIFIED: backend/package.json:86] |
| `flutter_stripe` | 11.3.0 | Mobile Stripe SDK | [VERIFIED: mobile/pubspec.yaml:56] **Does NOT support Identity** — see Pitfall 1 |
| `url_launcher` | 6.3.1 | External browser redirect | [VERIFIED: mobile/pubspec.yaml:42] Used for Identity hosted flow |

### Phase 3 additions (none net-new — just existing libraries used in new code paths)
| Library | Already Installed | Purpose in Phase 3 | Source |
|---------|--------------------|---------------------|--------|
| `@google/generative-ai` | yes | Already used; not part of Phase 3 | — |
| Stripe Identity API | via existing `stripe` SDK | Verification sessions + webhooks | [CITED: docs.stripe.com/api/identity/verification_sessions/create] |
| `pg` (raw queries) | yes (8.18.0) | If planner chooses PostGIS, use `prisma.$queryRaw` for `ST_DWithin` | [VERIFIED: backend/package.json:71] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PostGIS rewrite (D-01) | Keep existing Haversine SQL | Existing code works at MVP scale (5K posts/yr). PostGIS gains spatial index but adds extension management + Supabase coupling. Recommend KEEPING Haversine unless planner finds explicit perf data showing it's slow. |
| New `OfferRevision` table (D-05) | Keep existing `Offer.parentOfferId` chain | Existing chain already used by `/offers/:id/counter` endpoint and tested in `offers.test.ts`. Changing the model would invalidate shipped tests + invalidate the working mobile counter modal. **Strongly recommend KEEPING the existing chain.** |
| `@googlemaps/google-maps-services-js` (cross-cutting) | Existing native `fetch()` in `geocoding.ts` | Native fetch is shipped, tested (`geocoding.test.ts`), and consistent with the lazy-init pattern. Don't add the SDK dependency. |
| Vitest "test projects" (D-14) | Single config + path filter `npx vitest run tests/audit` | Single config wins — existing 25 tests already share `vitest.config.ts` and `globalSetup`. Adding a project for one folder adds config drift. |

**Installation:** No new npm packages required for Phase 3.

**Version verification:**
```bash
# Verified via Bash on 2026-04-29
# vitest@4.0.18, prisma@7.4.0, stripe@20.3.1, flutter_stripe@11.3.0
```

## Architecture Patterns

### System Architecture Diagram

```
                       Phase 3 New / Changed Surfaces
                       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ┌──────────────────────────────────────────────────────────────┐
   │ Mobile (Flutter)                                              │
   │   ┌─────────────┐    ┌──────────────────┐  ┌──────────────┐  │
   │   │ profile_    │    │ stripe_onboard_  │  │ identity_    │  │
   │   │ screen.dart │    │ screen.dart      │  │ verify_      │  │
   │   │ (re-route   │    │ (lifecycle       │  │ screen.dart  │  │
   │   │  fixes)     │    │  observer)       │  │ (NEW)        │  │
   │   └──────┬──────┘    └────────┬─────────┘  └──────┬───────┘  │
   │          │                    │                   │ url_      │
   │          ▼                    ▼                   ▼ launcher  │
   └──────────┴────────────────────┴───────────────────┴──────────┘
              │                    │                   │
              ▼                    ▼                   ▼ verify.stripe.com
   ┌──────────────────────────────────────────────────────────────┐
   │ Fastify API (Node 20+)                                        │
   │                                                                │
   │  Existing (don't rebuild)        New endpoints / handlers      │
   │  ━━━━━━━━━━━━━━━━━━━━━━━        ━━━━━━━━━━━━━━━━━━━━━━━━     │
   │  POST  /offers/:id/counter      POST /sellers/identity/verify │
   │  POST  /posts (geocode call)         (creates VerificationSession) │
   │  GET   /posts (Haversine SQL)   POST /payments/webhook        │
   │  POST  /saved-sellers/:id            (+identity.* event types)│
   │  POST  /posts/:id/archive       POST /auth/register           │
   │                                       (EIN gate for business) │
   │                                  + Jobs lead-fee in fees.ts   │
   │                                  + PII redaction in           │
   │                                    posts.service / offers.service │
   │                                  + 3-day targeted-seller carve-out  │
   │                                  + MAX_OFFERS_PER_POST=25     │
   └────────────────────────┬─────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
   ┌─────────────────────┐    ┌─────────────────────┐
   │ Supabase Postgres   │    │ Redis (BullMQ +     │
   │ (existing schema +  │    │  webhook dedup +    │
   │  optional PostGIS   │    │  rate limits)       │
   │  extension)         │    └─────────────────────┘
   └─────────────────────┘
```

### Recommended Project Structure (additions only)

```
backend/
├── src/
│   ├── modules/
│   │   ├── sellers/
│   │   │   └── identity-verify.service.ts       # NEW — VerificationSession creation
│   │   ├── auth/
│   │   │   └── auth.schemas.ts                  # MODIFY — EIN required when businessType=business
│   │   ├── posts/
│   │   │   └── posts.service.ts                 # MODIFY — targeted-seller carve-out + PII redaction
│   │   ├── offers/
│   │   │   └── offers.service.ts                # MODIFY — MAX_OFFERS_PER_POST=25, PII redaction
│   │   └── payments/
│   │       └── payments.webhook.ts              # MODIFY — add identity.* event handlers
│   └── common/utils/
│       └── fees.ts                              # MODIFY — add jobs lead-pricing tier function
├── prisma/
│   └── custom-migrations/
│       └── 002_postgis_geography.sql            # OPTIONAL — only if planner chooses PostGIS rewrite
└── tests/
    └── audit/
        └── closeout-audit.test.ts                # NEW — Vitest closeout audit suite

mobile/
└── lib/
    └── features/
        ├── profile/presentation/screens/profile_screen.dart       # 1-line + 1-line fixes
        ├── sellers/presentation/screens/
        │   ├── stripe_onboard_screen.dart                         # WidgetsBindingObserver + state model
        │   └── identity_verify_screen.dart                        # NEW — url_launcher to hosted flow
```

### Pattern 1: Stripe Identity webhook handler (drop-in to existing payments.webhook.ts)

**What:** Add `identity.verification_session.*` event types to the existing webhook handler. **Same endpoint, same signing secret as Connect** — Stripe webhooks are scoped per endpoint URL, not per event family.

**When to use:** Webhook arrives at the existing `/api/v1/payments/webhook` route. The dedup logic, signature verification, and content-type parser are already in place.

**Example:**
```typescript
// Source: docs.stripe.com/api/events/types — identity.verification_session.verified
// Verified: backend/src/modules/payments/payments.webhook.ts:52 already calls handleWebhookEvent

// In payments.service.ts handleWebhookEvent(), add:
case 'identity.verification_session.verified': {
  const session = event.data.object as Stripe.Identity.VerificationSession;
  const sellerId = session.metadata?.sellerProfileId;
  if (!sellerId) { request.log.warn({event: event.id}, 'Identity webhook missing sellerProfileId metadata'); break; }

  // Auto-create approved VerificationRequest (per D-16) using existing pipeline
  await prisma.verificationRequest.create({
    data: {
      sellerId,
      verificationType: 'id',
      tier: 2,
      status: 'approved',
      reviewedAt: new Date(),
      notes: `Auto-approved via Stripe Identity session ${session.id}`,
    },
  });
  // Trigger existing tier-recalc path (already exists in admin or sellers service)
  await sellersService.recalculateVerificationTier(sellerId);
  break;
}

case 'identity.verification_session.requires_input':
case 'identity.verification_session.canceled':
  // Log but do not auto-reject — buyer can retry
  break;
```

**Critical:** Set `metadata.sellerProfileId` when CREATING the VerificationSession server-side, so the webhook can route the event back to the right seller.

### Pattern 2: Stripe Identity session creation (server endpoint)

```typescript
// Source: docs.stripe.com/identity/verify-identity-documents (Redirect/Hosted integration)
// Verified via context7: /websites/stripe — POST /v1/identity/verification_sessions

async createIdentityVerificationSession(userId: string) {
  const seller = await this.getSellerProfile(userId);
  const stripe = getStripe();
  const session = await stripe.identity.verificationSessions.create({
    type: 'document',
    options: { document: { require_matching_selfie: true } },
    metadata: { sellerProfileId: seller.id, userId },
    return_url: env.STRIPE_IDENTITY_RETURN_URL ?? 'reversemarket://seller/identity/complete',
  });
  // Return ONLY the URL (hosted flow) since flutter_stripe doesn't support Identity SDK
  return { sessionId: session.id, url: session.url };
}
```

### Pattern 3: Mobile lifecycle observer (Stripe Connect Bug B fix)

```dart
// Source: api.flutter.dev/flutter/widgets/WidgetsBindingObserver-class.html
// Pattern: stripe_onboard_screen.dart needs WidgetsBindingObserver

class _StripeOnboardScreenState extends ConsumerState<StripeOnboardScreen>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadAll();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadAll(); // refetch loadStripeStatus + loadProfile
    }
  }

  // Derive isInProgress from server state, not local widget state:
  bool get _isInProgress {
    final s = ref.read(stripeStatusProvider).valueOrNull;
    return s?.onboarded == true && s?.chargesEnabled == false;
  }
}
```

### Anti-Patterns to Avoid

- **Building OfferRevision as a new table when `Offer.parentOfferId` chain works.** The shipped code uses self-relation chain. Adding a parallel table breaks the existing `/offers/:id/counter` endpoint, the existing Flutter modal, and `offers.test.ts`.
- **Rewriting Haversine SQL to PostGIS in Wave 1 just because D-01 said so.** PostGIS is a 1–2 day migration with extension permissions, schema concerns, and Prisma `Unsupported` columns. The shipped Haversine works at 5K posts/yr scale. If radius perf hasn't been measured, leave it alone.
- **Adding `STRIPE_IDENTITY_WEBHOOK_SECRET`.** Stripe assigns one signing secret per endpoint URL, not per event family. Connect + Identity events sharing `/api/v1/payments/webhook` use the SAME secret. Adding a second env var creates confusion. (Source: docs.stripe.com/webhooks — verified 2026-04-29.)
- **Re-creating SavedSeller, archive endpoint, video MIME allowlist, or counter-offer endpoint.** All shipped. The audit must have been written against an older snapshot. Verify before planning these.
- **Using `vitest --project` for the audit suite.** Existing 25 tests share one config; the audit suite is just `npx vitest run tests/audit`. Don't add config complexity.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Address → lat/lng | Hand-rolled fetch loop with retries | Existing `geocodeAddress()` at `backend/src/config/geocoding.ts` (already shipped, tested) | One-line cache hit; no need to repeat |
| Distance math | Custom haversine in TypeScript | Existing `haversineDistance()` at `backend/src/common/utils/geo.ts` | Already used by offers.service + posts.service |
| Counter-offer state machine | New OfferRevision table | Existing `Offer.parentOfferId` chain | Already shipped; tested; mobile modal wired up |
| Identity verification UI | Custom document scanner / camera widget | Stripe-hosted flow via `url_launcher` | `flutter_stripe` does not support Identity (verified via flutter-stripe issue #1819, still open). Identity hosted URL works on iOS+Android with zero native code. |
| Webhook signature verification | Re-implement HMAC in handler | Existing `verifyWebhookSignature()` in `backend/src/config/stripe.ts` | Stripe SDK does it; payments.webhook.ts already calls it |
| EIN format validation | Custom regex | Zod's `z.string().regex(/^\d{2}-\d{7}$/)` (9 digits with hyphen) — IRS standard | Standard format, well-defined |
| Employer email-domain reject list | Maintain a giant block list | Tiny allowlist of business-domain *patterns* OR a small denylist of free providers (gmail.com, yahoo.com, hotmail.com, outlook.com, aol.com, icloud.com, proton.me, etc.) | A 10-entry denylist covers ~95% of free-provider mail; the rest go through manual review |
| Webhook event dedup | New Redis namespace | Existing `stripe:event:{event.id}` SETNX with 24h TTL in `payments.webhook.ts:46` | Already handles Connect retries; identity events flow through identical path |
| PostGIS extension installation | DIY SQL in Prisma migration | Supabase dashboard one-click `Database → Extensions → postgis` (recommended) OR `CREATE EXTENSION postgis WITH SCHEMA extensions;` in custom-migrations SQL file | Supabase has a built-in toggle |

**Key insight:** Phase 3 is mostly *connecting existing pipework*, not building new modules. The audit re-running CONTEXT.md was based on appears stale (says SavedSeller missing — it's shipped). Recommend planner verify each "missing" item against the codebase before writing a plan for it.

## Runtime State Inventory

> Phase 3 is primarily code/config work. Limited runtime state implications:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | (a) `posts.public_after` already populated for all posts created since Phase 1 — no migration needed. (b) If PostGIS rewrite is chosen, all existing `posts.latitude` / `posts.longitude` Decimal columns need backfilling into a new `geography(Point, 4326)` column. ~unknown count of historical posts; can be done in-place with `UPDATE posts SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography`. | Choose PostGIS or not. If yes → backfill in same migration as the column add. |
| Live service config | Stripe Dashboard webhook endpoint registration: existing `/api/v1/payments/webhook` already receives Connect events; needs identity.* events ENABLED in Stripe Dashboard for the same endpoint. | Manual: enable identity.verification_session.* event types in Stripe Dashboard → Developers → Webhooks → existing endpoint. NO new endpoint URL or secret. |
| OS-registered state | None — no Windows tasks, launchd plists, pm2 entries reference Phase 3 changes. | None |
| Secrets/env vars | (a) `GOOGLE_MAPS_API_KEY` already in env.ts:46 (currently optional). (b) `STRIPE_CONNECT_RETURN_URL` and `STRIPE_CONNECT_REFRESH_URL` already in env.ts:52-53. (c) NO new `STRIPE_IDENTITY_*` secrets needed. (d) Optional new: `STRIPE_IDENTITY_RETURN_URL` if planner wants a distinct deep-link path; otherwise reuse the Connect return URL. | Update `backend/.env.example` and `backend/.env` for prod values; make GOOGLE_MAPS_API_KEY required in prod via env.ts validateProductionEnv(). |
| Build artifacts | None — pure code changes. | None |

**Verified by:** `grep -rn "GOOGLE_MAPS_API_KEY\|STRIPE_IDENTITY" backend/`, `cat backend/src/config/env.ts`, codebase reads on 2026-04-29.

## Common Pitfalls

### Pitfall 1: `flutter_stripe` does NOT support Stripe Identity

**What goes wrong:** Engineer assumes the official Flutter Stripe SDK has Identity support like the React Native variant. Wastes time looking for a method that doesn't exist.

**Why it happens:** React Native's `@stripe/stripe-react-native` exposes Identity. Flutter does not — the official package's GitHub Issue #1819 (June 2024) requesting Identity support is **still open** as of 2026-04-29.

**How to avoid:** Use the **redirect / hosted flow** instead. Backend creates a VerificationSession via `stripe.identity.verificationSessions.create({type: 'document', ...})` and returns the `session.url`. Mobile uses `url_launcher` (already in pubspec, used for Stripe Connect onboarding) to open the URL in an external browser. After verification, Stripe redirects back via the `return_url` (use the existing `reversemarket://` deep-link scheme).

**Warning signs:** Searches for "stripe identity flutter sdk" returning third-party `stripe_identity_plugin` (1.0.5, unverified uploader, "not endorsed by Stripe") — DO NOT use this; the official + hosted-flow path is the safe choice.

**Source:** [VERIFIED via WebFetch] github.com/flutter-stripe/flutter_stripe/issues/1819 still open. [VERIFIED via WebFetch] pub.dev/packages/stripe_identity_plugin is third-party.

### Pitfall 2: Webhook signing-secret confusion

**What goes wrong:** Engineer adds `STRIPE_IDENTITY_WEBHOOK_SECRET` env var thinking Identity events use a different signing secret than Connect events.

**Why it happens:** The CONTEXT.md D-17 note hedges: *"if Stripe Identity uses a separate endpoint per Stripe's webhook architecture (verify during research phase)."* This research confirms it does NOT.

**How to avoid:** Stripe assigns ONE signing secret PER ENDPOINT URL. If both Connect events and Identity events arrive at `/api/v1/payments/webhook`, they share `STRIPE_WEBHOOK_SECRET`. Just enable the new event types on the existing webhook endpoint in Stripe Dashboard.

**Warning signs:** PR adds new env var; PR adds new webhook route at `/api/v1/identity/webhook`. Both are red flags.

**Source:** [CITED: docs.stripe.com/webhooks] "Stripe generates a unique secret key for each endpoint" — secret tied to endpoint URL, not event family.

### Pitfall 3: Re-implementing already-shipped features

**What goes wrong:** Plan is written against CONTEXT.md decisions that assume nothing exists, but the codebase already has working implementations. Engineer ships a parallel implementation, breaking existing tests.

**Why it happens:** CONTEXT.md was authored against the 2026-04-18 audit; reality has drifted. The audit listed "SavedSeller missing", but the module is shipped (routes, service, tests, schema, model). Same for `PostStatus.archived`, video MIMEs, counter-offer endpoint, and the Flutter counter modal.

**How to avoid:** **Before planning each item, run a one-liner grep against the codebase.** Cheat sheet:
- `grep -n "MAX_OFFERS_PER_POST" backend/src/modules/offers/offers.service.ts` → confirm it's 10 (true) needs change to 25
- `grep -n "PostStatus.archived\|status: 'archived'" backend/src/modules/posts/posts.service.ts` → already shipped, verify enum value present
- `ls backend/src/modules/saved-sellers/` → already exists with routes/service/schemas
- `grep -n "video/mp4\|video/quicktime" backend/src/common/utils/storage.ts` → already in allowlist
- `grep -n "counterOffer\|/:offerId/counter" backend/src/modules/offers/` → already shipped
- `ls mobile/lib/features/offers/presentation/widgets/counter_offer_modal.dart` → already exists (419 lines)

**Warning signs:** Plan task says "create new module X" when `ls backend/src/modules/X` returns files.

### Pitfall 4: PostGIS rewrite without measuring existing perf

**What goes wrong:** D-01 mandates PostGIS. Engineer migrates the schema, hand-writes a new `$queryRaw` for `ST_DWithin`, retests everything, and ships. Existing tests pass, but post-fetch radius filtering in posts.service.ts:580-595 wasn't migrated, so two paths now exist.

**Why it happens:** PostGIS is theoretically better for radius filtering at scale. At MVP scale (5K posts/yr), the index gain is invisible.

**How to avoid:** Before the migration, check whether the existing Haversine SQL has a measured performance problem. Look for slow-query logs, p99 spike reports, or DB-side EXPLAIN output. If none, **defer PostGIS** to a Phase 6 perf hardening pass and just add the targeted-seller carve-out to the existing implementation in Phase 3.

**Warning signs:** PR description says "PostGIS for performance" with no benchmark numbers attached.

### Pitfall 5: PostGIS `Unsupported` column type with Prisma 7 driver adapter

**What goes wrong:** Engineer adds `location Unsupported("geography(Point, 4326)")?` to schema.prisma and runs `npx prisma migrate dev`. Migration succeeds locally but fails on Supabase because PostGIS isn't enabled in the right schema.

**Why it happens:** Supabase's recommended pattern is `CREATE EXTENSION postgis WITH SCHEMA extensions;` (not `public`). Prisma's generated SQL doesn't know about this — it generates `geography(Point, 4326)` assuming public schema.

**How to avoid:** Two-step migration: (1) custom SQL migration `backend/prisma/custom-migrations/002_postgis_geography.sql` that does `CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;` THEN `ALTER TABLE posts ADD COLUMN location extensions.geography(Point, 4326)` — note the qualified `extensions.geography` reference. (2) Then add the `Unsupported("extensions.geography(Point, 4326)")` column to schema.prisma. (3) Apply the trigger that maintains location from latitude/longitude on insert/update. Same pattern as the `001_search_vector_trigger.sql` already in custom-migrations/.

**Warning signs:** Migration error: `function st_setsrid does not exist` or `type "geography" does not exist`.

**Source:** [CITED: supabase.com/docs/guides/database/extensions/postgis] — Supabase enables PostGIS in `extensions` schema, not `public`.

### Pitfall 6: Counter-offer round cap (D-07) conflicts with shipped chain

**What goes wrong:** D-07 says max 5 revisions. Existing `counterOffer()` service has NO cap. Engineer ships a cap, but the test fixture already creates 6+ counters. Tests break.

**Why it happens:** Existing chain pattern doesn't enforce a depth limit; D-07 is a new constraint.

**How to avoid:** Before implementing the cap, read `backend/tests/offers.test.ts` to see if any test creates >4 counter rounds. If yes, update the test to assert the cap. The cap goes in `offersService.counterOffer()` by counting upstream `parentOfferId` chain length: `let depth = 0; let cur = offer; while (cur.parentOfferId) { cur = await prisma.offer.findUnique({where:{id:cur.parentOfferId}}); depth++; }` and reject if `depth >= 4` (5 total = original + 4 counters).

**Warning signs:** offers.test.ts fails after the cap lands without test updates.

## Code Examples

Verified patterns from official sources / shipped codebase.

### Stripe Identity verification session creation (server)
```typescript
// Source: docs.stripe.com/api/identity/verification_sessions/create — verified via context7 2026-04-29
import { getStripe } from '../../config/stripe.js';

async function createIdentitySession(userId: string, sellerProfileId: string) {
  const stripe = getStripe();
  return stripe.identity.verificationSessions.create({
    type: 'document',
    options: { document: { require_matching_selfie: true } },
    metadata: { userId, sellerProfileId },
    return_url: env.STRIPE_IDENTITY_RETURN_URL,
    provided_details: { email: /* user email */ },
  });
}
```

### Stripe Identity webhook handler (additions to existing payments.service.handleWebhookEvent)
```typescript
// Source: docs.stripe.com/api/events/types — identity.verification_session.verified
case 'identity.verification_session.verified': {
  const vs = event.data.object as Stripe.Identity.VerificationSession;
  const sellerProfileId = vs.metadata?.sellerProfileId;
  if (!sellerProfileId) return; // already deduped at payments.webhook.ts level

  await prisma.$transaction(async (tx) => {
    await tx.verificationRequest.create({
      data: {
        sellerId: sellerProfileId,
        verificationType: 'id',
        tier: 2,
        status: 'approved',
        reviewedAt: new Date(),
        notes: `Auto-approved: Stripe Identity ${vs.id}`,
      },
    });
    await tx.sellerProfile.update({
      where: { id: sellerProfileId },
      data: { idVerified: true },
    });
    // Existing tier-recalc logic (already exists in admin/sellers service)
  });
  break;
}
```

### Targeted-seller carve-out to 3-day exclusivity (posts.service.ts seller feed)
```typescript
// Existing exclusion (lines 516-520):
//   { OR: [ { publicAfter: null }, { publicAfter: { lte: new Date() } } ] }
// MODIFY TO:
const sellerCategories = sellerProfile.categories as string[];
const includedTargets = await prisma.post.findMany({
  where: {
    publicAfter: { gt: new Date() },
    categoryId: { in: sellerCategories.length > 0 ? sellerCategories : ['__none__'] },
    // Future: explicit `targetedSellerIds` Json column if/when "private invitations" added
  },
});
// THEN: union with the existing post-3-day-window query, dedup by id, stable sort
```

> **Note for planner:** The above is the simplest carve-out (categories-based "targeted" sellers see in-window posts in their categories). If REQ-three-day-exclusivity is interpreted strictly as "buyer chooses specific sellers to invite during the 3-day window", that requires a NEW schema column (`posts.targeted_seller_ids JSONB DEFAULT '[]'`) and a new buyer-side UI. The CONTEXT.md isn't explicit. **Recommend the planner re-confirm with the user during plan review.**

### Vitest closeout audit suite (skeleton — fits existing test patterns)
```typescript
// File: backend/tests/audit/closeout-audit.test.ts
// Verified against existing patterns in tests/posts.test.ts, tests/offers.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/config/database.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;

beforeAll(async () => {
  const { buildApp } = await import('../../src/app.js');
  app = await buildApp();
  await app.ready();
});
afterAll(async () => { await app.close(); });

describe('Phase 3 Closeout — Success Criterion 3 (audit gap closures)', () => {
  it('MAX_OFFERS_PER_POST is 25', async () => {
    // Read the constant via behavior: create 25 offers, 26th should 409
    // (OR import the constant from offers.service if exported)
  });

  it('PostStatus enum contains "archived"', async () => {
    const result = await prisma.$queryRaw<{ enumlabel: string }[]>`
      SELECT enumlabel FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PostStatus')`;
    expect(result.map(r => r.enumlabel)).toContain('archived');
  });

  it('SavedSellers endpoint exists and authenticates', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/saved-sellers' });
    expect(res.statusCode).toBe(401); // unauthenticated
  });

  it('Video MIMEs allowed in uploads', async () => {
    // Read storage.ts constants OR test via /uploads/presigned-url with category=post-videos
  });

  it('Buyer address redacted from seller view pre-funding', async () => {
    // Create post with locationAddress, fetch as a non-buyer seller, expect locationAddress=null
  });

  it('Targeted seller can see in-window post; non-targeted cannot', async () => {
    // Create post with publicAfter > now(); check seller-feed for both seller types
  });
});

describe('Phase 3 Closeout — Success Criterion 5 (Stripe Identity + EIN)', () => {
  it('Business registration without EIN is rejected', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { /* business account, no EIN */ },
    });
    expect(res.statusCode).toBe(400);
  });

  it('Identity verification webhook auto-creates VerificationRequest', async () => {
    // Inject a synthetic identity.verification_session.verified event via paymentsService
    // Assert VerificationRequest row exists with status='approved'
  });
});

describe('Phase 3 Closeout — Success Criterion 6 (Stripe Connect onboarding)', () => {
  it('STRIPE_CONNECT_RETURN_URL is not localhost in production env', () => {
    // import { env } from src/config/env.js; assert pattern
  });
  // (UI-side bugs B/C tested via Flutter widget tests, not Vitest)
});
```

### Mobile counter-offer modal (already shipped — re-uses existing widget)

```dart
// Already at mobile/lib/features/offers/presentation/widgets/counter_offer_modal.dart
// Already wired in offer_detail_screen.dart:664 via showCounterOfferModal()
// Phase 3 work: verify the buyer counter flow round-trips through POST /offers/:id/counter
// Test path: tap "Counter" → modal opens → enter price → submit → seller gets notification
// (No new code required for the modal itself.)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| flutter_stripe with Identity SDK | Hosted redirect flow + `url_launcher` | Phase 3 | Issue #1819 still open as of 2026-04-29 |
| Bash + curl audit script | Vitest audit suite at tests/audit/ | Phase 3 (D-14) | Schema-level + business-rule assertions, not just HTTP smoke |
| Webhook per event family | Single endpoint, multiple event types | Stripe canonical | Verified via docs.stripe.com/webhooks |
| Haversine raw SQL for radius | (Status quo — works fine at MVP) | — | PostGIS as future Phase 6 perf option |

**Deprecated/outdated:**
- `stripe_identity_plugin` (pub.dev) — third-party, unverified maintainer; do not use.
- `cube` + `earthdistance` Postgres extensions — commented-out in `001_search_vector_trigger.sql` (line 26). PostGIS is the modern path if planner chooses geometric DB indexing.

## Project Constraints (from CLAUDE.md)

- **`MAX_OFFERS_PER_POST = 25`** is the canonical decision per ADR; current code drift is 10 (CLAUDE.md docs/decisions §Offers).
- **Prisma 7 driver adapter:** datasource block has NO `url`; URL goes in `prisma.config.ts`. New custom migrations land in `prisma/custom-migrations/` (verified — `001_search_vector_trigger.sql` is the precedent).
- **Lazy SDK init:** `getStripe()`, `getGemini()`, `getSentry()`. Identity client uses the same `getStripe()` (it's the Stripe SDK's `stripe.identity.*` namespace, not a separate client).
- **Stripe Connect** uses Standard accounts + separate-charges-and-transfers (not Destination Charges). Identity is independent of Connect type.
- **Webhook raw body:** payments.webhook.ts already does `addContentTypeParser('application/json', { parseAs: 'buffer' })`. Identity webhook reuses this — no parser changes needed.
- **JSON null:** use `Prisma.JsonNull` for nullable JSONB columns, not `null`.
- **Service-level rate limits:** D-07 round cap (5 revisions max) enforced in service, not at the DB level.
- **Route ordering:** static before parameterized in Fastify (`/me` before `/:id`).
- **gitnexus:** ALWAYS run `gitnexus_impact` before editing any function/method. CRITICAL for `MAX_OFFERS_PER_POST` change (offers.service.ts:21 — high-fan-in constant).
- **Project brand name:** "Sorcyn" (display only); repo + deep-link scheme `reversemarket://` stay.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-three-day-exclusivity | 3-day buyer exclusivity window with targeted-seller carve-out during window | Existing exclusion half shipped (posts.service.ts:165-166, 516-520). Carve-out half = new logic. **OPEN: definition of "targeted" — by category match? Or buyer-curated allowlist?** |
| REQ-seller-feed | Seller browses with distance + radius filter + sort | Already shipped via Haversine SQL in posts.service.ts:580-595 + 659-700. PostGIS rewrite optional. |
| REQ-max-offers-per-post | 25 offers per post | Single constant change at offers.service.ts:21 (10 → 25). High-impact via gitnexus_impact (caller is submitOffer). |
| REQ-counter-offer | Counter-offers via in-app messaging with structured modal | **Already fully shipped** — endpoint, service, schema, mobile modal. Phase 3 = verify behavior + add round cap (D-07). |
| REQ-mvp-search | Basic search + distance | Already shipped (FTS + Haversine). Distance component DONE. |
| REQ-verification-badges | Badge tiers + Stripe Identity for ID Verified | New: Identity webhook handler + verification-session creation endpoint + mobile redirect screen. Approval pipeline reuses existing `VerificationRequest` model. |
| REQ-business-account-ein | EIN required at business registration | New: extend `auth.schemas.ts` with discriminated union (`businessType: 'individual' | 'business'` → if business, `ein: z.string().regex(/^\d{2}-\d{7}$/)` required). |
| REQ-jobs-lead-gen | Per-lead pricing $10–500 + employer email-domain check | New: extend `fees.ts` with role-tier lookup + small denylist (gmail/yahoo/etc). Schema may need `jobs_role_tier` field on the post. |
| REQ-saved-sellers | Save / unsave / list saved sellers | **Already fully shipped** — module exists, tests exist (`tests/saved-sellers.test.ts`), endpoints active in app.ts:228. Phase 3 = verify mobile is wired (mobile grep returned nothing — UI may be missing). |
| REQ-archived-post-status | Archive endpoint | **Already fully shipped** — POST /:postId/archive at posts.routes.ts:191, service at posts.service.ts:387-402, enum at schema.prisma:50. Phase 3 = verify mobile My Posts UI uses it. |
| REQ-video-mime-uploads | Accept mp4/mov for after-photo evidence | **Already shipped** — storage.ts allows video/mp4, video/quicktime, video/webm at 100MB. Schemas enable post-videos category. Phase 3 = verify mobile uploads use the right category. **Note: D-19 says "new 50MB tier"; reality is 100MB. Decision needed: tighten to 50MB or keep 100MB?** |
| REQ-pii-blocked-until-payment | Hide buyer address until escrow funded | New: service-layer redaction in posts.service.ts and offers.service.ts based on `requesterIsBuyer || transaction.escrowFundedAt != null`. |
| REQ-stripe-connect-onboarding-completion | 3-bug fix + env hardening | All file:line anchors documented in 02-UAT.md. Bug A = env. Bug B = WidgetsBindingObserver. Bug C = profile_screen route fix. Env hardening = env.ts validateProductionEnv() additions. |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + Supertest pattern via `app.inject()` |
| Config file | `backend/vitest.config.ts` (single config; no projects) |
| Quick run command | `npx vitest run tests/audit` (after Phase 3 lands) |
| Full suite command | `npx vitest run` (all 25+ files) |
| Global setup | `tests/global-setup.ts` (seeds categories, applies search-vector trigger) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-three-day-exclusivity | Targeted seller sees in-window post | integration | `npx vitest run tests/audit -t 'targeted seller'` | ❌ Wave 0 |
| REQ-seller-feed | Radius filter returns posts ≤ R miles | integration | `npx vitest run tests/posts.test.ts -t 'radius filter'` | ❌ Wave 0 (extend existing posts.test.ts) |
| REQ-max-offers-per-post | 26th offer rejected with 409 | integration | `npx vitest run tests/offers.test.ts -t 'max 25'` | ❌ Wave 0 (extend existing offers.test.ts) |
| REQ-counter-offer | Round cap = 5; 6th counter rejected | integration | `npx vitest run tests/offers.test.ts -t 'counter cap'` | ❌ Wave 0 |
| REQ-mvp-search | Search + distance + budget filter | integration | `npx vitest run tests/search.test.ts` | ✅ exists |
| REQ-verification-badges | Identity webhook → VerificationRequest auto-approved | integration | `npx vitest run tests/sellers.test.ts -t 'identity webhook'` | ❌ Wave 0 |
| REQ-business-account-ein | Register without EIN → 400 | integration | `npx vitest run tests/auth.test.ts -t 'EIN required'` | ❌ Wave 0 |
| REQ-jobs-lead-gen | Lead fee = role-tier * 1.0 within $10-500 | unit | `npx vitest run tests/audit -t 'lead pricing'` | ❌ Wave 0 |
| REQ-saved-sellers | Save / unsave / list 200 | integration | `npx vitest run tests/saved-sellers.test.ts` | ✅ exists |
| REQ-archived-post-status | Archive endpoint returns 200 | integration | `npx vitest run tests/posts.test.ts -t 'archive'` | ✅ exists (verify) |
| REQ-video-mime-uploads | Presigned URL accepts video/mp4 | integration | `npx vitest run tests/uploads.test.ts -t 'video'` | ✅ exists |
| REQ-pii-blocked-until-payment | Seller view of post lacks locationAddress pre-funding | integration | `npx vitest run tests/audit -t 'PII redaction'` | ❌ Wave 0 |
| REQ-stripe-connect-onboarding-completion | env validation refuses prod start with localhost FRONTEND_URL | unit | `npx vitest run tests/audit -t 'env validation'` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run <touched test file>` (e.g., `tests/offers.test.ts` after `MAX_OFFERS_PER_POST` change)
- **Per wave merge:** `npm test` (full Vitest suite)
- **Phase gate:** `npm run validate` (typecheck + full test) green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `backend/tests/audit/closeout-audit.test.ts` — covers REQ-three-day-exclusivity (carve-out), REQ-pii-blocked-until-payment, REQ-jobs-lead-gen (lead-pricing unit tests), REQ-business-account-ein, REQ-stripe-connect-onboarding-completion (env validation)
- [ ] Extend `tests/offers.test.ts` — covers REQ-max-offers-per-post bumped value + REQ-counter-offer round cap
- [ ] Extend `tests/sellers.test.ts` — covers REQ-verification-badges Identity webhook handler
- [ ] Mobile widget test for `stripe_onboard_screen.dart` lifecycle observer — covers REQ-stripe-connect-onboarding-completion Bug B
- [ ] Mobile widget test for `profile_screen.dart` routes (Earnings Dashboard → /seller/earnings) — covers Bug C

## Security Domain

### Applicable ASVS Categories (Level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing JWT (DEC-jwt-access-refresh). Phase 3 doesn't change auth. |
| V3 Session Management | yes | Existing refresh rotation + Redis blacklist. Phase 3 doesn't change. |
| V4 Access Control | **yes (NEW for Phase 3)** | PII gate (REQ-pii-blocked-until-payment) is access-control logic. Counter-offer privacy (D-08) is access control. |
| V5 Input Validation | yes | Zod schemas on every new request body. EIN format regex. Identity session metadata sanitization. |
| V6 Cryptography | yes | Stripe webhook signature verification (existing). Identity uses same SDK / signature path. NEVER hand-roll HMAC. |
| V7 Error Handling | yes | RFC 7807 (DEC-rfc-7807-errors). New endpoints follow pattern. |
| V8 Data Protection | **yes (NEW for Phase 3)** | PII redaction at service layer. Buyer address + phone + email never leak to seller pre-funding. |
| V13 API & Web Service | yes | Rate limits already on /auth (10/min login, 3/hr register, 20/hr AI). Identity verification endpoint should rate-limit (5/hr per user — sessions cost money). |

### Known Threat Patterns for Phase 3 stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Webhook replay (identity event re-sent) | Tampering / Repudiation | Existing `stripe:event:{event.id}` SETNX dedup with 24h TTL |
| PII exfiltration via direct DB query path | Information Disclosure | Service-layer redaction in posts.service.toPostResponse() and offers.service.toOfferResponse() — both methods already exist |
| Forged Identity verification (faked webhook) | Spoofing | Stripe webhook signature verification (existing in `verifyWebhookSignature()`) — Identity events use same signing-secret-per-endpoint guarantee |
| EIN enumeration / scraping | Information Disclosure | EIN never returned in any response body. Server-side only. Validate format but never echo back. |
| Counter-offer abuse (DoS via infinite chain) | DoS | Round cap of 5 (D-07). Service-level enforcement in `counterOffer()`. |
| Geocoding API key leakage | Information Disclosure | `GOOGLE_MAPS_API_KEY` server-side only; `geocodeAddress()` is internal — no public endpoint exposes the raw response. |
| Lead-fee manipulation (job posters faking role tier) | Tampering | Server-derives role tier from category/job description, NOT from client field. Or admin-only adjustment. |
| Stripe Identity selfie deepfake | Tampering | Out of platform scope; Stripe's job. Trust the verified outcome. |

## Sources

### Primary (HIGH confidence)
- [VERIFIED via Read] `backend/prisma/schema.prisma:50` — `archived` enum value present
- [VERIFIED via Read] `backend/prisma/schema.prisma:959-973` — `SavedSeller` model present
- [VERIFIED via Read] `backend/src/common/utils/storage.ts:40-47` — video MIMEs + 100MB cap shipped
- [VERIFIED via Read] `backend/src/modules/offers/offers.routes.ts:111` — `/offers/:offerId/counter` endpoint shipped
- [VERIFIED via Read] `backend/src/modules/offers/offers.service.ts:21` — `MAX_OFFERS_PER_POST = 10` (drift from ADR-locked 25)
- [VERIFIED via Read] `mobile/lib/features/offers/presentation/widgets/counter_offer_modal.dart` — 419-line shipped widget
- [VERIFIED via Read] `backend/src/config/geocoding.ts` — Google Maps Geocoding integration shipped
- [VERIFIED via Read] `backend/src/common/utils/geo.ts` — Haversine utility shipped
- [VERIFIED via Read] `backend/src/modules/posts/posts.service.ts:580-700` — Haversine SQL radius filter + post-fetch radius filter
- [VERIFIED via Read] `backend/src/modules/saved-sellers/` — Module fully shipped
- [VERIFIED via Read] `backend/tests/saved-sellers.test.ts` and `tests/geocoding.test.ts` — Tests already exist
- [VERIFIED via Read] `backend/package.json` — Vitest 4.0.18, Stripe 20.3.1, Prisma 7.4.0
- [CITED: docs.stripe.com/api/identity/verification_sessions/create] — VerificationSession API surface
- [CITED: docs.stripe.com/api/events/types] — `identity.verification_session.*` event names
- [CITED: docs.stripe.com/webhooks] — One signing secret per endpoint URL
- [CITED: supabase.com/docs/guides/database/extensions/postgis] — `CREATE EXTENSION postgis WITH SCHEMA extensions;`
- [CITED via context7 /vitest-dev/vitest] — Vitest CLI flags and project patterns

### Secondary (MEDIUM confidence)
- [VERIFIED via WebFetch] github.com/flutter-stripe/flutter_stripe/issues/1819 — Issue still open; flutter_stripe does NOT support Identity
- [VERIFIED via WebFetch] pub.dev/packages/stripe_identity_plugin — Third-party, not endorsed by Stripe; do not use
- [WebSearch] Confirmed multiple references to "use redirect/hosted flow on Flutter for Stripe Identity"

### Tertiary (LOW confidence — flagged for validation)
- Exact list of free-email-provider domains for jobs employer-domain check is judgment-based — LOW confidence on the canonical denylist; recommend planner pick a small initial list (gmail/yahoo/hotmail/outlook/aol/icloud/proton + .gov is OK) and let admin extend it.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The 2026-04-18 audit drove CONTEXT.md decisions for items that have since been shipped (SavedSeller, archive, video MIMEs, counter-offer modal). [ASSUMED] — based on codebase grep finding shipped code that CONTEXT.md describes as missing | Summary, Pitfalls #3 | Planner re-builds shipped modules and breaks existing tests |
| A2 | "Targeted sellers" in REQ-three-day-exclusivity means category-matched sellers, not buyer-curated allowlist. [ASSUMED] — REQUIREMENTS.md line 29 says "targeted sellers see post first" without defining target mechanism | Phase Requirements table, Targeted-seller code example | If buyer-curated, schema needs `targeted_seller_ids` JSON column + buyer UI to add sellers — significantly bigger work |
| A3 | D-19's "new 50MB tier" is reconcilable with the shipped 100MB tier by leaving 100MB and updating CONTEXT.md note, OR tightening to 50MB. [ASSUMED] — needs user confirmation | Phase Requirements (REQ-video-mime-uploads), Common Pitfalls #3 | Wrong choice → overage cost on R2 (if 100MB is too generous) or seller frustration (if 50MB is too tight for 60s 1080p video) |
| A4 | Existing Haversine perf is acceptable; PostGIS is a Phase 6 nice-to-have, not a Phase 3 blocker. [ASSUMED] — D-01 says PostGIS but existing Haversine SQL works; no measured perf data either way | Architecture, Pitfalls #4, Recommendations | Wrong → DFW-launch users see slow seller feed; or right → unnecessary 1-2 day migration with regression risk |
| A5 | Counter-offer round cap (D-07 = 5) is a NEW constraint; existing chain has no cap and existing tests don't exercise depth >4. [ASSUMED] — based on offers.service.ts inspection, but didn't read full offers.test.ts | Pitfalls #6, Phase Requirements | Wrong → tests break on cap landing |
| A6 | EIN format is the IRS standard `\d{2}-\d{7}` (9 digits with hyphen). [ASSUMED — well-known IRS format, not project-specific] | Don't Hand-Roll, Phase Requirements (REQ-business-account-ein) | Likely correct; very low risk |
| A7 | OfferRevision (D-05/D-06) was authored without awareness that `Offer.parentOfferId` chain ships. [ASSUMED — based on the schema file showing the chain works and is referenced by `/offers/:id/counter`] | Alternatives Considered, Anti-Patterns | If user genuinely wants the new table, plan diverges significantly: drop existing endpoint, drop existing modal wiring, migrate test fixtures |

## Open Questions

1. **What is the target mechanism for 3-day exclusivity?**
   - What we know: `posts.public_after` set to `createdAt + 3d`; non-targeted sellers excluded via SQL filter.
   - What's unclear: How are "targeted" sellers identified? Three plausible interpretations: (a) sellers whose `categories` overlap the post's category — easy and shippable as schema-free service-layer code; (b) buyer manually picks sellers from a list during post creation — needs new schema column + new UI; (c) algorithm-based "best match" sellers from the same neighborhood — needs extended scoring logic.
   - Recommendation: Plan for interpretation (a) for MVP; capture (b) as Phase 6 enhancement. Confirm with user during plan-bounce review.

2. **PostGIS now or Phase 6?**
   - What we know: D-01 mandates PostGIS. Reality: Haversine SQL works at 5K posts/yr scale; no measured perf problem; PostGIS migration adds Supabase coupling, schema drift, and 1-2 days of extra work.
   - What's unclear: Whether the user's mental model is "PostGIS is required to make this work" (false) or "PostGIS is theoretically better and we should do it now" (debatable).
   - Recommendation: Planner re-prompts user via a brief plan-time question. Suggested default: KEEP Haversine for Phase 3, add a Phase 6 task "Migrate to PostGIS for index-backed perf at 100K-post scale".

3. **OfferRevision new table vs existing self-relation chain?**
   - What we know: D-05/D-06 spec a new table. Existing code uses `Offer.parentOfferId` chain with `/offers/:id/counter` endpoint and `mobile/.../counter_offer_modal.dart` (419 lines).
   - What's unclear: Did the user intend to replace the shipped chain, or did D-05/D-06 author from the audit without realizing the chain exists?
   - Recommendation: Strongly recommend KEEPING the existing chain. The work for D-07 round cap fits cleanly on top of the chain. If the user wants a separate table for "audit clarity" reasons, that's a Phase 6 refactor — not a Phase 3 ship-blocker.

4. **Job role-tier source: client-supplied or server-derived?**
   - What we know: REQ-jobs-lead-gen specifies $10–500 range tiered by role level (Entry / Mid / Specialized-Senior).
   - What's unclear: How is role tier determined? AI-classified from job description (Gemini)? Buyer-selected dropdown? Subcategory-mapped?
   - Recommendation: Buyer-selected dropdown for MVP (3 options); Gemini classification as Phase 6 polish.

5. **D-19 video size cap: 50MB (CONTEXT) or 100MB (current)?**
   - What we know: Code allows 100MB; D-19 says new 50MB tier.
   - Recommendation: Default to KEEP 100MB; the cap was set to handle 60s 1080p H.264 worst-case and 50MB is too tight.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All backend work | ✓ | (project requires 20+) | — |
| `npx vitest` | Test execution + audit suite | ✓ | 4.0.18 (verified package.json) | — |
| Stripe SDK | Identity API | ✓ | 20.3.1 (verified package.json) | — |
| Prisma | Schema migrations | ✓ | 7.4.0 (verified package.json) | — |
| Supabase Postgres | DB + optional PostGIS | ✓ assumed | (provider) | If PostGIS unavailable: keep Haversine SQL |
| Stripe test mode account | Identity testing | ✓ assumed | — | — |
| `flutter_stripe` | Mobile payments (NOT Identity) | ✓ | 11.3.0 (pubspec.yaml:56) | Identity uses url_launcher (already installed) |
| `url_launcher` | Identity hosted-flow redirect | ✓ | 6.3.1 (pubspec.yaml:42) | — |
| `reversemarket://` deep-link scheme | Stripe Connect + Identity return URLs | ✓ | (registered iOS Info.plist:59 + Android AndroidManifest.xml:34) | — |
| Stripe Dashboard webhook config | Enable identity.* event types | requires manual step | — | None — must configure |
| Google Maps API key (`GOOGLE_MAPS_API_KEY`) | Geocoding (already in code, optional in env) | partially | — | If absent: geocoding returns null gracefully (geocodeAddress already handles this) |

**Missing dependencies with no fallback:**
- Stripe Dashboard manual config: enabling `identity.verification_session.*` events on the existing webhook endpoint. Plan should include a runbook step.

**Missing dependencies with fallback:**
- `GOOGLE_MAPS_API_KEY` in dev: geocoding returns null (already-graceful). For Phase 3, env hardening should make it required in production via the same `validateProductionEnv()` block that locks down STRIPE_CONNECT_RETURN_URL.

## Recommendations for Planner

**Plan 1: Audit-gap reconciliation (Wave 1, parallel-safe)**
Single-file or tiny-batch fixes against actual delta:
- Update `MAX_OFFERS_PER_POST` from 10 to 25 in `offers.service.ts:21`. Run gitnexus_impact first.
- Update test fixtures in `tests/offers.test.ts` if any rely on the old cap.
- Verify mobile `My Posts` screen calls `POST /posts/:id/archive` (probably yes; just confirm).
- Verify mobile uploads use `category=post-videos` for post videos (probably yes; confirm).
- Add MIME tier env-driven note (cap stays 100MB; document the deviation from D-19).

**Plan 2: 3-day exclusivity targeted-seller carve-out (Wave 2, depends on user confirmation of Open Question #1)**
- Bring user the Open Question #1 interpretation choice (categories-based vs buyer-curated).
- Implement the chosen path in `posts.service.ts` getSellerFeed().
- Extend `tests/posts.test.ts` with carve-out coverage.

**Plan 3: PII gate (Wave 2, parallel with Plan 2)**
- Service-layer redaction in `posts.service.ts` toPostResponse() and `offers.service.ts` toOfferResponse().
- Helper: `isFundedRequester(viewerId, post)` checks transaction.escrowFundedAt for any associated Tx where buyer = post.buyerId AND seller = viewerId (or viewerId is the post owner).
- Mobile lock-icon UI on post detail screen (small change to `seller_post_detail_screen.dart`).

**Plan 4: Stripe Identity (Wave 3)**
- Backend: `sellers.service.createIdentitySession()` returns `session.url`.
- Backend: payments.webhook.ts adds identity event handlers (.verified, .requires_input, .canceled).
- Backend: env.ts adds optional `STRIPE_IDENTITY_RETURN_URL` (defaults to `reversemarket://seller/identity/complete`).
- Mobile: New `IdentityVerifyScreen` — single button "Verify ID" → POST creates session → `url_launcher` to URL → on resume, refetch profile.
- Stripe Dashboard runbook step: enable identity.verification_session.* on existing webhook endpoint.
- Test: Vitest unit test that simulates `identity.verification_session.verified` event creates a `VerificationRequest` row.

**Plan 5: EIN gate at registration (Wave 3)**
- `auth.schemas.ts` discriminated union: businessType=business → require EIN field.
- Auth service stores EIN in seller_profiles or a new column.
- Mobile registration form: business toggle reveals EIN input.

**Plan 6: Jobs lead-pricing engine (Wave 3)**
- `fees.ts` extension: `calculateJobLeadFee(roleTier: 'entry' | 'mid' | 'specialized')` returns 10/30/100 default.
- Schema: `posts.jobs_role_tier` enum column (or use existing `categorySpecific` JSONB).
- Employer email-domain check: tiny denylist in auth.service for accounts that register as job posters.
- New transaction creation path when offer accepted on job_milestone post → charge per-lead fee.

**Plan 7: Stripe Connect 3-bug fix + env hardening (Wave 1, **promotable to demo-priority**)**
- Bug A (env): set defaults in `.env.example`; add validation to `env.ts:validateProductionEnv()` rejecting localhost FRONTEND_URL.
- Bug B (lifecycle): add `WidgetsBindingObserver` to `stripe_onboard_screen.dart`; refetch on resumed.
- Bug C (route): change `profile_screen.dart:531` to `/seller/earnings`; either repurpose or remove `profile_screen.dart:538` Payment Methods entry.
- Mobile widget tests for Bugs B and C.

**Plan 8: Counter-offer round cap + endpoint verification (Wave 2)**
- Add depth check in `offersService.counterOffer()`. Reject if depth >= 4 (5 total).
- Verify mobile counter modal round-trips correctly.
- Extend `tests/offers.test.ts` with cap test.

**Plan 9: Vitest closeout audit suite (Wave 5, after all above land)**
- New file `backend/tests/audit/closeout-audit.test.ts`.
- Six SC blocks: SC1 (geosearch), SC2 (counter-offer), SC3 (audit gaps), SC4 (jobs), SC5 (Identity + EIN), SC6 (Stripe Connect).
- Each block has 1-3 assertions verifying the success criterion.
- Wire into CI via existing `npm run test:ci` (no config change required).

**What planner SHOULD NOT do:**
- Do not write a plan to "create SavedSeller module" — it's shipped.
- Do not write a plan to "add archive PostStatus" — it's shipped.
- Do not write a plan to "add video MIMEs to allowlist" — they're shipped.
- Do not write a plan that creates `OfferRevision` table without re-confirming with the user.
- Do not write a plan that mandates PostGIS migration without re-confirming necessity.
- Do not bundle multiple independent fixes into one big plan — Wave 1 is parallel-safe; let it parallelize.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified versions in package.json + pubspec.yaml + ctx7 docs
- Architecture: HIGH on what's shipped (codebase grep verified); MEDIUM on PostGIS-vs-Haversine optimal call (depends on perf data not yet measured)
- Pitfalls: HIGH — three of six pitfalls confirmed via direct codebase / Stripe docs / Flutter issue inspection; remaining three are inferences from code structure
- Stripe Identity: HIGH — context7 + Stripe docs + flutter-stripe repo issue all confirm hosted-redirect path is the only Flutter option
- Vitest 4: HIGH — direct config inspection
- PostGIS on Supabase: HIGH — direct Supabase docs

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (30 days for stable items); 2026-05-06 (7 days for `flutter_stripe` Identity status — re-check issue #1819 if it lingers)

## RESEARCH COMPLETE
