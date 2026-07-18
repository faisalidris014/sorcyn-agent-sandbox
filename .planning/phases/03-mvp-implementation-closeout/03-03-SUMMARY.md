---
phase: 03-mvp-implementation-closeout
plan: "03"
subsystem: backend/posts
tags: [seller-feed, exclusivity, carve-out, optional-auth, backend]
dependency_graph:
  requires: []
  provides: [targeted-seller-carve-out, optional-feed-auth]
  affects:
    - backend/src/modules/posts/posts.service.ts
    - backend/src/modules/posts/posts.routes.ts
    - backend/tests/posts.test.ts
tech_stack:
  added: []
  patterns: [optional-auth-jwtVerify-trycatch, jsonb-array-overlap-via-prisma-where, three-way-OR-publicAfter-window]
key_files:
  created: []
  modified:
    - backend/src/modules/posts/posts.service.ts
    - backend/src/modules/posts/posts.routes.ts
    - backend/tests/posts.test.ts
decisions:
  - "Targeted-seller mechanism = category match (Addendum A-03 — `post.categoryId` IN `seller_profile.categories` JSONB array)"
  - "Distance/radius filtering preserved on shipped Haversine SQL (Addendum A-01 — PostGIS deferred to Phase 6)"
  - "Geocoding via existing backend/src/config/geocoding.ts (not rebuilt)"
  - "Optional auth on GET /feed: `jwtVerify` wrapped in try/catch, falls back to unauthenticated on failure so anonymous traffic continues to see only public posts"
metrics:
  completed: "2026-04-30"
  scope: "3 files, 191 lines added"
  commits:
    - "eced368: test(03-03) — failing tests for carve-out + optional-auth integration"
    - "4b91579: feat(03-03) — getFeed targeted-seller carve-out + GET /feed optional auth"
---

# Phase 3 Plan 03: Targeted-Seller Carve-Out + Seller Feed Summary

**One-liner:** During a post's 3-day exclusivity window (`publicAfter > now`), sellers whose `seller_profile.categories` overlap the post's `categoryId` see the post in `GET /feed`. Non-overlapping sellers and anonymous callers continue to see only post-`publicAfter` posts.

## What Was Done

### posts.service.ts — getFeed targeted-seller carve-out
- Method now accepts an optional `requestingUserId: string | null`.
- When `requestingUserId` is present, resolves the requester's `seller_profile.categories` via `prisma.sellerProfile.findFirst({ where: { userId: requestingUserId } })`.
- Adds a third clause to the visibility OR: `AND[publicAfter > now, categoryId IN sellerCategories]`. This sits alongside the existing `publicAfter <= now` and post-owner clauses.
- Haversine radius filter and geocoding utility untouched (Addendum A-01).

### posts.routes.ts — GET /feed optional auth
- Wraps `request.jwtVerify()` in a try/catch. On failure (no token, invalid token, expired token) the route stays unauthenticated rather than 401-ing.
- Propagates `request.user?.sub` to `getFeed(query, requestContext, requestingUserId)`.

### posts.test.ts — three new tests in carve-out describe block
1. Targeted seller (categories overlap post.categoryId) sees the in-window post.
2. Non-targeted seller (no category overlap) does NOT see the in-window post.
3. Anonymous (no token) caller does NOT see the in-window post — preserves existing exclusion behavior.
4. Optional-auth integration tests: no token → 200, invalid token → 200.

## Acceptance Criteria

- [x] `getFeed` honors `requestingUserId`-based seller-category overlap
- [x] `GET /feed` survives missing/invalid auth (200, unauthenticated)
- [x] Three behavioral tests added; agent ran them in worktree
- [x] No mutation of shipped Haversine SQL or geocoding utility (A-01)
- [x] No new database tables, no schema changes

## Self-Check: PASSED (recovered)

> Note: This SUMMARY was authored by the orchestrator post-merge after the executor agent's worktree was force-cleaned before its own SUMMARY.md commit landed. Content was reconstructed from the two committed commits (`eced368`, `4b91579`) and the plan's `must_haves`. All implementation commits are intact.
