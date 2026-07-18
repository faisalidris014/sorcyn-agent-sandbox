---
status: diagnosed
phase: 02-mobile-ui-restyle-sorcyn-brand
source:
  - 02-01-SUMMARY.md
  - 02-02-SUMMARY.md
  - 02-03-SUMMARY.md
started: 2026-04-29T14:07:40Z
updated: 2026-04-29T14:55:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill the running Flutter app on the simulator, relaunch from scratch. Auto-login completes via the refresh token persisted in flutter_secure_storage (no manual re-login needed), dashboard renders, recent posts/notifications load without red error widgets or 4xx/5xx in the Flutter logs.
result: pass

### 2. Spring page transitions across all push routes
expected: Pushing into any non-tab screen (login → dashboard, dashboard → post detail, post detail → edit, profile → transactions, etc.) animates with the Sorcyn settle-in spring — 4% slide-up + fade, ~420ms duration, no jank or overshoot. Bottom-nav tab switching (Home / My Posts / Messages / Profile) is intentionally animation-free (IndexedStack); only the active dot indicator animates.
result: pass

### 3. Settings screen — Sorcyn token conformance
expected: Settings screen renders with locked Sorcyn purple-gradient theme. Save CTA is a gradient button (52 px, 12 px radius, glow shadow). Toggle switches use the Sorcyn gradient when enabled. No rogue blue/green hex remains anywhere on the screen.
result: pass

### 4. Help & Support screen — Sorcyn token conformance
expected: Help & Support screen renders with gradient quick-action cards (FAQ, Contact, etc.). Primary Submit/Send CTA at the bottom is a gradient button. Card icons and accents use the Sorcyn purple-gradient palette consistently.
result: issue
reported: "Tapping 'Help & Support' on the Profile page navigates to the Settings screen instead of the Help & Support screen. The Help & Support screen was unreachable; cannot verify its Sorcyn conformance."
severity: major

### 5. My Offers screen — Sorcyn token conformance
expected: My Offers screen shows the "Win Rate" stat as a gradient hero pill (was rogue Tailwind green). Active filter chip uses the shared StatusBadge widget. Empty-state "Browse Requests" CTA is a gradient button. No rogue green hex remains.
result: pass

### 6. Dispute Detail screen — Sorcyn token conformance
expected: Dispute Detail appBar shows a StatusBadge pill (active/resolved/etc.). Assigned-agent avatar uses the Sorcyn primary gradient (was rogue Tailwind blue). Primary "Resolve Dispute" gradient CTA renders ABOVE the existing Add Evidence + Contact Support row — all three actions remain reachable.
result: skipped
reason: "No active dispute exists in test data and the disputes feature is one of the 12 unwired-in-mobile backend features identified by the 2026-04-29 integration audit (no UI path to create or view disputes today). Re-test required when disputes are wired in mobile — mapped to Phase 3 / 999.2 follow-up work."
retest_when: "Disputes feature is wired into mobile (UI path to create/view a dispute exists)."

### 7. Seller Earnings screen — Sorcyn token conformance
expected: Seller Earnings screen shows a Sorcyn primary-gradient balance hero card at the top with a gradient "Request Payout" CTA. Each payout row in the list below uses StatusBadge for its status pill (matching offers/disputes screens). No rogue colors.
result: issue
reported: "Cannot reach the actual Seller Earnings dashboard — Stripe Connect onboarding flow has 3 bugs blocking the path: (1) Stripe `return_url` is `http://localhost:...` so Safari fails to redirect back to the app after the seller taps Confirm in Stripe; (2) after manually returning to the app the seller status stays at 60% / 'Continue Setup' — webhook-or-polling missed the completion event; (3) tapping Earnings Dashboard alternates between two different setup screens ('Complete Setup' 60% progress vs 'Set Up Payments' / 'Set Up Stripe' CTA) — state oscillates between `pending` and `not_started`. Note: the 'Payment Setup' intermediate gate screen IS Sorcyn-conformant (gradient avatar, gradient progress bar, gradient Continue Setup CTA). Earnings dashboard itself unverifiable via UAT."
severity: major
phase_carryover: true
phase_origin: "Phase 1 (Stripe Connect deliverable). Phase 2 visual restyle did not touch Stripe modules. Three bugs were latent in Phase 1 but went undetected until manual cross-flow smoke walked the seller-onboarding path."

### 8. Phase 1 functional regression — full transaction loop
expected: All Phase 1 backend functionality works unchanged after the restyle. Login → Create Post (manual or AI) → switch to seller mode → browse feed → submit offer → switch to buyer → View Offers → Accept Offer (modal renders) → Send Message (gradient sent-bubble) → Mark Complete + Submit Review all complete without 4xx/5xx errors. Real-time messaging via Socket.IO connects.
result: skipped
reason: |
  Full cross-mode transaction loop not completable due to two pre-existing (non-Phase-2) gates:

  (a) 3-DAY EXCLUSIVITY WINDOW (BY DESIGN, Phase 1 / Phase 3): backend posts.service.ts:83-85 stamps every new post with publicAfter = createdAt + 3 days; feed query at line 517-520 only returns posts where publicAfter <= now(). User-created post 'Electrical Test 1 Phase 1 Functional regression' is in-window and invisible to all sellers (including the same user) until ~3 days from now. Phase 3 SC #3 will add the targeted-private-seller carve-out so curated sellers see in-window posts during the window. Today only the exclusion half is implemented — every seller sees the post AFTER 3 days.

  (b) STRIPE CONNECT BUGS (PRE-EXISTING, captured in Test 7 issue): localhost return_url, status not refreshing, alternating setup screens — same 3 bugs blocking the offer-accept → escrow → review sub-loop.

  WHAT WAS EXERCISED AND PASSED: auth (login Phase 2 smoke account), post create (manual flow, electrical services category), mode switching (buyer→seller), Feed page load (UI renders, marketplace context pills work), Seller Profile load (UI renders), No 4xx/5xx errors in any traversal.

  WHAT WAS NOT EXERCISED (BLOCKED BY a + b): submit offer as seller, accept offer modal as buyer, send message gradient sent-bubble, mark complete + submit review.

  PHASE 2 VISUAL RESTYLE ON THESE SCREENS IS CONFORMANT (Image 14 Feed: gradient C2C pill, gradient All filter chip, gradient Newest dropdown, EmptyState. Image 15-16 Seller Profile: gradient avatar, gradient profile-strength bar at 20%, locked stat cards, Verification badges row with Email verified, gradient-bordered Set Up Stripe outline button).

  RE-TEST WHEN: a 2nd seed account (e.g. seller@test.com) is used as the offering seller, OR a test post is DB-tweaked with publicAfter in the past, AND Stripe return_url config is fixed (ngrok tunnel for dev).
retest_when: "Cross-account smoke methodology in place (separate buyer + seller accounts) AND Stripe Connect onboarding flow can complete (Test 7 bugs A+B+C resolved)."

## Summary

total: 8
passed: 4
issues: 2
pending: 0
skipped: 2
blocked: 0

## Gaps

- truth: "Help & Support menu item on Profile screen routes to the Help & Support screen with gradient quick-action cards"
  status: failed
  reason: "User reported: Tapping 'Help & Support' on the Profile page navigates to the Settings screen instead of the Help & Support screen. The Help & Support screen was unreachable; cannot verify its Sorcyn conformance."
  severity: major
  test: 4
  root_cause: "Profile screen 'Help & Support' menu item is wired to context.push('/settings'), routing users to the Settings screen instead of the registered /help route which renders HelpSupportScreen."
  artifacts:
    - path: "mobile/lib/features/profile/presentation/screens/profile_screen.dart"
      line: 557
      issue: "onTap calls context.push('/settings') for the 'Help & Support' menu item — same destination as the Settings menu entry above; the correct route is '/help'."
    - path: "mobile/lib/app.dart"
      line: 447
      issue: "Confirms route registration: '/help' is the canonical path bound to HelpSupportScreen (imported at line 47). '/settings' (line 411) maps to SettingsScreen — a different destination."
  missing:
    - "Change line 557 of profile_screen.dart from `onTap: () => context.push('/settings'),` to `onTap: () => context.push('/help'),`"
  verification_steps:
    - "Run the Flutter app, open the Profile tab, tap 'Help & Support' menu row, confirm HelpSupportScreen renders (title 'Help & Support', FAQ/contact sections) instead of the Settings screen."
    - "Tap the Settings menu row immediately above and confirm it still navigates to SettingsScreen — ensures no regression on the adjacent entry."
    - "Verify back navigation from HelpSupportScreen returns to the Profile screen via the spring transition."
  debug_session: ""

- truth: "Stripe Connect onboarding completes cleanly so seller can reach the Earnings Dashboard with gradient balance hero + payout list"
  status: failed
  reason: "User reported 3 symptoms blocking the path: (1) Stripe Connect return_url is http://localhost:... — Safari shows 'couldn't connect to the server' after tapping Confirm in Stripe; (2) seller status doesn't refresh after Stripe completion — Payment Setup screen still shows 60% / 'Continue Setup'; (3) Earnings Dashboard routes alternate between 'Complete Setup' (60% progress) and 'Set Up Payments' (Set Up Stripe CTA) on successive taps."
  severity: major
  test: 7
  phase_carryover: true
  phase_origin: "Phase 1 — Stripe Connect deliverable. Phase 2 visual restyle did not touch Stripe modules."
  partial_credit: "The 'Payment Setup' intermediate gate screen (Image 12) IS Sorcyn-conformant — gradient credit-card avatar, gradient progress bar, gradient 'Continue Setup' CTA. Visual restyle on this gate is correct."

  root_cause: |
    Two contributing root causes. (1) The dev environment defaults STRIPE_CONNECT_RETURN_URL/FRONTEND_URL
    to localhost (Bug A) so the redirect-back never reaches the simulator. (2) The screen state model in
    StripeOnboardScreen mixes ephemeral widget state (_onboardingStarted) with server state (stripeStatus,
    profile), and the profile menu over-routes two items ('Earnings Dashboard' AND 'Payment Methods') to
    StripeOnboardScreen instead of routing 'Earnings Dashboard' to the existing-but-unreachable
    /seller/earnings route — together producing both Bug B's stale-progress symptom and Bug C's apparent
    screen-alternation.

  bug_A_localhost_redirect:
    root_cause: "STRIPE_CONNECT_RETURN_URL is unset and FRONTEND_URL defaults to http://localhost:8080, so Stripe sends users to a dead localhost URL after onboarding."
    artifacts:
      - path: "backend/src/modules/payments/payments.service.ts"
        line: 232
        issue: "return_url falls back to `${env.FRONTEND_URL}/seller/stripe/complete` — works only if FRONTEND_URL is overridden."
      - path: "backend/src/config/env.ts"
        line: 65
        issue: "FRONTEND_URL: z.string().default('http://localhost:8080') — this default leaks into Stripe return_url when env is unset (validate-env warning at line 99 fires but does not block startup)."
      - path: "backend/src/config/env.ts"
        line: 52
        issue: "STRIPE_CONNECT_RETURN_URL is .optional() with no fallback validation tied to environment."
    fix: |
      Set explicit env values in backend/.env. Recommended (custom URL scheme deep link, already wired):
        STRIPE_CONNECT_RETURN_URL=reversemarket://seller/stripe/complete
        STRIPE_CONNECT_REFRESH_URL=reversemarket://seller/stripe/refresh
      The `reversemarket` scheme is registered in mobile/ios/Runner/Info.plist:59 and the Android
      intent filter is wired (mobile/android/app/src/main/AndroidManifest.xml:34). Long-term: in env.ts,
      refuse to start when NODE_ENV != 'test' AND (STRIPE_CONNECT_RETURN_URL unset OR FRONTEND_URL still
      equals the localhost default).

  bug_B_status_not_refreshing:
    root_cause: "StripeOnboardScreen only fetches status in initState; it has no AppLifecycleState observer, so when the user re-foregrounds the app after Stripe, no refetch happens and stripeChargesEnabled stays stale."
    artifacts:
      - path: "mobile/lib/features/sellers/presentation/screens/stripe_onboard_screen.dart"
        line: 63
        issue: "initState calls loadStripeStatus() once. No WidgetsBindingObserver, no didChangeAppLifecycleState, no GoRouter focus listener → status never re-pulled on return-to-app."
      - path: "mobile/lib/features/sellers/presentation/screens/stripe_onboard_screen.dart"
        line: 76
        issue: "isInProgress = _onboardingStarted && !isConnected. Once Stripe completes, only the user-tapped 'Continue Setup' button (line 478) triggers _checkStatus. UI is locked at 60% until they tap."
      - path: "backend/src/modules/payments/payments.service.ts"
        line: 380
        issue: "handleAccountUpdated correctly persists stripeChargesEnabled/stripePayoutsEnabled. Backend is fine — assuming the Stripe webhook endpoint is registered with Stripe AND reachable from Stripe's servers (the app must be exposed via tunnel for webhooks to land in dev). If webhook never reaches the server, the DB row never updates."
    fix: |
      1. Make StripeOnboardScreen a WidgetsBindingObserver and call loadStripeStatus() + loadProfile() on
         AppLifecycleState.resumed. Fixes the simulator case where the user manually returns.
      2. Verify in dev that the Stripe webhook URL is reachable (ngrok → /api/v1/payments/webhook) so
         account.updated actually fires.
      3. Optionally on resume, also call stripe.accounts.retrieve() server-side as a fallback poll.

  bug_C_alternating_screens:
    root_cause: "Two profile menu items both push '/seller/stripe-onboard' (StripeOnboardScreen). The 'alternating screens' the user reports are actually the SAME screen rendering its three internal states (`Set Up Payments` / `Complete Setup` / `Payments Connected`) which switch based on `isInProgress = _onboardingStarted && !isConnected` — a flag that lives in widget state and resets every time the screen is built fresh, so depending on whether _onboardingStarted was set in this widget instance the user sees either the 60% setup card or the initial 'Set Up Stripe' CTA. Critically: the Earnings Dashboard menu item should route to /seller/earnings (which exists and is registered) but is mis-wired to /seller/stripe-onboard."
    artifacts:
      - path: "mobile/lib/features/profile/presentation/screens/profile_screen.dart"
        line: 531
        issue: "'Earnings Dashboard' menu item routes to '/seller/stripe-onboard' instead of '/seller/earnings'. The route '/seller/earnings' exists in app.dart line 455 and renders SellerEarningsScreen — currently unreachable from the profile."
      - path: "mobile/lib/features/profile/presentation/screens/profile_screen.dart"
        line: 538
        issue: "'Payment Methods' menu item also routes to '/seller/stripe-onboard'. Two menu items collapsing onto the same destination is the visible 'two screens' confusion."
      - path: "mobile/lib/features/sellers/presentation/screens/stripe_onboard_screen.dart"
        line: 21
        issue: "_onboardingStarted is local widget state. After stack pop and re-push the field starts at false → user sees 'Set Up Stripe' even mid-flow, until loadStripeStatus completes (async, microtask) — first frame is the initial state. Produces 'sometimes one screen, sometimes the other' flicker."
      - path: "mobile/lib/features/sellers/presentation/screens/stripe_onboard_screen.dart"
        line: 76
        issue: "isInProgress depends on widget-local _onboardingStarted, not on persisted seller status. Source-of-truth inconsistency: _onboardingStarted (ephemeral) vs profile.canAcceptPaidOffers (server-backed)."
    fix: |
      1. Profile menu: change line 531 to `context.push('/seller/earnings')` so Earnings Dashboard goes
         to SellerEarningsScreen. Remove or repurpose 'Payment Methods' (line 538) — it should not
         deep-link to Stripe onboarding.
      2. In StripeOnboardScreen, derive isInProgress from a server-backed signal:
         `stripeStatus?.onboarded == true && stripeStatus?.chargesEnabled == false`. Drop the
         _onboardingStarted local boolean as the trigger for 'Continue Setup'.

  debug_session: ".planning/debug/stripe-connect-uat-bugs.md"
