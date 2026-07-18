---
phase: 03-mvp-implementation-closeout
plan: "05"
subsystem: backend/posts + mobile/post-detail
tags: [pii, redaction, escrow-gating, lock-icon, backend, mobile]
dependency_graph:
  requires: ["03-03"]
  provides: [pii-gate, isFundedRequester, redactPiiIfUnfunded, mobile-lock-icon]
  affects:
    - backend/src/modules/posts/posts.service.ts
    - backend/tests/posts.test.ts
    - mobile/lib/features/posts/presentation/screens/post_detail_screen.dart
tech_stack:
  added: []
  patterns: [batched-funded-postId-set, optional-property-redaction-helper, lock-icon-with-subtext]
key_files:
  created: []
  modified:
    - backend/src/modules/posts/posts.service.ts
    - backend/tests/posts.test.ts
    - mobile/lib/features/posts/presentation/screens/post_detail_screen.dart
decisions:
  - "redactPiiIfUnfunded only strips locationAddress; locationCity/State/Zip remain visible (city/state aren't street-level PII)"
  - "searchPosts is a no-op for PII — its raw SQL SELECT excludes p.location_address from the response"
  - "offers.service.toOfferResponse is also a no-op — the embedded post field includes only id/title (no locationAddress)"
  - "getFeed batches the funded check: one prisma.transaction.findMany over all postIds in the page, then a Set lookup per post. O(N) postIds + O(1) lookup."
  - "Funded = escrowStatus IN ['held', 'released'] AND seller.userId === requestingUserId AND deletedAt is null"
metrics:
  completed: "2026-04-30"
  scope: "3 files, ~273 lines added"
  tests_added: 4
  tests_passing_after_change: "41/41 in posts.test.ts"
  commits:
    - "98e16d4 feat(03-05): PII gate — redactPiiIfUnfunded + mobile lock-icon"
---

# Phase 3 Plan 05: PII Gate (locationAddress redaction) Summary

**One-liner:** Sellers without a funded transaction (escrowStatus held|released) on a post see `locationAddress: null` in API responses; funded sellers and post owners see the full street address. Mobile post-detail shows a lock icon + microcopy when redacted.

## What Was Done

### Backend — posts.service.ts

Two new private helpers at the bottom of the class:

```ts
private async isFundedRequester(postId, postBuyerId, requestingUserId?): Promise<boolean>
private redactPiiIfUnfunded<T extends { locationAddress: string | null }>(post: T, funded: boolean): T
```

`isFundedRequester` returns true if requester is the post owner OR has any
transaction on the post with `escrowStatus: { in: ['held', 'released'] }` and
`seller.userId === requestingUserId`.

`redactPiiIfUnfunded` returns the post unchanged when `funded`, otherwise sets
`locationAddress: null`. Generic over T so it works with any post-shaped response.

Integration sites:

1. **`getPostById`** — `await isFundedRequester(...)` once, then `redactPiiIfUnfunded(stripBudgetForNonOwner(toPostResponse(post)), funded)` in the response shape. Single round-trip per call.

2. **`getFeed`** — batched: when `requestingUserId` is set and there are filtered posts, one `prisma.transaction.findMany` over all `postIds` in the page builds a `fundedPostIds: Set<string>`. Then per post: `funded = isOwner || fundedPostIds.has(post.id)` → `redactPiiIfUnfunded(...)`. O(1) lookup per post.

3. **`searchPosts`** — intentionally no-op. The raw `$queryRawUnsafe` SELECT explicitly excludes `p.location_address` (only city/state/zip are projected), so the response never contains the PII to redact.

`offers.service.ts` `toOfferResponse` is similarly safe — its embedded `post` field SELECTs only `{ id, title, status, ... }` and does not include `locationAddress`.

### Mobile — post_detail_screen.dart

`_InfoGrid` location row now branches:

```dart
if (post.locationAddress != null)
  _InfoItem(icon: Icons.location_on_outlined, label: 'Location', value: post.locationAddress!)
else if (post.locationCity != null && post.locationState != null)
  _InfoItem(
    icon: Icons.lock_outline,
    label: 'Location',
    value: '${city}, ${state} ${zip ?? ""}',
    subtext: 'Full address shared after payment',
  )
```

`_InfoItem` extended with optional `subtext: String?`. When present, the row renders an extra italic 11px `AppColors.greyMedium` line below the value.

### Backend — posts.test.ts

New describe block `PII redaction — locationAddress gating` (4 tests):

1. Non-funded seller GET `/posts/:id` → `locationAddress` is `null`, `locationCity`/`locationState` still present.
2. Funded seller (seeded transaction with `escrowStatus: 'held'`) GET `/posts/:id` → full `locationAddress`.
3. Post owner (buyer) GET own post → full `locationAddress`.
4. Non-funded seller GET `/feed` → if the test post appears in the result page, its `locationAddress` is `null` (batched redaction).

Test setup uses `prisma.post.update` to set `publicAfter` to a past date so the funded seller can read the post (otherwise the 3-day exclusivity check would block GET — that gate is tested separately in plan 03-03).

Scoped `afterAll` cleanup in the describe block deletes seeded transactions/offers/sellerProfiles/users so the parent `afterAll`'s `post.deleteMany` doesn't trip on the FK.

## Verification

```
$ cd backend && npx vitest run tests/posts.test.ts -t "PII"
Test Files  1 passed (1)
Tests       4 passed | 37 skipped (41)

$ cd backend && npx vitest run tests/posts.test.ts
Test Files  1 passed (1)
Tests       41 passed (41)
```

All existing posts tests continue to pass — no regressions in 03-03's carve-out tests.

## Self-Check: PASSED

> Note: This plan was authored inline by the orchestrator after the gsd-executor
> subagent for 03-05 was denied Bash by the harness. The agent had completed all
> file edits in its worktree but couldn't commit, run tests, or write a final
> SUMMARY commit. The orchestrator adopted the agent's helper design verbatim
> (`isFundedRequester`, `redactPiiIfUnfunded`, the mobile lock-icon shape), then
> rebuilt the integration on top of `f290b3a` (which already had Wave 2's 03-03
> getFeed signature change and 03-04 counter cap), wrote 4 focused tests, and
> verified them green before commit.
