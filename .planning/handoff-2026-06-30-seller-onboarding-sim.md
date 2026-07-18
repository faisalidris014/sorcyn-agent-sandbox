# Handoff — Seller Onboarding Gate sim session (2026-06-30)

Prepared for a future session to pick up cleanly. Faisal drove the iOS sim; this captures what's verified, what's open, and where everything lives so nobody re-investigates.

## Status snapshot

- **Branch `fix/seller-onboarding-feed-scoping` → PR #366** — OPEN, **CI green**, **sim-verified**. Ready to merge (recommend **Rebase and merge**, 6 clean commits). Merge decision left to Faisal.
- Commits on the branch:
  - `1abf5db` forced seller setup before marketplace + fail-closed feed scoping
  - `0584f1a` start category verification from setup+edit; real availability editor
  - `c1cdc41` offer status coverage (counter_offered / needs_reconfirmation / expired)
  - `4406d86` AI picks subcategory + publish guard
  - `377904b` guard `loadProfile` against post-dispose race (fixed Mobile CI — 3 session_reset tests)
  - `f187e50` `businessHours` → `z.partialRecord` (fixed the submit error) + regression test + regenerated contract

## Verified on the iOS sim ✓

1. **Forced onboarding gate works.** A fresh seller is locked into Set Up Seller Profile, cannot interact with the app until the profile is created, and a cold start re-locks (not dropped into an unscoped feed). Logout button + non-trapping back are present.
2. **Profile submit works** after the `partialRecord` fix — a Mon–Fri week with weekends off (the original failure) now saves.
3. **Add Services/Jobs flow** is offered right after profile creation and works well (this is existing shipped behavior, not new — see #367 note below).
4. **Feed is correctly Products-scoped** (Services/Jobs are pending verification, so not yet granted). The fail-closed scoping behaves as designed.

## Open follow-up tickets

- **#369 — Validate & finalize per-subcategory verification requirements (Services/Jobs).** The per-subcategory policy is data-driven and complete, but the classification is a *draft* (`backend/prisma/seed-category-verification.ts`). Needs a domain/legal review of each subcategory's licensing/background-check requirement for TX/DFW, plus a decision on whether richer per-subcategory fields are needed (insurance cert, authority-specific labels, cert type/expiry). Full breakdown + acceptance criteria in the issue.
- **#370 — bug(mobile/feed): last Find Work card cut off behind bottom nav.** Root cause: `mobile/lib/features/feed/presentation/screens/seller_feed_screen.dart:292` — the feed `ListView.builder` has `padding: EdgeInsets.symmetric(horizontal: 16)` with **no bottom padding**, so the last card scrolls under the nav bar. Fix = bottom padding clearing nav height + `MediaQuery.viewPadding.bottom`. Also check My Offers / Discover for the same missing inset.

## Closed during this session

- **#367 — CLOSED as duplicate.** "Add Services/Jobs during setup" is already shipped via **#338 / #4** (`seller_profile_setup_screen.dart:91-118` offers the verified add-category flow right after create). It was filed during the window where submit was broken, so the existing dialog wasn't reachable. The real open question (correct fields per subcategory) is #369.

## Still undecided / not yet filed

- **Emergency-services full-stack:** WS3 removed the no-op Emergency Services toggle from the UI only. The full-stack version (DB column + migration + schema + model) is **deferred and has NO issue yet.** Decide: file it or drop it.
- **Merge PR #366:** pending Faisal.
- **Next build thread to plan:** #6 (AI chatbot — built, still not on main), #310/#312 (post/offer photo uploads), or #315 (Discover finish). Standing recommendation: land #6 or build #310/#312.

## Answer captured: are the verification fields per-subcategory? (so nobody re-investigates)

Yes — fully data-driven per subcategory, not Plumbing-specific. Required docs derive from each subcategory's config via `deriveRequiredDocTypes`: `id` always; `license` if `isLicensed`; `background_check` if `requiresBackgroundCheck`.

| Policy | Subcategories | Docs asked |
|--------|---------------|-----------|
| verify (TX TDLR, provider in #337) | electrical, hvac | id + license |
| manual_only + license | plumbing (TX_TSBPE), pest_control (TX_TDA) | id + license |
| manual_only + background check | childcare, pet_care | id + background check |
| manual_only | other_services | id |
| instant | cleaning, landscaping, painting, roofing, moving, handyman, auto_repair, tutoring, personal_training, photography, event_planning + all 7 Jobs subs | id |

Plumbing showed a license field because it's `manual_only, isLicensed, TX_TSBPE`. Instant subs ask only for ID.

## File pointers

- Verification router (pure decision logic): `backend/src/modules/sellers/category-verification.ts`
- Per-subcategory config seed (table `CategoryVerificationConfig`): `backend/prisma/seed-category-verification.ts`
- Requirements endpoint: `GET /category-requirements` in `backend/src/modules/sellers/sellers.routes.ts`
- Seller setup (gate + post-create add-category offer + availability editor): `mobile/lib/features/sellers/presentation/screens/seller_profile_setup_screen.dart`
- Availability editor (WS3): `mobile/lib/features/sellers/presentation/widgets/business_hours_editor.dart`
- Add-category form: `mobile/lib/features/sellers/presentation/screens/seller_add_category_screen.dart`
- Find Work feed (cutoff bug #370): `mobile/lib/features/feed/presentation/screens/seller_feed_screen.dart`
- Plan + audit: `.planning/local-flow-audit.md`, `~/.claude/plans/enchanted-wondering-quokka.md`
