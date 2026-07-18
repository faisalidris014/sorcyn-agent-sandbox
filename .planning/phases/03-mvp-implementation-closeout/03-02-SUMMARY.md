---
phase: 03-mvp-implementation-closeout
plan: "02"
subsystem: stripe-connect-onboarding
tags: [stripe, flutter, backend, env-hardening, routing, widget-tests]
dependency_graph:
  requires: []
  provides:
    - reversemarket:// deep-link defaults for STRIPE_CONNECT_RETURN_URL and STRIPE_CONNECT_REFRESH_URL
    - production startup guard rejecting localhost FRONTEND_URL and unset STRIPE_CONNECT_RETURN_URL
    - StripeOnboardScreen lifecycle observer (WidgetsBindingObserver) refetching stripe/profile on resume
    - server-derived isInProgress replacing dropped _onboardingStarted flag
    - profile menu Earnings Dashboard correctly routes to /seller/earnings
    - Vitest tests covering backend env hardening (5 passing)
    - Flutter widget tests covering lifecycle observer + routing (3 passing)
  affects:
    - backend/src/config/env.ts
    - mobile/lib/features/sellers/presentation/screens/stripe_onboard_screen.dart
    - mobile/lib/features/profile/presentation/screens/profile_screen.dart
tech_stack:
  added: []
  patterns:
    - Zod .min(1).default(...) for non-URL scheme strings (avoids z.url() rejecting reversemarket://)
    - WidgetsBindingObserver mixin on ConsumerState for app lifecycle callbacks
    - flutter_secure_storage MethodChannel mock in widget tests to suppress MissingPluginException
    - GoRouter push stack verification via routerDelegate.currentConfiguration.matches.last.matchedLocation
key_files:
  created:
    - backend/tests/env.test.ts
    - mobile/test/features/sellers/stripe_onboard_screen_test.dart
    - mobile/test/features/profile/profile_screen_routing_test.dart
  modified:
    - backend/src/config/env.ts
    - backend/.env.example
    - mobile/lib/features/sellers/presentation/screens/stripe_onboard_screen.dart
    - mobile/lib/features/profile/presentation/screens/profile_screen.dart
decisions:
  - Used Zod z.string().min(1).default(...) instead of z.string().url().default(...) because Zod rejects custom URL schemes (reversemarket://) as invalid URLs
  - Added validateProductionEnv() as an exported function (separate from schema parse) so it can be unit-tested with Vitest without starting Fastify
  - Replaced _onboardingStarted widget flag with server-derived isInProgress (stripeStatus?.onboarded == true && chargesEnabled == false) to eliminate stale state after Stripe return
  - Stubbed flutter_secure_storage MethodChannel in profile routing test rather than subclassing MarketplaceContextNotifier, because AppModeNotifier._loadSavedMode is private and cannot be overridden from a test file
  - Verified GoRouter push navigation using matches.last.matchedLocation instead of routerDelegate.currentConfiguration.uri.path; push() adds to the stack and uri.path reflects the root, not the top entry
metrics:
  duration_minutes: 45
  completed_date: "2026-04-30"
  tasks_completed: 4
  tasks_total: 4
  files_changed: 7
requirements_addressed:
  - REQ-stripe-connect-onboarding-completion
---

# Phase 03 Plan 02: Stripe Connect Onboarding Bug Cluster Summary

Three UAT-blocking bugs fixed: backend env deep-link defaults + startup hardening (D-23/D-26), StripeOnboardScreen lifecycle observer for stale-status fix (D-24), and profile screen Earnings Dashboard routing fix (D-25). Covered by 8 passing tests.

## What Was Built

### Task 1 — Backend env hardening (D-23, D-26)

`backend/src/config/env.ts` — two changes:

1. `STRIPE_CONNECT_RETURN_URL` and `STRIPE_CONNECT_REFRESH_URL` changed from `.url().optional()` to `.string().min(1).default('reversemarket://...')`. Zod's `.url()` validator rejects custom schemes like `reversemarket://`, so `.string().min(1).default(...)` is the correct type.

2. `validateProductionEnv()` exported function added with two new hard errors (previously warnings): `STRIPE_CONNECT_RETURN_URL` empty in production exits with code 1; `FRONTEND_URL` still set to `http://localhost:8080` exits with code 1.

`backend/.env.example` — updated both Stripe URL fields from `http://localhost:8080/...` placeholders to `reversemarket://seller/stripe/complete` and `reversemarket://seller/stripe/refresh`.

`backend/tests/env.test.ts` — 5 Vitest tests: non-production skips validation, empty STRIPE_CONNECT_RETURN_URL exits(1), localhost FRONTEND_URL exits(1), valid production config passes.

### Task 2 — StripeOnboardScreen lifecycle observer (D-24)

`mobile/lib/features/sellers/presentation/screens/stripe_onboard_screen.dart`:

- `_StripeOnboardScreenState` now `with WidgetsBindingObserver`
- `initState()` adds `WidgetsBinding.instance.addObserver(this)` and calls `loadProfile()` on entry
- `dispose()` removes the observer
- `didChangeAppLifecycleState(AppLifecycleState.resumed)` refetches `loadStripeStatus()` + `loadProfile()` — this is the Stripe return handler
- Removed `bool _onboardingStarted` flag; `isInProgress` now derived from `stripeStatus?.onboarded == true && stripeStatus?.chargesEnabled == false` (server-backed state, never stale)

### Task 3 — Profile menu routing fix (D-25)

`mobile/lib/features/profile/presentation/screens/profile_screen.dart` line 531:

```dart
// Before (Bug C):
onTap: () => context.push('/seller/stripe-onboard'),

// After (fix):
onTap: () => context.push('/seller/earnings'),
```

One line change. The Earnings Dashboard menu item now routes to the correct screen.

### Task 4 — Widget tests

`mobile/test/features/sellers/stripe_onboard_screen_test.dart` — 2 tests:
1. Asserts `state isA<WidgetsBindingObserver>()` — confirms the mixin is present
2. Calls `(state as dynamic).didChangeAppLifecycleState(AppLifecycleState.resumed)` and asserts `loadStripeStatus` + `loadProfile` call counters incremented above initState baseline

`mobile/test/features/profile/profile_screen_routing_test.dart` — 1 test:
- Builds ProfileScreen inside GoRouter with all routes including `/seller/earnings` sentinel
- Overrides `authProvider` (stub seller user), `appModeProvider` (seller mode), `sellerProfileProvider` (no I/O)
- Installs `MethodChannel` mock for `flutter_secure_storage` to prevent `MissingPluginException` from `AppModeNotifier._loadSavedMode()` and `MarketplaceContextNotifier._loadSaved()`
- Scrolls to "Earnings Dashboard", taps, asserts sentinel text present + `matches.last.matchedLocation == '/seller/earnings'`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zod .url() rejects reversemarket:// scheme**
- **Found during:** Task 1
- **Issue:** Zod's built-in `.url()` validator requires standard URL schemes (http/https/ftp). `reversemarket://` is a custom deep-link scheme and would fail Zod validation at startup.
- **Fix:** Changed to `.string().min(1).default(...)` which validates presence only, not URL format.
- **Files modified:** `backend/src/config/env.ts`
- **Commit:** 1bf9054

**2. [Rule 2 - Missing critical functionality] Vitest must run from main repo**
- **Found during:** Task 1
- **Issue:** The worktree has no `node_modules/` so Vitest cannot be invoked from within the worktree directory. Test file uses absolute import path to worktree source.
- **Fix:** Test file written to `/Users/faisalidris/ReverseMarketplace/backend/tests/env.test.ts` with absolute import path; tests run from the main repo's backend directory.
- **Files modified:** `backend/tests/env.test.ts` (in main repo, not worktree)
- **Commit:** 1bf9054

**3. [Rule 1 - Bug] flutter_secure_storage MissingPluginException in profile routing test**
- **Found during:** Task 4
- **Issue:** `AppModeNotifier._loadSavedMode()` and `MarketplaceContextNotifier._loadSaved()` call `SecureStorage.read()` from their constructors. In the unit-test runner, the `flutter_secure_storage` platform channel is not registered, causing `MissingPluginException` which makes the test fail with a platform channel error.
- **Fix:** Installed a no-op `MethodChannel` mock handler for `plugins.it_expertise.com/flutter_secure_storage` in test `setUp()`. The mock returns `null` for all calls, so `_loadSavedMode()` reads `null`, the `if (saved == 'seller')` condition is false, and the provider state stays at `AppMode.seller` as set by the stub notifier constructor.
- **Files modified:** `mobile/test/features/profile/profile_screen_routing_test.dart`
- **Commit:** f4953c3

**4. [Rule 1 - Bug] GoRouter push stack path assertion**
- **Found during:** Task 4
- **Issue:** After `context.push('/seller/earnings')`, `router.routerDelegate.currentConfiguration.uri.path` returned `/profile` (the root), not `/seller/earnings`. GoRouter's `push()` adds to the navigation stack; `uri.path` reflects the entry point of the route configuration, not the topmost entry.
- **Fix:** Changed assertion to use `router.routerDelegate.currentConfiguration.matches.last.matchedLocation` which correctly returns the topmost pushed route.
- **Files modified:** `mobile/test/features/profile/profile_screen_routing_test.dart`
- **Commit:** f4953c3

## Test Results

### Backend (Vitest)
```
env.test.ts: 5 passing
```

### Flutter (widget tests)
```
stripe_onboard_screen_test.dart: 2 passing
profile_screen_routing_test.dart: 1 passing
Total: 3 passing
```

### Static analysis
```
flutter analyze test/features/sellers/stripe_onboard_screen_test.dart \
               test/features/profile/profile_screen_routing_test.dart
No issues found.
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 1bf9054 | feat | backend env defaults + production hardening (D-23, D-26) |
| b1e52a3 | feat | StripeOnboardScreen lifecycle observer + server-derived state (D-24) |
| 863e4b7 | fix | profile menu Earnings Dashboard routes to /seller/earnings (D-25) |
| f4953c3 | test | widget tests for Bug B lifecycle observer and Bug C routing |

## Known Stubs

None. All acceptance criteria are functionally implemented.

## Self-Check: PASSED

Files created/modified:
- [x] `backend/src/config/env.ts` — modified (Zod defaults + validateProductionEnv)
- [x] `backend/.env.example` — modified (reversemarket:// URLs)
- [x] `backend/tests/env.test.ts` — created in main repo (5 tests passing)
- [x] `mobile/lib/features/sellers/presentation/screens/stripe_onboard_screen.dart` — modified (WidgetsBindingObserver, isInProgress)
- [x] `mobile/lib/features/profile/presentation/screens/profile_screen.dart` — modified (route fix)
- [x] `mobile/test/features/sellers/stripe_onboard_screen_test.dart` — created (2 tests)
- [x] `mobile/test/features/profile/profile_screen_routing_test.dart` — created (1 test)

Commits verified:
- [x] 1bf9054 — backend env
- [x] b1e52a3 — stripe onboard screen
- [x] 863e4b7 — profile routing fix
- [x] f4953c3 — widget tests
