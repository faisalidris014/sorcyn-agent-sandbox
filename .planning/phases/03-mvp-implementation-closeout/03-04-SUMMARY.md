---
phase: 03-mvp-implementation-closeout
plan: "04"
subsystem: backend/offers
tags: [counter-offer, depth-cap, chain-walk, backend]
dependency_graph:
  requires: ["03-01"]
  provides: [MAX_COUNTER_DEPTH=5, counter-chain-walk]
  affects:
    - backend/src/modules/offers/offers.service.ts
    - backend/tests/offers.test.ts
tech_stack:
  added: []
  patterns: [chain-walk-via-parentOfferId, while-loop-bounded-by-MAX, conflictError-on-cap]
key_files:
  created: []
  modified:
    - backend/src/modules/offers/offers.service.ts
    - backend/tests/offers.test.ts
decisions:
  - "Use shipped Offer.parentOfferId self-relation chain (Addendum A-02 — no new OfferRevision table)"
  - "MAX_COUNTER_DEPTH = 5 means max chain length 5 (original + 4 counters)"
  - "Depth check walks via prisma.offer.findUnique on each parent until chain root or MAX reached — bounded by MAX so it can't run away even on corrupt data"
  - "Privacy test exercises shipped service-layer scoping (existing — not rebuilt)"
metrics:
  completed: "2026-04-30"
  scope: "2 files, 139 lines added"
  tests_added: 2  # round-cap + privacy
  tests_passing_after_change: "10/10 counter-offer tests, 2/2 new"
  commit: "bd4be08 feat(03-04): MAX_COUNTER_DEPTH=5 cap on parentOfferId chain"
---

# Phase 3 Plan 04: Counter-Offer 5-Round Cap Summary

**One-liner:** Caps the counter-offer chain at 5 rounds (original + 4 counters) by walking the `Offer.parentOfferId` chain inside `counterOffer()` and rejecting the 5th counter attempt with HTTP 409.

## What Was Done

### offers.service.ts — depth-walk in counterOffer()

Added constant:
```ts
const MAX_COUNTER_DEPTH = 5; // max chain length: original + 4 counters
```

Added depth check after the basic precondition checks (offer exists, buyer authority, status is `pending`, post is `active`), before the counter-offer transaction:

```ts
let chainLength = 1;
let cursorParentId = offer.parentOfferId ?? null;
while (cursorParentId && chainLength < MAX_COUNTER_DEPTH) {
  chainLength++;
  const parent = await prisma.offer.findUnique({
    where: { id: cursorParentId },
    select: { parentOfferId: true },
  });
  if (!parent) break;
  cursorParentId = parent.parentOfferId;
}
if (chainLength >= MAX_COUNTER_DEPTH) {
  throw new ConflictError(
    `Counter-offer chain has reached the maximum of ${MAX_COUNTER_DEPTH} rounds`,
  );
}
```

The loop bound `chainLength < MAX_COUNTER_DEPTH` keeps the walk O(MAX_COUNTER_DEPTH) at worst — it can't run away even on corrupt data.

### offers.test.ts — new describe block `MAX_COUNTER_DEPTH = 5 cap enforcement`

`beforeAll` builds a 5-element chain through the public API:
1. Buyer creates a fresh post
2. Seller submits original offer (depth 1)
3. Buyer counters via `POST /api/v1/offers/:id/counter` four times (depths 2..5) — each counter targets the most recent pending offer in the chain. All four counters return 201.

Two tests:
1. **5th counter rejection** — buyer attempts a 5th counter on the deepest offer; assert `statusCode === 409` and body contains `"maximum of 5 rounds"`.
2. **Counter chain privacy** — a third-party seller (separate from the chain participant) submits `GET /api/v1/offers/post/:postId` and the chain's offer ids must not appear in the response. Service-layer scoping returns 403 (post-owner-only access) — the chain ids are never exposed.

## Verification

```
$ cd backend && npx vitest run tests/offers.test.ts -t "MAX_COUNTER_DEPTH"
✓ tests/offers.test.ts (32 tests | 30 skipped) 3041ms
  ✓ should reject the 5th counter with 409 and "maximum of 5 rounds"
  ✓ counter chain is private — third-party seller GET on post does not see counter chain

$ cd backend && npx vitest run tests/offers.test.ts -t "counter"
Test Files: 1 passed (1)
Tests: 10 passed | 22 skipped (32)
```

All existing counter-offer tests continue to pass — the depth-walk does not regress baseline behavior.

## Self-Check: PASSED

> Note: This plan was authored inline by the orchestrator. The original `gsd-executor` subagent
> spawn for 03-04 was denied Bash permission by the harness (intermittent — 03-03 succeeded
> through the same allowlist) and bailed without committing any work. The implementation here
> is the orchestrator's own execution against the plan's `must_haves` and the codebase. Both
> tests were run and verified green before commit.
