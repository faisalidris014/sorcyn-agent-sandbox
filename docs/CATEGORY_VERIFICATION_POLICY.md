# Category Verification Policy (Services & Jobs)

**Status:** Signed off — 2026-07-06 (#369). Supersedes the epic #334 "draft" classification.
**Scope:** The 25 Services/Jobs subcategories a seller must be granted access to before
receiving requests. Products is auto-granted at profile creation and is **not** gated here.

This is the authoritative policy behind the per-subcategory verification router. Keep it in
lockstep with the code:

| Layer | File |
|-------|------|
| Policy data (per-sub `mode` / `isLicensed` / `licenseAuthority` / `requiresBackgroundCheck`) | `backend/prisma/seed-category-verification.ts` → `CategoryVerificationConfig` |
| Routing logic (`deriveRequiredDocTypes`, `routeCategoryRequest`) | `backend/src/modules/sellers/category-verification.ts` |
| Required-docs API + submit | `backend/src/modules/sellers/sellers.service.ts` |
| Mobile add-category form (authority-specific labels) | `mobile/lib/features/sellers/presentation/screens/seller_add_category_screen.dart` |

`mode` is a **release valve**: flipping a row in the DB changes handling with no deploy.

## Modes and derived documents

| Mode | Meaning | Outcome |
|------|---------|---------|
| `instant` | No state license; low risk | Auto-approve on submit (unlocks feed immediately) |
| `verify` | Licensed; a provider can check the credential | Auto-approve/reject via provider; **queues** if no provider is wired (Phase 2) |
| `manual_only` | Licensed or high-trust; always human-reviewed | Queues to the admin review queue |

Required documents are **derived** from the config (`deriveRequiredDocTypes`):
`id` is always required; `license` is added when `isLicensed`; `background_check` when
`requiresBackgroundCheck`. Escrow safety: licensed work is **never** optimistically unlocked —
a `verify` row with no provider falls back to the manual queue.

## Legal mandate vs. platform trust/safety

Two different reasons a subcategory is gated, kept distinct on purpose:

- **Legal mandate** — Texas law requires a state license/registration (or a mandated background
  check) to perform the work for pay. Gating protects the platform and buyers from unlicensed work.
- **Platform trust/safety** — Texas does **not** require it, but Sorcyn chooses to gate for buyer
  safety (e.g. in-home access to a person or pet). Must **not** be presented to sellers as
  "state-mandated."

## Signed-off classification

Legend: **L** = legal mandate, **T/S** = platform trust/safety choice.

| Subcategory | Mode | Required docs | Authority | Basis | Why |
|-------------|------|---------------|-----------|:-----:|-----|
| electrical | verify | id, license | TX_TDLR | L | TDLR electrician/contractor license required statewide |
| hvac | verify | id, license | TX_TDLR | L | TDLR Air Conditioning & Refrigeration Contractor license required |
| plumbing | manual_only | id, license | TX_TSBPE | L | TSBPE license required (confirmed **not** moved to TDLR); RMP carries $300k COI |
| pest_control | manual_only | id, license | TX_TDA | L | TDA Structural Pest Control license (business + certified applicator) required |
| moving | manual_only | id, license | TX_TXDMV | L | Intrastate household-goods movers must hold a TxDMV motor-carrier registration + insurance filing |
| childcare | manual_only | id, background_check | — | L | HHSC child-care licensing; **fingerprint background check legally mandated** for regulated operations |
| pet_care | manual_only | id, background_check | — | **T/S** | No TX license or mandated check; gated for in-home buyer safety (PRD high-risk category) |
| other_services | manual_only | id | — | T/S | Catch-all → manual triage |
| cleaning | instant | id | — | — | No TX license (mold remediation is a separate TDLR-licensed service) |
| landscaping | instant | id | — | — | General work (mow/plant/hardscape) unlicensed. Irrigation & pesticide application are split into their own gated subs below (#383) |
| landscape_irrigation | manual_only | id, license | TX_TCEQ | L | TCEQ Licensed Irrigator required for irrigation/sprinkler install & repair (Water Code Ch. 344) |
| pesticide_application | manual_only | id, license | TX_TDA | L | TDA applicator license (Cat 3A) required to apply pesticide/herbicide to lawns & ornamentals for hire |
| painting | instant | id | — | — | No TX license. **Caveat:** federal EPA RRP certification for pre-1978 homes / child-occupied facilities |
| roofing | instant | id | — | — | No TX state license (RCAT cert is voluntary; some DFW cities require local registration) |
| handyman | instant | id | — | — | Unlicensed for general repair. **Caveat:** illegal once work crosses into electrical/plumbing/HVAC |
| auto_repair | instant | id | — | — | No TX license for general repair (only DPS-certified emissions/inspection stations are regulated) |
| tutoring | instant | id | — | — | No TX license (state-funded PDSES program is a narrow exception, not private tutoring) |
| personal_training | instant | id | — | — | No TX license ("athletic trainer" is a distinct TDLR healthcare role, not a fitness trainer) |
| photography | instant | id | — | — | No TX license (drone work is federal FAA Part 107) |
| event_planning | instant | id | — | — | No TX license (only TABC if the planner serves/sells alcohol directly) |
| **Jobs** (entry_level, skilled_trade, professional, management, part_time, contract, other_jobs) | instant | id | — | — | No licensing gate to post a job or receive candidate leads |

**Net change vs. the draft:** 24 of 25 validated as-is. Only `moving` was reclassified
(`instant` → `manual_only` + license, TX_TXDMV) to close a real compliance gap. `pet_care`'s
policy is unchanged but its rationale is now labeled **trust/safety** rather than legal.

## Field model

**Live (this policy):** `id`, `license` (+ license number & holder name), `background_check`.
License fields carry **authority-specific labels** on the mobile form (TDLR / TSBPE (RMP) / TDA /
TxDMV / TCEQ) so sellers enter the right credential — driven by `licenseAuthority`, no backend change.

**Deferred (follow-ups):**
- **Optional insurance certificate + "Insured" badge** — incumbents (Thumbtack/Angi/TaskRabbit/
  Care.com) collect insurance as an *optional, badge-if-provided* signal on physical/in-home
  trades, never a hard gate. Needs an optional-docs + badge mechanic we don't have yet. Tracked as
  a follow-up; ties into the existing "Insured" badge system.
- **License/insurance expiration + re-verification** — capture an expiry date, grey/remove the
  badge on lapse, and re-prompt. Needs lapse/re-verify machinery. Follow-up.

**Resolved follow-ups:**
- **Landscaping sub-split (#383, done)** — irrigation and pesticide application are now their own
  `manual_only` + license subs (`landscape_irrigation` → TX_TCEQ, `pesticide_application` → TX_TDA);
  general `landscaping` stays `instant`. See the table rows above. No backfill of existing
  landscaping posts — buyers pick the finer sub going forward.

## Caveats & boundaries

- **City/county rules are out of scope.** Several "no state license" trades (roofing, painting,
  handyman) can still require municipal registration/permits in DFW cities (Dallas, Fort Worth,
  Arlington). Spot-check per city if that granularity is ever needed.
- **TDLR provider dependency (#337).** `electrical`/`hvac` are `verify` but the TX TDLR lookup
  provider is not wired yet, so they currently **queue** (never optimistically unlock).
- **TxDMV has no lookup provider**, so `moving` is `manual_only` today (like plumbing/pest_control).
  It can be promoted to `verify` if a TxDMV registration-lookup adapter is ever built.

## Sources

Verified against authoritative Texas state / federal sources (July 2026):
TDLR (`tdlr.texas.gov/electricians`, `/acr`), TSBPE (`tsbpe.texas.gov`), TDA Structural Pest
Control & pesticide applicator (`texasagriculture.gov`), TCEQ landscape irrigator
(`tceq.texas.gov/licensing`), TxDMV motor-carrier registration (`txdmv.gov/motor-carriers`),
HHSC child-care licensing & fingerprint rules (`hhs.texas.gov`), EPA RRP
(`epa.gov/lead`). License existence + issuing authority are HIGH confidence; the informal
babysitting/nanny exemption (Human Resources Code Ch. 42) is the one MEDIUM-confidence boundary.
