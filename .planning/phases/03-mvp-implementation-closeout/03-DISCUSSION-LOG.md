# Phase 3: MVP Implementation Closeout - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 03-mvp-implementation-closeout
**Areas discussed:** Geocoding strategy, Counter-offer data model
**Areas deferred to Claude discretion:** PII gate granularity, Audit re-run mechanism, Stripe Identity badge flow, Video upload size cap, Stripe Connect fix scope, Plan sequencing

---

## Geocoding Strategy

### Top-level: distance computation

| Option | Description | Selected |
|--------|-------------|----------|
| Google Geocoding + Distance Matrix | Paid, accurate, hits API on every post create | |
| PostGIS extension on existing PG | Free, fast, requires migration + raw SQL | ✓ |
| Pure PG `point` + Haversine math | No extension needed, slower at 100K+ posts | |

**User's choice:** PostGIS for backend distance math.
**Notes:** User explicitly directed "use PostGIS (not Google Geocoding API for backend distance)". This split distance computation from address→coords conversion, which became the follow-up question.

### Follow-up: address → lat/lng geocoder

| Option | Description | Selected |
|--------|-------------|----------|
| Google Geocoding API (Recommended) | One-shot at post create + seller-profile location set; cache lat/lng on the row; existing `GOOGLE_MAPS_API_KEY` already wired; ~$25/yr at MVP scale | ✓ |
| Nominatim (OSM, free) | Free OpenStreetMap-based; less accurate for US suburb/apartment addresses; 1 req/sec rate limit on public instance | |
| Manual location pin | Skip geocoding entirely — buyers drop a map pin during post creation; coordinates captured directly; adds UX step | |

**User's choice:** Google Geocoding API for address→coords; PostGIS for distance math (combined: lat/lng cached on rows, ST_DWithin for radius queries).
**Notes:** None.

---

## Counter-Offer Data Model

### Top-level: storage shape

| Option | Description | Selected |
|--------|-------------|----------|
| New `OfferRevision` table linked to original Offer | Clean lineage, normalized querying, more schema | ✓ |
| Existing `Message` table with structured payload type=`counter_offer` | Lightest, mixes chat + offer data | |
| `revisions` JSONB field on Offer | Compact, loses normalized querying | |

**User's choice:** New `OfferRevision` table.
**Notes:** None — direct selection during the gray-area multi-select.

### Follow-up: revision threading model

| Option | Description | Selected |
|--------|-------------|----------|
| Linear chain on Offer (Recommended) | Each round is a new OfferRevision row with `parent_offer_id`, `revision_number`, `proposed_by`, `price`, `timeline`, `message`, `status`. Latest revision wins; older preserved as audit trail | ✓ |
| Bidirectional state machine | Explicit state transitions (PROPOSED → COUNTERED → ACCEPTED/DECLINED/EXPIRED); only one revision active at a time. More normalized, heavier impl | |
| Immutable revision log | Append-only revisions; acceptance/decline lives on parent Offer. Fastest, but loses "this counter was declined for that reason" context | |

**User's choice:** Linear chain on Offer.
**Notes:** None.

---

## Claude's Discretion

User directed "let Claude handle 3 and 4" (PII gate granularity + Audit re-run mechanism) and the smaller items (Stripe Identity flow, video cap, Stripe fix scope). Recommendations recorded in CONTEXT.md `<decisions>` section. Summary of what was picked:

- **PII gate granularity** → city + state + zip + distance shown pre-payment; full street + buyer contact revealed post-`escrowFundedAt`. Enforced at service layer via redaction (not DB views).
- **Audit re-run mechanism** → Vitest test file at `backend/tests/audit/closeout-audit.test.ts`, one assertion block per success criterion, CI-gated.
- **Stripe Identity badge flow** → webhook auto-creates VerificationRequest with `status='approved'`, `approvedBy='system_stripe_identity'`. Preserves existing approval pipeline + AuditLog trail.
- **Video upload size cap** → 50MB tier for `post-videos` and `transaction-photos` categories; existing 10MB image / 25MB doc tiers unchanged. MIME allowlist adds `video/mp4`, `video/quicktime`.
- **Stripe Connect fix scope** → 3-bug fix + env-validation hardening. Hardening guard refuses backend startup in prod when `STRIPE_CONNECT_RETURN_URL` unset OR `FRONTEND_URL` is the localhost default.
- **Counter-offer round cap** (sub-decision under #2) → 5 total revisions per Offer (original + 4 counters). Open to override during plan review.
- **Plan sequencing** → Wave 1 (foundational): PostGIS + OfferRevision + audit-gap micro-fixes. Wave 2-4 dependent. Stripe Connect fix can be promoted to Wave 1 by planner if dependency analysis allows (it's independent of all other workstreams).

## Deferred Ideas

- Profile menu Help & Support routing fix (already routed to 999.2 backlog finding I)
- Server-side video transcoding (out of scope for MVP)
- PostGIS-based heatmaps / popular-area clustering
- Per-category video size tiers
- Counter-offer auto-expire timers
- Stripe Identity for Background Checked badge (still manual)
- Geocoding fallback to Nominatim on quota
- Saved-searches integration with seller-feed geo filter
