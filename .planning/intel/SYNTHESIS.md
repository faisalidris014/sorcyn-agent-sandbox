# Synthesis Summary

**Mode:** new
**Generated:** 2026-04-27
**Source classifications:** /Users/faisalidris/ReverseMarketplace/.planning/intel/classifications/ (32 docs)

This is the entry point for `gsd-roadmapper`. Per-type intel files are listed at the bottom.

---

## Document Inventory

**Total docs synthesized:** 32

| Type | Count | Notes |
|---|---|---|
| ADR (locked) | 1 | docs/decisions.md — aggregated decision log spanning 14 build sessions |
| PRD | 1 | ReverseMktplPRD.md (v2.1, MVP, 14,724 lines, Last Updated Feb 12, 2026, Target Q3 2026) |
| SPEC | 2 | docs/api.md (REST API reference); docs/database.md (Prisma schema spec) |
| DOC | 28 | Build logs, architecture docs, setup guides, audit report, 8 Granola meeting transcripts, AGENTS.md (GitNexus), CLAUDE.md, FCM/Deployment/Testing/API-Testing guides, Prisma 7 patterns, FRONTEND_RESTYLING_PLAN, 7 BATCH_*_PLAN files, SCREEN_HIERARCHY |

---

## Decisions Locked

**Total locked decisions extracted:** 73 (from a single ADR file aggregating all sessions)

**Source path:** docs/decisions.md (locked: true)

Decision IDs are organized in intel/decisions.md by topic:
- Framework & Runtime (3): Fastify, ESM, Node 20+
- Database & ORM (6): Prisma 7 driver adapter, Postgres :5433, UUID PKs, soft deletes, JSONB, FTS via tsvector
- Storage (1): Cloudflare R2
- AI (4): Gemini Flash-Lite MVP, 20 req/hr, slug-based output, Zod validation
- Validation & Errors (3): Zod 4, RFC 7807, request-id tracing
- Auth (6): JWT access+refresh, rotation+reuse detection, Redis blacklist, timing-safe login, lockout, bcrypt 12
- Authz & Admin (4): isAdmin boolean, plugin-level hooks, no admin-on-admin actions, audit logs
- Account Model (5): single account toggle, public/private separation, soft-delete email prefix, auto-create seller profile, profileStrength score, sellerId resolution
- Verification (3): badge-based (no gatekeeping), VerificationRequest model, tier recalc
- Posts (6): edit-before-offers, max 10 active, single +3-day extension, repost-as-copy, optional auth detail, route ordering
- Offers (4): max 25 per post, atomic acceptance, in-memory Best Match, 24h withdraw cooldown
- Fees & Payments (8): Stripe Connect Standard, Separate Charges + Transfers, tiered fee structure, fee calc pure utility, Stripe gate on accept, dev bypass, lazy SDK init, webhook raw body plugin, graceful Stripe failure
- Transactions & Escrow (5): 7-day auto-release, max 2 change requests, status transitions by type, BullMQ sweep pattern, release-before-status-update, releaseEscrow reason param
- Messaging & Real-time (8): Socket.IO over WebSocket, JWT WS auth, Redis presence, hybrid realtime+polling, dual REST+Socket delivery, 50/hr msg rate, external payment detection, conv auto-create, stream events, socket auto-lifecycle
- Reviews (3): interactive transaction, day-73 auto-review, BullMQ jobId dedup
- Notifications (4): BullMQ async, internal-only API, graceful stubs, FCM invalid-token cleanup
- Frontend Flutter (12): Riverpod, GoRouter+auth-guards, Dio singleton, compile-time env, secure storage, Material 3 purple, feature-first structure, StatefulShellRoute, mode toggle persisted, mode-aware nav, client fee preview, url_launcher Stripe, i18n flutter_localizations, 10 languages, Firebase graceful init, push auth lifecycle, deep linking
- Observability & Ops (3): Sentry lazy init, fastify/compress, Prometheus
- Build & CI/CD (3): Docker multi-stage, GitHub Actions 3-job, bash+curl test scripts
- Pre-Build Product (4): DFW-only MVP, local products free, before/after photos required, milestone payments

---

## Requirements Extracted

**Total functional requirements:** 31 (REQ-* IDs in intel/requirements.md)
**Total non-functional requirements:** 9 (NFR-* IDs)

**Functional REQ IDs:**
- REQ-vision-reverse-marketplace, REQ-mvp-three-categories
- REQ-user-registration, REQ-account-toggle, REQ-account-deletion
- REQ-create-post-manual, REQ-create-post-ai-assisted, REQ-post-extension-and-repost, REQ-max-active-posts, REQ-three-day-exclusivity
- REQ-seller-profile, REQ-seller-feed, REQ-submit-offer, REQ-max-offers-per-post, REQ-offer-visibility-private, REQ-counter-offer
- REQ-stripe-escrow, REQ-fee-structure-tiered, REQ-stripe-onboarding, REQ-escrow-release, REQ-milestone-payments, REQ-max-2-change-requests
- REQ-before-after-photos, REQ-transaction-status-tracking
- REQ-rating-and-review
- REQ-in-app-messaging
- REQ-multi-channel-notifications
- REQ-mvp-search
- REQ-verification-badges, REQ-business-account-ein
- REQ-dispute-mvp
- REQ-admin-dashboard
- REQ-jobs-lead-gen
- REQ-success-metrics

**NFR IDs:**
- NFR-performance, NFR-throughput, NFR-data-growth, NFR-uptime, NFR-disaster-recovery, NFR-error-handling, NFR-accessibility, NFR-test-coverage, NFR-cicd, NFR-monitoring, NFR-security

---

## Constraints (SPEC)

**Total constraint entries:** 24 (CON-* IDs in intel/constraints.md)

| Type | Count |
|---|---|
| api-contract | 9 (base URL, request-id, health, auth endpoints, rate limits, response envelope, endpoint modules, saved-searches cap, uploads presigned) |
| protocol | 2 (Socket.IO events, Redis keys) |
| schema | 13 (ORM conventions, models, enums, User, SellerProfile, Post, Offer uniqueness, Transaction, Review uniqueness, AuditLog immutable, FTS, Prisma JSON null, Zod record two-args, Stripe fields, seed data, no-url-in-schema, prisma config, transaction forms) |
| nfr | 3 (response times, uptime, security baseline) |

---

## Context Topics (DOC)

**Total topic sections in intel/context.md:** 13

- Build Status & Sessions
- Backend Audit Snapshot (Apr 18, 2026)
- Architecture Overview
- Mobile UI — Screen Hierarchy
- In-Flight Mobile Restyling Plans (CANDIDATE PHASES — 7 batch plans + master plan)
- Documentation Index
- Granola Meeting Transcripts (LOWEST PRECEDENCE — 8 transcripts captured)
- Setup, Testing, Deployment
- Code Intelligence (GitNexus)
- Color Scheme & Design Tokens
- Pricing & Cost Notes
- Open Questions Tracked in PRD §19

---

## Conflict Summary

| Bucket | Count |
|---|---|
| BLOCKERS (unresolved) | 0 |
| WARNINGS (competing variants) | 0 |
| INFO (auto-resolved) | 12 |

**Cycle detection:** clean (no cycles, max depth 2).
**LOCKED-vs-LOCKED contradictions:** none (single ADR file in ingest set).
**UNKNOWN-confidence-low docs:** none.

**Notable auto-resolutions** (full detail in INGEST-CONFLICTS.md):
1. ADR > PRD on Stripe escrow flow (Separate Charges + Transfers, not Destination Charges)
2. ADR > PRD on auth method (custom JWT, not Supabase Auth)
3. ADR > PRD on account types (`buyer/seller/both`, not `Classic/Business/Both`)
4. ADR > PRD on search backend (PostgreSQL FTS for MVP, ES for Phase 2; not Meilisearch)
5. ADR > PRD on auto-review timing (day 73, not 60-day window)
6. ADR > PRD on default post duration (7 days, not 3 days)
7. SPEC vs ADR on max offers per post — ADR wins (25); code drift to 10 noted as implementation reconciliation work
8. ADR > DOC on message retention — CLAUDE.md (permanent) wins over PRD (90 days)
9. 8 Granola transcripts integrated at lowest precedence; superseded thinking flagged
10. BACKEND_AUDIT_REPORT gaps captured in context.md (not conflicts — open implementation work)
11. 7 BATCH plans captured as candidate phases for the roadmapper

---

## Pointers

- **Conflict report:** /Users/faisalidris/ReverseMarketplace/.planning/INGEST-CONFLICTS.md
- **Per-type intel files:**
  - /Users/faisalidris/ReverseMarketplace/.planning/intel/decisions.md (ADR)
  - /Users/faisalidris/ReverseMarketplace/.planning/intel/requirements.md (PRD)
  - /Users/faisalidris/ReverseMarketplace/.planning/intel/constraints.md (SPEC)
  - /Users/faisalidris/ReverseMarketplace/.planning/intel/context.md (DOC)
- **Source classifications:** /Users/faisalidris/ReverseMarketplace/.planning/intel/classifications/ (32 *.json files)

---

## Notes for Downstream Roadmapper

1. This is a **mature project** — 15 build sessions complete, 75.6% backend audit health, 40/51 mobile screens built. The roadmap should not re-plan the MVP from scratch; it should reflect the current state.
2. **In-flight work** is concentrated in mobile UI restyling (Batches 2-8 of FRONTEND_RESTYLING_PLAN) — these are natural near-term phases.
3. **Open implementation gaps** identified in the audit are not conflicts but candidate Phase 1.5 / Phase 2 items: radius-based search, counter-offer flow, lead-based jobs pricing, follow/favorite sellers, video upload MIME types, address/contact blocking, etc.
4. **Promotions and subscription tiers** are intentionally deferred per CLAUDE.md and Session 2 transcript.
5. **Phase boundaries** per PRD §7: Phase 1 MVP (Months 1-3, DFW Q3 2026) → Phase 2 Enhanced (Months 4-6) → Phase 3 Full Marketplace (Months 7-12) → Phase 4 Scale (Months 13-18).
