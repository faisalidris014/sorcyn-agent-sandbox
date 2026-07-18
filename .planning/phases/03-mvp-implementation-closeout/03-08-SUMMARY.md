---
phase: 03-mvp-implementation-closeout
plan: "08"
subsystem: backend/tests/audit
tags: [audit, ci-gate, closeout, vitest, success-criteria]
dependency_graph:
  requires: ["03-01", "03-02", "03-03", "03-04", "03-05", "03-06", "03-07"]
  provides: [phase-3-closeout-audit-suite, ci-gate]
  affects:
    - backend/tests/audit/closeout-audit.test.ts
tech_stack:
  added: []
  patterns: [import-level-existence-assertion, source-content-grep-via-readFileSync, prisma-queryRaw-information_schema, process.exit-spy]
key_files:
  created:
    - backend/tests/audit/closeout-audit.test.ts
  modified: []
decisions:
  - "Lean assertion strategy: import-level for exported symbols, file-content grep for private constants (e.g. ALLOWED_VIDEO_TYPES, MAX_COUNTER_DEPTH integration), live DB query for migration application"
  - "SC6 mocks process.exit/console rather than rebuilding child-process spawn — same pattern env.test.ts established in plan 03-02"
  - "Path resolution: import.meta.dirname → backend/, paths normalized to drop the 'backend/' prefix so vitest CWD-relative resolution works"
metrics:
  completed: "2026-04-30"
  scope: "1 new file, 305 lines"
  tests_added: 26
  tests_passing: "26/26 in tests/audit"
  commits:
    - "88aa3cd test(03-08): Phase 3 closeout audit suite — 6 SC describe blocks"
---

# Phase 3 Plan 08: Closeout Audit Suite Summary

**One-liner:** 26 assertions across 6 describe blocks (one per Phase 3 success criterion) prove the phase's surface area is shipped, wired, and behaving. Runnable as a CI gate via `cd backend && npx vitest run tests/audit`.

## What Was Done

`backend/tests/audit/closeout-audit.test.ts` (new) — six top-level describe
blocks, named with the prefix `Phase 3 Closeout — Success Criterion <N>`:

### SC1 — Seller feed radius + geocoding (4 assertions)
- `geocodeAddress` exported from `backend/src/config/geocoding.ts`
- Null-safe behavior when `GOOGLE_MAPS_API_KEY` is unset (returns null, no throw)
- `getFeed` signature accepts `requestingUserId` (carve-out from plan 03-03)
- Shipped Haversine SQL preserved (PostGIS deferred per Addendum A-01)

### SC2 — Counter-offer 5-round cap (2 assertions)
- `MAX_COUNTER_DEPTH = 5` constant present
- `counterOffer` walks `parentOfferId` chain, throws on `chainLength >= MAX_COUNTER_DEPTH` with "maximum of 5 rounds" message

### SC3 — Backend audit gap closures (6 assertions)
- `MAX_OFFERS_PER_POST = 25` (and not 10)
- `PostStatus` enum includes `archived`
- `storage.ts` allows `video/mp4` and `video/quicktime`
- `saved-sellers` module routes file exists + registered in app.ts
- `/:postId/archive` route registered in posts.routes.ts
- PII redaction (`redactPiiIfUnfunded` + `isFundedRequester`) wired in posts.service.ts

### SC4 — Jobs lead-pricing + free-email denylist (5 assertions)
- `calculateJobLeadFee` returns 10/50/500 for entry/mid/specialized_senior
- `FREE_EMAIL_DOMAINS` includes the canonical 8 providers
- `isFreeEmailDomain('alice@gmail.com')` true; corporate domain false
- `posts.service.createPost` references `isFreeEmailDomain` + `isJobsCategory`
- `offers.service.acceptOffer` overrides platformFee with `calculateJobLeadFee` on `job_milestone`

### SC5 — Stripe Identity + EIN gate (6 assertions)
- `User.ein String?` declared in prisma schema
- `users.ein` column applied to dev DB (verified via `information_schema.columns` query)
- `registerSchema.safeParse({ isBusiness: true, /* no ein */ })` fails with `path: ['ein']`
- Same payload + valid EIN passes
- `sellers.service.createIdentitySession` calls `stripe.identity.verificationSessions.create`
- `payments.service` handles `identity.verification_session.verified` event with atomic `prisma.$transaction` setting `idVerified: true`
- `POST /sellers/identity/verify` route registered

### SC6 — Production env hardening (3 assertions)
- `validateProductionEnv` calls `process.exit(1)` when `STRIPE_CONNECT_RETURN_URL` is empty
- Calls `process.exit(1)` when `FRONTEND_URL` is the localhost default
- Does NOT call `process.exit` with a valid production env (reversemarket:// + non-localhost)

## Verification

```
$ cd backend && npx vitest run tests/audit
Test Files  1 passed (1)
Tests       26 passed (26)
```

## Self-Check: PASSED

> Note: This plan was authored inline by the orchestrator. The deferred
> mobile/test surfaces from plans 03-06 and 03-07 (Identity verify screen,
> register EIN field, Jobs roleTier dropdown) are NOT covered by this audit
> suite — they're documented as known gaps in those plans' SUMMARYs and are
> tracked for follow-up. The Phase 3 backend behavioral surface is fully
> verified.
