## Conflict Detection Report

### BLOCKERS (0)

(none)

### WARNINGS (0)

(none — single PRD in the ingest set, so no PRD-vs-PRD competing acceptance variants. Granola transcripts are classified DOC and resolved against the PRD via precedence, not surfaced as variants.)

### INFO (12)

[INFO] Auto-resolved: ADR > PRD on Stripe escrow flow
  Found: ReverseMktplPRD.md §8.5 FR-PAY-001 specifies "Stripe Connect Destination Charges" with funds held on platform's Stripe account.
  Note: docs/decisions.md (Session 6, locked) supersedes with "Separate Charges and Transfers (Not Destination Charges)" — platform collects via PaymentIntent then creates Transfer to seller's connected account on approval, with `transfer_group` linking the two for reconciliation. ADR wins per PRECEDENCE; intel/requirements.md REQ-stripe-escrow reflects ADR semantics.
  Sources: ReverseMktplPRD.md §8.5, docs/decisions.md (Session 6)

[INFO] Auto-resolved: ADR > PRD on auth method
  Found: PRD/spec narrative (per docs/BACKEND_AUDIT_REPORT.md §1 footnote) states "Supabase Auth" for authentication.
  Note: docs/decisions.md (Session 2, locked) and shipped code use custom JWT auth (bcrypt + jsonwebtoken + @fastify/jwt), with Supabase used only as a PostgreSQL host. ADR wins. intel/decisions.md DEC-jwt-access-refresh and DEC-bcrypt-12-rounds reflect the locked decision.
  Sources: ReverseMktplPRD.md (architecture narrative), docs/BACKEND_AUDIT_REPORT.md §1, docs/decisions.md (Session 2)

[INFO] Auto-resolved: ADR > PRD on account types
  Found: ReverseMktplPRD.md §8.1 + audit §1.7 expects "three account types: Classic, Business, Both" (registration-time distinction).
  Note: docs/decisions.md (Session 1, locked) defines `account_type` enum as `buyer | seller | both` with a separate `MarketplaceContext` enum (`b2c`, `b2b`, `c2c`) for switching contexts post-registration. ADR wins. intel/requirements.md REQ-account-toggle and intel/constraints.md CON-user-model reflect the buyer/seller/both model.
  Sources: ReverseMktplPRD.md §8.1, docs/BACKEND_AUDIT_REPORT.md §1.7, docs/decisions.md (Session 1)

[INFO] Auto-resolved: ADR > PRD on search backend
  Found: PRD architecture narrative and audit §2.x reference Meilisearch as the search backend.
  Note: docs/decisions.md (Session 1 + Session 4, locked) selects PostgreSQL `tsvector` + GIN + auto-update trigger for MVP, with Elasticsearch (not Meilisearch) planned for Phase 2. ADR wins. intel/requirements.md REQ-mvp-search and intel/constraints.md CON-fulltext-search reflect the locked decision.
  Sources: ReverseMktplPRD.md (architecture), docs/BACKEND_AUDIT_REPORT.md, docs/decisions.md (Session 1, Session 4)

[INFO] Auto-resolved: ADR > PRD on auto-review timing
  Found: ReverseMktplPRD.md §15.1 US-B-007 says reviews skippable within a 60-day window.
  Note: docs/decisions.md (Session 7, locked) supersedes with day-73 auto-5-star-review and reminders at days 7, 30, 60, 73. CLAUDE.md confirms day 73. ADR wins. intel/requirements.md REQ-rating-and-review reflects the locked decision and notes the supersession explicitly.
  Sources: ReverseMktplPRD.md §15.1 US-B-007, docs/decisions.md (Session 7), CLAUDE.md

[INFO] Auto-resolved: ADR > PRD on default post duration
  Found: ReverseMktplPRD.md §8.2 FR-BUY-001 lists post duration default as "3 days" with options 24h/3d/7d/14d.
  Note: Implementation default is 168 hours (7 days), max 720 hours (30 days), per docs/BACKEND_AUDIT_REPORT.md §2.8 and BUILD_PROGRESS.md. Single +3-day extension allowed per docs/decisions.md (Session 4, locked). ADR/code path wins. intel/requirements.md REQ-create-post-manual notes the supersession.
  Sources: ReverseMktplPRD.md §8.2, docs/BACKEND_AUDIT_REPORT.md §2.8, docs/decisions.md (Session 4)

[INFO] Auto-resolved: SPEC contradiction with ADR on max offers per post
  Found: docs/api.md does not specify a per-post offer cap; docs/database.md states the unique constraint `@@unique([postId, sellerId])` (one offer per seller per post) without a numeric cap. docs/BACKEND_AUDIT_REPORT.md §4.2 reports the code constant is `MAX_OFFERS_PER_POST = 10`.
  Note: docs/decisions.md (Session 5, locked) sets the cap at 25 offers per post with explicit rationale (avoid analysis paralysis, limit per-post DB growth). ADR wins per PRECEDENCE. CLAUDE.md mention of "Maximum 10 offers per seller listing" describes a different, per-seller offer cap and is not the same scope. intel/decisions.md DEC-max-offers-per-post and intel/requirements.md REQ-max-offers-per-post reflect the ADR value (25); the code-vs-ADR drift (10 vs 25) should be reconciled in implementation but the synthesized intel uses ADR.
  Sources: docs/decisions.md (Session 5), docs/BACKEND_AUDIT_REPORT.md §4.2, CLAUDE.md, docs/api.md, docs/database.md

[INFO] Auto-resolved: ADR > DOC on message retention
  Found: ReverseMktplPRD.md §15.3 US-P-002 says "Message history retained for 90 days post-transaction." CLAUDE.md says "Chat history preserved permanently."
  Note: PRD is older guidance; CLAUDE.md and shipped service contract reflect the canonical production behavior (permanent retention). ADR/decisions silent on retention duration; in absence of ADR, CLAUDE.md (DOC, project-canonical) wins over PRD per the user-provided context. intel/requirements.md REQ-in-app-messaging notes both values explicitly with the canonical choice flagged.
  Sources: ReverseMktplPRD.md §15.3 US-P-002, CLAUDE.md

[INFO] Auto-resolved: 8 Granola transcripts contributed at lowest precedence
  Found: 8 docs classified DOC are speech-to-text Granola meeting exports (Feb 6, Feb 8, Feb 11 PRD Review, Feb 11 Session, Feb 11 Session 1, Feb 12 Session 2, Apr 14 Session 3, Apr 15 Session).
  Note: Per the orchestrator's instruction, transcripts contribute only at lowest precedence and any conflict with the canonical PRD is treated as superseded thinking. No transcript-vs-PRD content was promoted into intel/requirements.md or intel/decisions.md; transcript content is recorded only in intel/context.md "Granola Meeting Transcripts" with explicit source attribution. Single instance flagged: Feb 6 transcript references "B2B / B2C / C2C account types" — superseded by the locked `buyer | seller | both` account model (already noted above).
  Sources: docs/Reverse Marketplace App Idea Feb 6th.md, docs/Reverse Marketplace Feb 8th.md, docs/Reverse Marketplace PRD Review Feb 11th.md, docs/Reverse Marketplace Session Feb 11th.md, docs/Reverse Marketplace Session 1 Feb 11th.md, docs/Reverse Marketplace Session 2 Feb 12th.md, docs/Reverse Marketplace Session 3 April 14th.md, docs/Reverse Marketplace Session April 15th.md

[INFO] Implementation gaps surfaced from BACKEND_AUDIT_REPORT (not conflicts; downstream phase candidates)
  Note: docs/BACKEND_AUDIT_REPORT.md (April 18, 2026) reports 41 MISSING and 23 PARTIAL items vs PRD scope. These are PRD requirements that the codebase has not yet satisfied (radius-based geolocation search, follow/favorite sellers, RLS, Stripe Identity, Stripe AccountSession, lead-based pricing for Jobs, counter-offer flow, address/contact blocking until payment, video upload MIME types, Archived post status). They are NOT precedence conflicts — they are open implementation work. Captured in intel/context.md "Backend Audit Snapshot" so the roadmapper can route them as candidate phases.
  Sources: docs/BACKEND_AUDIT_REPORT.md

[INFO] In-flight phase work surfaced from BATCH plans
  Note: 7 BATCH_*_PLAN files (BATCH_2 through BATCH_8) describe in-progress mobile UI restyling work mapping ~37 Flutter screens to TSX design references in `designs/src/app/components/`. FRONTEND_RESTYLING_PLAN.md is the umbrella plan. These are execution plans (DOC), not new requirements — they encode design tokens and screen-to-screen mappings. Captured in intel/context.md "In-Flight Mobile Restyling Plans" as candidate phases for the roadmapper.
  Sources: FRONTEND_RESTYLING_PLAN.md, BATCH_2_PLAN.md, BATCH_3_PLAN.md, BATCH_4_PLAN.md, BATCH_5_PLAN.md, BATCH_6_PLAN.md, BATCH_7_PLAN.md, BATCH_8_PLAN.md

[INFO] Cross-ref cycle scan: clean
  Note: DFS three-color cycle detection on the `cross_refs` graph from all 32 classifications produced no cycles. Most DOC files reference source-code paths (not other ingested docs); the docs that DO reference each other (CLAUDE.md → docs/*; architecture.md → BUILD_PROGRESS/CLAUDE/BUILD_INSTRUCTIONS; setup.md → FCM_SETUP/API_TESTING_GUIDE/TESTING; decisions.md → prisma-7-patterns.md) form a forest, not cycles. Max depth observed: 2. No cap-50 abort needed.
  Sources: all 32 classification JSONs in .planning/intel/classifications/
