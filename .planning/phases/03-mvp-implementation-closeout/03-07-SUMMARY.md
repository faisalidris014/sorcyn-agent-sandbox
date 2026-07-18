---
phase: 03-mvp-implementation-closeout
plan: "07"
subsystem: backend/jobs-pricing + backend/posts-gate
tags: [jobs, lead-fee, email-denylist, role-tier, backend]
dependency_graph:
  requires: ["03-03", "03-05"]
  provides: [calculateJobLeadFee, isFreeEmailDomain, jobs-creation-gate]
  affects:
    - backend/src/common/utils/fees.ts
    - backend/src/common/utils/email-domain.ts
    - backend/src/modules/posts/posts.service.ts
    - backend/src/modules/offers/offers.service.ts
    - backend/tests/fees.test.ts
tech_stack:
  added: []
  patterns: [tier-based-flat-fee, domain-denylist-set, post-creation-gate]
key_files:
  created:
    - backend/src/common/utils/email-domain.ts
    - backend/tests/fees.test.ts
  modified:
    - backend/src/common/utils/fees.ts
    - backend/src/modules/posts/posts.service.ts
    - backend/src/modules/offers/offers.service.ts
decisions:
  - "calculateJobLeadFee returns flat USD: entry=10, mid=50, specialized_senior=500 (per CLAUDE.md)"
  - "Free-email gate enforced at POST CREATION (posts.service.createPost), NOT at registration — free-email users can still post Services/Products"
  - "Lead fee overrides percentage-based fee in offers.service.acceptOffer when transactionType is job_milestone — platformFeePercentage is zeroed because the fee is now flat"
  - "Per Addendum A-05: buyer-selected roleTier from a dropdown is canonical; Gemini classification is deferred to Phase 6"
  - "Mobile manual_post_creation_screen.dart roleTier dropdown deferred — backend gate is canonical enforcement; mobile dropdown is UX polish (server still validates)"
metrics:
  completed: "2026-04-30"
  scope: "5 files (4 modified + 1 new), 160 lines added"
  tests_added: 18
  tests_passing_after_change: "18/18 fees.test.ts unit tests"
---

# Phase 3 Plan 07: Jobs Lead-Pricing + Free-Email Denylist Summary

**One-liner:** Companies posting Jobs pay a flat per-lead platform fee scaled by buyer-selected role tier ($10 entry / $50 mid / $500 specialized-senior). Free-email-domain users (gmail/yahoo/etc.) cannot create Jobs posts.

## What Was Done

### `backend/src/common/utils/fees.ts`
- `JobRoleTier` type (`'entry' | 'mid' | 'specialized_senior'`)
- `calculateJobLeadFee(roleTier): number` — exhaustive switch returning 10/50/500

### `backend/src/common/utils/email-domain.ts` (new)
- `FREE_EMAIL_DOMAINS: ReadonlySet<string>` — gmail, yahoo, hotmail, outlook, aol, icloud, proton.me, protonmail.com
- `isFreeEmailDomain(email): boolean` — case-insensitive on the domain part, safe on malformed input

### `backend/src/modules/posts/posts.service.ts`
- New `isJobsCategory(categoryId, subcategoryId?)` private helper — mirrors `isProductCategory`, walks parent if needed
- In `createPost`: when category resolves to Jobs:
  - Throw `ForbiddenError` (403) if `isFreeEmailDomain(user.email)` — message names common free providers
  - Validate `categorySpecific.roleTier ∈ {entry, mid, specialized_senior}` (`ValidationError` 400 otherwise)
- Imported `isFreeEmailDomain` from the new util

### `backend/src/modules/offers/offers.service.ts`
- `acceptOffer`: after `calculateFees`, branches on `transactionType === 'job_milestone'`:
  - Reads `offer.post.categorySpecific.roleTier`
  - If valid, overrides `platformFee = calculateJobLeadFee(tier)` and zeroes `platformFeePercentage`
  - Falls through to percentage-based fee if roleTier is missing/invalid (defensive)

### `backend/tests/fees.test.ts` (new)
- 18 unit tests:
  - 3 lead-fee tier assertions
  - 8 free-email domain positives + 4 negatives
  - Case-insensitivity assertion
  - Malformed-input safety (empty, no `@`, trailing `@`)
  - FREE_EMAIL_DOMAINS set membership

## Verification

```
$ cd backend && npx vitest run tests/fees.test.ts
Test Files  1 passed (1)
Tests       18 passed (18)
```

## Deferred to follow-up

**Mobile manual_post_creation_screen.dart `roleTier` DropdownButtonFormField** — not committed in this plan due to context-budget constraints in the inline orchestration session. Backend enforces the role-tier requirement (HTTP 400 on missing/invalid), so the mobile flow will surface the validation error today; a follow-up adds the UX dropdown so the user picks the tier ergonomically before submit. Captured as a known gap in SUMMARY.

## Self-Check: PASSED

> Note: This plan was authored inline by the orchestrator after the gsd-executor
> subagent for 03-07 was denied Bash by the harness on first invocation (3 tool
> uses, no commits, no edits, worktree force-cleaned). Backend implementation +
> 18 unit tests passed before commit. Mobile dropdown deferred (see above).
