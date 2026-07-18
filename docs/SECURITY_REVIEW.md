# Sorcyn — Manual Security Review (Threat Model + Code-Level)

> Tracking issue: [#135](https://github.com/SorcynMarketplace/ReverseMarketplace/issues/135) — `[v1.1-E2-12]`
> Complements automated SCA/DAST in #32. This is the human-driven, code-level review.
> **Status:** Review complete — all HIGH/CRITICAL findings tracked (#255–#259). Sign-off pending remediation.
> **Reviewer:** Faisal (AI-assisted)
> **Date:** 2026-06-17
> **Scope:** Backend API (`backend/src`) at commit on `feat/135-security-review` (off `main`).

---

## 1. Threat Model Summary

### 1.1 Core flow under review

```
Buyer posts request (AI-assisted)
  → Sellers submit offers (≤25/post, ≤25 active/seller)
  → Buyer accepts one offer
  → Stripe Connect escrow funded (separate charge + transfer, transfer_group)
  → Seller completes work → uploads before/after photos
  → Buyer approves (or 7-day auto-release) → payout to seller (minus fees)
  → Review tied to before/after photos
```

### 1.2 Trust boundaries

| Boundary | Untrusted side | Trusted side | Primary controls |
|----------|----------------|--------------|------------------|
| Client → API | Flutter app / any HTTP client | Fastify API | JWT auth, Zod validation, rate limits, RFC7807 errors |
| API → Stripe | n/a | API + Stripe SDK | Server-side amounts, `transfer_group`, idempotency |
| Stripe → API (webhook) | Public internet (anyone can POST) | API webhook handler | Signature verification (`STRIPE_WEBHOOK_SECRET`), idempotency |
| Seller ↔ Buyer | Each is untrusted to the other | API authZ layer | Object-ownership checks, PII gate, `getSellerProfile()` resolution |
| User → Admin functions | Any authenticated user | Admin routes | `requireAdmin` decorator, `audit_logs` |
| API → R2/MinIO | Client (presign consumer) | API + storage | Server-derived keys, content-type/size scoping, ownership on delete |

### 1.3 Key abuse cases enumerated

1. **Escrow/payout abuse** — trigger a payout without funded escrow or photo evidence; force early auto-release; misroute a transfer to the wrong connected account; double-refund.
2. **Webhook forgery/replay** — forged or replayed Stripe event funds/releases escrow.
3. **IDOR / broken access control** — read or mutate another user's post/offer/transaction/conversation/dispute/payout/upload by enumerating UUIDs; seller-side path that uses `User.id` where `SellerProfile.id` is required.
4. **PII exposure** — seller obtains buyer's exact address/contact before escrow is funded (#17 gate bypass).
5. **Auth abuse** — refresh-token reuse not detected; logout doesn't revoke; brute-force via bypassable rate limits; email-verification bypass; user enumeration.
6. **Injection** — SQL injection via full-text search / raw queries; stored data injection via unsanitized JSONB category data; mass-assignment of privileged fields.
7. **Privilege escalation** — admin route missing `requireAdmin`; privileged action without an audit-log entry.
8. **Upload abuse** — arbitrary object-key write/overwrite/path-traversal; delete another user's object; content-type/size bypass.
9. **Secret leakage** — secrets in logs/errors/Sentry; production boot without required secrets validated.

---

## 2. Findings Table

Severity scale: **CRITICAL** (active money loss / full auth bypass) → **HIGH** (exploitable security/privacy impact) → **MEDIUM** (exploitable under conditions / defense-in-depth gap with real impact) → **LOW** (hardening) → **INFO** (note / spec mismatch).

| ID | Sev | Area | Location | Summary | Follow-up |
|----|-----|------|----------|---------|-----------|
| **C1** | 🔴 CRITICAL | Escrow | `payments.service.ts:119`, `offers.service.ts:477`, `bullmq.ts:154-180` | Escrow can be **transferred to the seller without a confirmed charge**. `releaseEscrow` gates only on `stripePaymentIntentId != null`, but that id is stored at intent-*creation* (`:61-64`) before the buyer pays. Transactions are born `escrowStatus:'held'`, and the one true proof of funding (`stripeChargeId`, set only in the signed `payment_intent.succeeded` handler `:413`) is never checked. Abandoned/failed payment + seller-marks-complete + 7-day auto-release ⇒ platform pays the seller from its own balance for money it never collected. | #255 |
| **H1** | 🟠 HIGH | Escrow | `admin.service.ts:472-487` | Admin `full_refund`/`partial_refund` dispute resolution only sets `escrowStatus:'frozen'` and records `refundAmount` — **it never calls Stripe**. Buyer is told a refund was issued; no money moves. No admin release-to-seller path on `no_refund` either. | #256 |
| **H2** | 🟠 HIGH | Webhooks | `payments.webhook.ts:44-53` | Webhook idempotency is **non-atomic and fails open**: the dedup key is `SET NX` *before* the handler runs and never rolled back on handler failure, so a thrown handler marks the event processed and Stripe's retry is dropped (returns 200). Can leave escrow never marked funded / payouts stuck. | #257 |
| **H3** | 🟠 HIGH | PII gate (#17) | `posts.service.ts:1319-1325`, `:993-994` | `redactPiiIfUnfunded` only nulls `locationAddress`; exact **`latitude`/`longitude`/`locationZip` still serialize to unfunded sellers** on post detail and `/feed`. Reverse-geocode ⇒ buyer's home to within meters. The escrow PII gate is defeated for the most precise field. | #258 |
| **H4** | 🟠 HIGH | PII gate (#17) | `posts.routes.ts:51-69`, `posts.service.ts:750` | `/feed` is optional-auth and swallows JWT failures → **fully unauthenticated callers receive every active post's coordinates**. Mass buyer-PII scrape, no account required. (`/search` is also no-auth but its serializer omits coords; it leaks only city/zip.) | #258 |
| **H5** | 🟠 HIGH | Input validation | `posts.schemas.ts:49-50,83-84,169-170`; echoed at `posts.service.ts:998-999` | `categorySpecific`/`requirements` are `z.record(z.string(), z.any())` — arbitrary nested data, no length/key/depth cap, stored and **echoed back raw**. Stored-XSS risk for the Flutter **Web** target and the Next.js `admin-web` console; also an unbounded-payload storage/DoS amplifier. | #259 |
| M1 | 🟡 MEDIUM | Escrow | `payments.service.ts:74-110`, `transactions.service.ts:246-299,375-442` | Refund/approve/cancel read state in JS then `update` without a row lock or state precondition in the `where`. A buyer racing `refund` against `approve`/auto-release can pass both disjoint guards → **buyer refunded AND seller paid** (double-spend). Mitigated only partially by per-call idempotency keys. | tracked here |
| M2 | 🟡 MEDIUM | Auth | `auth.service.ts:198-214` | Refresh-token **reuse detection is partly dead code**: rotation `del`s the old key, so presenting an already-rotated token hits the generic "revoked" path and never triggers family invalidation (`invalidateAllSessions`). Stolen-refresh-token theft response doesn't fire for the common reuse pattern. | tracked here |
| M3 | 🟡 MEDIUM | PII / privacy | `reviews.routes.ts:30`, `reviews.service.ts:125-126` | Public `GET /reviews/sellers/:sellerId` (no auth) returns each reviewing buyer's full **first+last name, raw user id**, and linked transaction/post title — harvestable buyer-identity surface. | tracked here |
| M4 | 🟡 MEDIUM | DoS | `search.routes.ts:11-20`, `app.ts:113-121` | Unauthenticated `GET /search/posts` runs raw tsquery + per-row Haversine under only the coarse global 1000/hr IP limit → cheap DB-CPU amplification. | tracked here |
| M5 | 🟡 MEDIUM | Uploads | `storage.ts:207-229` | Presigned PUT sets **no size constraint** — a valid presign can PUT an arbitrarily large object (R2 cost/storage DoS). Size limit is only checked on the unused server-buffer path. | tracked here |
| M6 | 🟡 MEDIUM | PII gate (#17) | `posts.service.ts:1099-1101` | `getDiscoveryFeed` serializes posts with **no redaction wrapper** at all. Mitigated today only because it surfaces `isSeed` fake-buyer posts; a latent gate bypass if seeds ever carry real geocoded addresses. | tracked here (part of #258 fix) |
| M7 | 🟡 MEDIUM | Escrow | `payments.service.ts:495-546` | `handlePayoutPaid`/`Failed` match the **oldest `in_transit` payout** rather than the actual Stripe payout id → wrong-payout attribution with concurrent payouts or on replay. | tracked here |
| M8 | 🟡 MEDIUM | Escrow | `transactions.schemas.ts:27-32` | `beforePhotos` is `.optional()` — a seller can mark complete and collect with no before photo, weakening the before/after evidence fraud control the PRD requires. | tracked here |
| L1 | 🔵 LOW | Auth | `auth.service.ts:339-365` | `forgot-password` user-enumeration via response timing (real users do extra Redis + email work; non-users early-return). |
| L2 | 🔵 LOW | Auth / infra | `app.ts:57,113-121` | IP-keyed rate limits depend on Nginx replacing (not appending) `X-Forwarded-For` with `trustProxy:true`. Confirm at the proxy layer. |
| L3 | 🔵 LOW | Logging | `server.ts` (no pino `redact`) | No `redact` paths configured. No active leak today, but no guardrail against a future `log({req})` emitting auth headers/cookies. |
| L4 | 🔵 LOW | Config | `storage.ts:17-32` | Silent MinIO dev fallback (`minioadmin` creds in source) if `R2_ACCOUNT_ID` is unset in production. Add a `validateProductionEnv` hard-fail. |
| L5 | 🔵 LOW | Uploads | `storage.ts:217` | Declared content-type isn't byte-validated on the presign path; `application/pdf` (`verification-docs`) can carry active content. Ensure `R2_PUBLIC_URL` is a sandboxed, cookieless origin. |
| L6 | 🔵 LOW | Fees | `fees.ts:35-137` | Fee math in float dollars; platform fee is a derived residual so rounding drift accrues there. Compute in integer cents to make the ledger foot. |
| L7 | 🔵 LOW | Rate limit | `ai-assist.service.ts:173-180` | AI rate budget is charged even when the downstream Gemini call fails. |
| INFO-1 | ⚪ INFO | Spec | `auth.routes.ts:27` | Register limit is **20/hr in code** vs 3/hr in CLAUDE.md (likely swapped with `forgot-password`'s 3/hr). Reconcile docs ↔ code. |
| INFO-2 | ⚪ INFO | Spec | `fees.ts:98-116` | `product_local_platform` charges buyer 5% / seller 5%; CLAUDE.md documents local platform as 3% / 3%. Confirm intended rate. |
| INFO-3 | ⚪ INFO | Surface | `transactions.service.ts:601-602` | Internal Stripe PI/refund ids serialized to transaction parties (access-gated, not exploitable). Trim unnecessary surface. |

### Items elevated/clustered for fixes
- **C1 + the escrow funded-state cluster** also includes two contributing HIGH-grade conditions the payments review flagged: transactions are born `escrowStatus:'held'` (`offers.service.ts:477`) and the auto-release worker trusts that status without a funded check (`bullmq.ts:154-180`). They share one fix (introduce a verified `funded` state / gate on `stripeChargeId`) and are tracked together under #255.

---

## 3. Checklist Results (issue #135 scope)

| Checklist item | Result |
|----------------|--------|
| Threat model core flows + trust boundaries | ✅ Documented (§1) |
| AuthZ / IDOR — `getSellerProfile()` resolution, object ownership | ✅ **No IDOR found.** Invariant holds across posts/offers/transactions/messages/disputes/payouts/reviews/saved-*/sellers/users/uploads/notifications. (1 MEDIUM PII surface: M3) |
| Auth tokens — rotation, reuse detection, blacklist, Redis isolation | ⚠️ Rotation/blacklist/Redis-isolation ✅; **reuse detection partly dead (M2)** |
| Stripe escrow — charges/transfers, `transfer_group`, change-req cap, auto-release, fee math, refunds | ❌ **C1 CRITICAL** + H1/H2 + M1/M7/M8. `transfer_group` integrity ✅, change-req cap (2) ✅, auto-release-not-forceable ✅, idempotency keys ✅ |
| Webhook security — signature verification, replay/idempotency | ⚠️ Signature verification ✅ (`webhook.ts:35`); **idempotency fragile (H2)** |
| PII gate (#17) — address/contact hidden until funded, API-layer | ❌ **H3/H4 HIGH** (coords + zip leak; anonymous `/feed`), M6. Address string + buyer email correctly gated |
| Input validation — Zod coverage, JSONB sanitization, FTS injection | ⚠️ Zod coverage broad ✅, **FTS NOT injectable** ✅ (parameterized), **JSONB unvalidated (H5)** |
| Rate limits — enforced, not bypassable | ⚠️ Enforced & user-keyed where authenticated ✅; IP-keying caveat (L2), search gap (M4), register doc mismatch (INFO-1) |
| Uploads — presigned scoping, content-type/size, traversal, delete ownership | ⚠️ Key scoping/traversal/delete-ownership/content-type ✅; **no size cap (M5)**, byte-sniffing (L5) |
| Admin module — `requireAdmin` everywhere, audit logs | ✅ Plugin-level `authenticate`+`requireAdmin` on all admin routes; audit logs on every privileged mutation |
| Secrets/config — `validateProductionEnv`, no secrets in logs, stubs don't leak | ✅ Real prod gate; stubs swallow errors & don't log secrets; no secret logging found. (L3/L4 hardening) |
| Dependency review (non-HIGH/CRITICAL Snyk relevant) | ⏭️ Deferred to #32 (automated SCA) per ticket scope |

---

## 4. Sign-off

- **Overall posture:** Strong on access control, auth primitives, admin guarding, and SQL-injection resistance. The risk concentrates in **(a) the escrow funded-state machine** (C1 — must fix before launch) and **(b) the #17 PII gate** (H3/H4 — leaks precise buyer location), plus **(c) unvalidated post JSONB** (H5).
- **Launch gate:** P0-launch-blocker per the ticket. **Recommend NOT shipping until C1, H1–H5 are remediated** (or each accepted with a documented compensating control).
- **Follow-ups:** 1 CRITICAL + 5 HIGH require their own tracked issues (#255–#259). MEDIUM/LOW tracked in this document.
- **Reviewer sign-off:** _pending remediation of CRITICAL/HIGH — re-review required._

