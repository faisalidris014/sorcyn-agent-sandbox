# TX TDLR License Verification — Integration Spike + Adapter

**Issue:** #337 (epic #334, seller category access — Phase 3)
**Status:** implemented (adapter off by default behind `TDLR_VERIFICATION_ENABLED`)

This is the "SPIKE FIRST" deliverable for #337: how we verify Texas TDLR
professional licenses (electricians + A/C & refrigeration / HVAC) and the access
method the adapter is built against.

## Chosen method — Socrata SODA API

TDLR license data is machine-accessible through the **Texas Open Data Portal**
(Socrata), dataset **`7358-krk7`** ("TDLR – All Licenses"). The adapter live-queries
it by license number:

```
GET https://data.texas.gov/resource/7358-krk7.json?license_number=<n>&$limit=50
Header: X-App-Token: <TDLR_APP_TOKEN>   # optional but recommended
```

- **Dataset page:** https://data.texas.gov/dataset/TDLR-All-Licenses/7358-krk7
- **API docs:** https://dev.socrata.com/foundry/data.texas.gov/7358-krk7
- Returns a JSON array of records. Fields we read: `license_number`,
  `license_type`, `license_subtype`, `owner_name`, `business_name`,
  `license_expiration_date_mmddccyy`.

### Why not the alternatives
- **License Search web portal** (`tdlr.texas.gov/LicenseSearch/`) — human web form,
  no supported JSON API. Scrapeable but brittle; it *is* the only source of live
  enforcement status (see caveat). Not used for automation.
- **Daily CSV roster downloads** (`tdlr.texas.gov/LicenseSearch/licfile.asp`) —
  per-trade CSVs updated daily (electricians `Ltelcall.csv`, A/C `ltairref.csv` /
  `ltactech.csv`). A good future nightly cache for resilience/offline checks, but
  heavier to operate than the API for single-license lookups. Deferred (a #337
  follow-up).

## Decision policy (escrow-safe)

The adapter (`TdlrProvider`) returns a `ProviderVerifyResult` that the router
(`category-verification.ts`) maps to an outcome:

| Lookup result | Outcome | reason |
|---|---|---|
| Active license (future expiration), name match ≥ threshold | `auto_approve` | `provider_approved` |
| License found, name match below threshold | `queue` | `name_mismatch` |
| License found, name matched, but expired | `auto_reject` | `license_expired` |
| Number not found in a gated trade | `queue` | `license_not_found` |
| Expiration unparseable (name matched) | `queue` | `expiration_unparseable` |
| No license number supplied | `queue` | `license_number_missing` |
| API timeout / non-200 / network error | `queue` | `provider_unreachable` |

Only a confident active + name-matched lookup auto-approves. Auto-reject is
reserved for a license that is clearly the seller's but expired. Everything
ambiguous or transient defers to the manual admin queue — never optimistic-unlock,
never hard-reject a possibly-legit seller on a transient failure.

Name matching is the basic token-overlap matcher in
`backend/src/modules/sellers/entity-matcher.ts` (normalize → strip business/
generational suffixes → Sørensen–Dice over token sets, threshold 0.6), scored
against both `owner_name` and `business_name`.

## Known limitations / caveats

1. **No status field (important).** Neither the API nor the CSVs carry an
   Active/Suspended/Revoked flag. We derive validity from *presence + a future
   expiration date*. A **suspended or revoked** license that hasn't lapsed is
   indistinguishable from a valid one via machine data — only the human portal
   shows enforcement status. Acceptable for a positive "Licensed" signal; a gap
   for adverse-action detection.
2. **`7358-krk7` is ALL TDLR programs** (cosmetology, tow trucks, …), so the
   adapter filters to construction trades by `license_type` keyword
   (`electric`, `air conditioning`, `refrigeration`, `hvac`). It does **not** yet
   distinguish an electrical request from an HVAC one — a valid license in either
   gated trade satisfies either request. Per-subcategory license-type precision
   is a follow-up (the provider only receives subcategory UUIDs, not slugs).
3. **Basic matcher, not fraud-proof.** It confirms the claimed name matches the
   record for that number; a determined actor could copy a public record name.
   True identity binding (vs verified gov-ID name) is a follow-up.
4. **Freshness.** The CSV index says "updated daily"; validate the SODA mirror's
   refresh cadence before relying on it as real-time. If it lags materially,
   switch the cache of record to the daily CSV download.
5. **Date format.** `license_expiration_date_mmddccyy` is treated as 8-digit
   MMDDYYYY (with ISO / `MM/DD/YYYY` fallbacks). Confirm against live data.

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `TDLR_VERIFICATION_ENABLED` | `false` | Master switch. When true, `buildApp()` registers `TdlrProvider` under authority `TX_TDLR`. Off → `electrical`/`hvac` requests fall back to the manual queue (`no_provider`). |
| `TDLR_APP_TOKEN` | _(unset)_ | Socrata app token. Raises the rate limit to 1000 req/hr; without it a low shared per-IP throttle applies (429 risk). |

The `electrical` and `hvac` config rows are already seeded with
`mode: 'verify', licenseAuthority: 'TX_TDLR'` (see
`backend/prisma/seed-category-verification.ts`), so enabling the flag is all that
is needed to activate auto-decisioning.

## Telemetry

Outcomes emit `rm_category_request_outcome_total{outcome,reason,authority}`
(authority `TX_TDLR`) — watch `provider_approved` vs the various `queue` reasons
to tune the match threshold and gated-trade keywords.

## Follow-ups (separate issues)

- Per-subcategory license-type precision (electrical ≠ HVAC).
- Nightly CSV roster cache + offline verification.
- Additional boards (plumbing/TSBPE, pest control/TDA).
- Advanced fuzzy matcher + gov-ID identity binding.
- Optional portal check for enforcement (suspended/revoked) status on high-risk subs.
