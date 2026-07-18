---
phase: 03-mvp-implementation-closeout
plan: "01"
subsystem: backend/offers
tags: [offers, cap, audit-reconciliation, backend]
dependency_graph:
  requires: []
  provides: [MAX_OFFERS_PER_POST=25]
  affects: [backend/src/modules/offers/offers.service.ts, backend/tests/offers.test.ts]
tech_stack:
  added: []
  patterns: [constant-in-module-scope, behavioral-cap-test, createTestUser-helper]
key_files:
  created: []
  modified:
    - backend/src/modules/offers/offers.service.ts
    - backend/tests/offers.test.ts
decisions:
  - "Changed MAX_OFFERS_PER_POST from 10 to 25 to match ADR-locked product decision (Offer cap: Maximum 10 was audit drift; ADR-locked value is 25)"
  - "Added behavioral test using createTestUser loop to create 25 distinct sellers and verify 26th offer returns 409"
metrics:
  duration: "~20 minutes"
  completed: "2026-04-30"
---

# Phase 3 Plan 01: MAX_OFFERS_PER_POST Reconciliation Summary

**One-liner:** Reconciled `MAX_OFFERS_PER_POST` constant from audit-drift value of 10 to ADR-locked value of 25, closing the behavioral gap where buyers could not receive offers 11-25.

## What Was Done

### Constant Change

`backend/src/modules/offers/offers.service.ts` line 21:

- **Before:** `const MAX_OFFERS_PER_POST = 10;`
- **After:** `const MAX_OFFERS_PER_POST = 25;`

The inline comment at the guard site was also updated from "Max 10 offers per post" to "Max 25 offers per post". The error message thrown at the guard uses `${MAX_OFFERS_PER_POST}` interpolation, so it now reads "maximum of 25 offers" without any further changes.

### Test Added

`backend/tests/offers.test.ts` — new describe block `MAX_OFFERS_PER_POST cap enforcement`:

- Imports `createTestUser` and `authHeaders` from `./helpers.js`
- Creates a fresh post in `beforeAll`
- In the single test, loops 25 times: creates a distinct seller user via `createTestUser`, creates their seller profile, submits an offer, asserts 201
- Creates a 26th seller, submits, asserts `statusCode === 409` and response body contains `"maximum of 25 offers"`
- Test timeout set to 120,000ms to accommodate 26 sequential user registrations

## Verification

Test run: `npx vitest run tests/offers.test.ts` (executed from main backend with worktree source files applied)

```
Test Files  1 passed (1)
      Tests  30 passed (30)
   Duration  16.62s
```

New test output:
```
✓ should accept offers 1-25 and reject the 26th with 409  13921ms
```

The 26th offer triggered a 409 response (visible in server logs: `"res":{"statusCode":409}`).

## Files Modified

From `git diff --name-only`:

```
backend/src/modules/offers/offers.service.ts
backend/tests/offers.test.ts
```

Exactly 2 source files — no other files touched.

## Commits

| Hash | Message |
|------|---------|
| 38124fa | feat(03-01): bump MAX_OFFERS_PER_POST from 10 to 25 |

## Deviations from Plan

None — plan executed exactly as written. The constant was at line 21 as documented, the guard at lines 45-46 was already using the constant via string interpolation, and `createTestUser` + `authHeaders` were available in `backend/tests/helpers.ts` as expected.

**Note on test execution environment:** The worktree's backend directory has no `node_modules` (git worktrees share the object store but not the working-tree `node_modules` install). Tests were verified by temporarily applying the worktree's modified files to the main backend (which has `node_modules`), running vitest there, confirming all 30 tests pass, then restoring the main backend. The worktree's changes were committed independently and remain clean.

## Known Stubs

None. This plan is a pure constant change with a behavioral test — no data stubs or placeholder values.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. The cap change only affects the numeric threshold in an existing guard on `POST /api/v1/offers`. No new threat surface.

## Self-Check: PASSED

- `backend/src/modules/offers/offers.service.ts`: FOUND (modified, `MAX_OFFERS_PER_POST = 25` at line 21)
- `backend/tests/offers.test.ts`: FOUND (modified, contains `'maximum of 25 offers'` assertion)
- Commit `38124fa`: FOUND in git log
- Test run: 30/30 PASSED including new cap-enforcement test
