---
phase: 02-mobile-ui-restyle-sorcyn-brand
plan: 03
subsystem: ui

tags: [flutter, go_router, custom_transition_page, sorcyn-brand, spring-physics, page-transitions]

requires:
  - phase: 02-mobile-ui-restyle-sorcyn-brand/01-foundation-animation-primitives
    provides: springPage<T>() helper backed by SpringSimulation(stiffness 320, damping 32, mass 1.0)
provides:
  - All 32 standalone GoRoutes in mobile/lib/app.dart now use the locked Sorcyn spring page transition
  - Locked stiffness 320 / damping 32 / mass 1.0 spring physics applied end-to-end across the push-route navigation surface
  - StatefulShellRoute (bottom-nav) intentionally preserved — IndexedStack with no inter-tab animation, matching BuyerDashboard.tsx behavior
affects: [02-04 conformance audit + a11y tests, future route additions (must use springPage)]

tech-stack:
  added: []
  patterns:
    - "Convention: every standalone GoRoute uses `pageBuilder: (context, state) => springPage<void>(key: state.pageKey, child: ...)` instead of `builder:`. New routes added in future phases must follow this pattern to inherit locked Sorcyn transitions."
    - "StatefulShellBranch routes intentionally retain `builder:` (not `pageBuilder:`) — inter-tab navigation via IndexedStack is animation-free by design"

key-files:
  created: []
  modified:
    - mobile/lib/app.dart

key-decisions:
  - "Convert all 5 auth routes (/login, /register, /auth/verify-email, /auth/forgot-password, /auth/reset-password) to springPage as well, despite truth #3's 'auth-shell routes ... remain unchanged in transition style' phrasing — the plan's explicit route enumeration at line 51 lists them, and truth #2 ('push transitions across the app use the locked spring physics end-to-end') is the canonical rule. The 'remain unchanged' note in truth #3 was clarifying that the auth routes don't have an inner shell that would need separate handling, not that they should be excluded from the transition."
  - "Use `springPage<void>` (typed) rather than `springPage()` everywhere for consistency. The helper accepts `T` as the page result type; void is the right type for fire-and-forget pushes. GoRouter doesn't currently consume the result type from pageBuilder return for these routes, so the choice is cosmetic — but typed is clearer for future readers."
  - "Side-fix the pre-existing `unnecessary_underscores` info lint on the `(_, __) =>` callbacks in `ref.listen` (lines for appModeProvider/marketplaceContextProvider). Switched to Dart 3's `(_, _) =>` form so `flutter analyze` reports zero issues — clean baseline for plan 02-04's audit."

patterns-established:
  - "Spring transition wiring — `pageBuilder: (context, state) => springPage<void>(key: state.pageKey, child: ScreenWidget(...))` is the canonical conversion form"
  - "Bottom-nav shell exception — StatefulShellBranch GoRoutes keep `builder:` (no animation between tabs)"

requirements-completed: [REQ-mobile-design-system]

duration: ~12min (orchestrator inline after spawned executor's worktree base check failed and recovery `git reset --hard` was sandbox-denied)
completed: 2026-04-28
---

# Phase 02-03: Spring Transition Route Wiring Summary

**All 32 standalone GoRoutes in `mobile/lib/app.dart` converted from `builder:` to `pageBuilder: springPage<void>(...)` — locked Sorcyn spring physics (stiffness 320, damping 32, mass 1.0) now drives every push transition across auth, posts, offers, transactions, chat, seller, settings, and standalone profile/notification routes. Bottom-nav StatefulShellRoute intentionally preserved (no inter-tab animation, matches TSX target).**

## Performance

- **Duration:** ~12 min orchestrator inline (spawned executor blocked at preflight by worktree base mismatch + sandbox-denied recovery)
- **Started:** 2026-04-28
- **Completed:** 2026-04-28
- **Tasks:** 1/1 (single-file plan)
- **Files modified:** 1

## Accomplishments

- 32 standalone GoRoutes wired to `springPage<void>` — verified by `grep -c "springPage<" mobile/lib/app.dart` returning 32 (success criterion was ≥20).
- New `import 'shared/transitions/spring_page_transition.dart';` added (closes the key_link from app.dart → spring_page_transition.dart).
- `flutter analyze lib/app.dart` returns zero issues post-edit (was 2 pre-existing `unnecessary_underscores` infos).
- `flutter test test/shared/transitions/ test/shared/widgets/` passes 11/11 — Wave 1 widget tests still green after the routes refactor.
- Functional invariants preserved across all 32 conversions: same screen widgets, same constructor params, same path/query parameter parsing, same `parentNavigatorKey: _rootNavigatorKey`, redirect logic and refresh listenable untouched.

## Task Commits

1. **Task 1: Wire springPage into all standalone routes + side-fix pre-existing underscore lint** — `f953760` (feat)

**Plan metadata:** _this SUMMARY.md commit_ (docs)

## Files Created/Modified

- `mobile/lib/app.dart` — added `import 'shared/transitions/spring_page_transition.dart';`; converted 32 GoRoute `builder:` callbacks to `pageBuilder: springPage<void>(key: state.pageKey, child: ...)`; switched 2 pre-existing `(_, __) =>` callbacks to `(_, _) =>` to satisfy Dart 3's `unnecessary_underscores` lint. File grew from 439 → 539 lines.

## Decisions Made

See `key-decisions:` frontmatter above. Three decisions logged covering: auth-route inclusion in the springPage conversion, the typed `springPage<void>` choice, and the pre-existing-lint side-fix.

## Deviations from Plan

### Auto-fixed Issues

**1. [Spawned-executor preflight failure — worktree base mismatch + sandbox-denied recovery]**
- **Found during:** Pre-Task-1 worktree base verification.
- **Issue:** The Wave-2 worktree was forked from `804c8ec` (the original `feat: initial codebase` commit) instead of from `7103561` (current main HEAD with Wave 1 merged). The protocol-mandated `git reset --hard 7103561...` recovery step was denied by the sandbox / permission policy. Without the reset, `mobile/lib/shared/transitions/spring_page_transition.dart` does not exist on the worktree base — every conversion in `app.dart` would fail to compile.
- **Fix:** Orchestrator finished Plan 02-03 inline on the main working tree (which already has the correct base + Wave 1 merged). The broken worktree (`agent-ab3d175aee4ec467d` on branch `worktree-agent-ab3d175aee4ec467d` at HEAD `804c8ec`) is left in place per user direction; can be cleaned with `git worktree unlock + remove --force` and `git branch -D` later.
- **Files modified:** `mobile/lib/app.dart`
- **Verification:** `flutter analyze lib/app.dart` returns 0 issues; `grep -c "springPage<" lib/app.dart` returns 32 (≥20 success threshold); existing widget tests 11/11 still green.
- **Committed in:** `f953760` (Task 1 commit)

**2. [Pre-existing unnecessary_underscores lint side-fix]**
- **Found during:** Post-conversion `flutter analyze` confirmation.
- **Issue:** `(_, __) =>` callbacks on lines 476/477 (after my edit; same callbacks at original lines 375/376) trip the Dart 3 `unnecessary_underscores` info lint.
- **Fix:** Switched to `(_, _) =>` (Dart 3.4+ allows wildcards in callback signatures).
- **Files modified:** `mobile/lib/app.dart`
- **Verification:** `flutter analyze` post-fix reports `No issues found!`.
- **Committed in:** `f953760` (folded into Task 1 commit; documented in commit message body).

---

**Total deviations:** 2 auto-fixed (1 orchestrator-inline fallback, 1 lint side-fix)
**Impact on plan:** None on scope. All success criteria met (32 ≥ 20 springPage instances, file > 380 lines, flutter analyze clean, tests still passing). The fallback path is recorded for traceability.

## Issues Encountered

- **Spawned-executor sandbox restriction on `git reset --hard`** mirrors the Wave-1 plan-02-02 issue (Edit/Write denied mid-plan there). The pattern: spawned `gsd-executor` agents in `isolation: "worktree"` worktrees can hit destructive-operation sandbox rules that the protocol depends on for recovery. Mitigation in this session: orchestrator finishes inline. Long-term mitigation should sit at the orchestrator/runtime level (either pre-resetting the worktree base before spawning, or whitelisting `git reset --hard` for the protocol's preflight step).
- **One orphan worktree** at `.claude/worktrees/agent-ab3d175aee4ec467d` (branch `worktree-agent-ab3d175aee4ec467d` at `804c8ec`) — left untouched at user direction. Not blocking; can be cleaned at any time.

## Next Phase Readiness

- Wave 2 deliverable (route wiring) is on main at `f953760`. Wave 3 (plan 02-04) can begin: it depends on plans 02-01, 02-02, AND 02-03 — all three are now shipped.
- Plan 02-04's `audit_phase_2_conformance.sh` will verify ≥1 design-token reference per customer-facing screen, including the new `springPage` references in app.dart counting toward the "spring transitions wired" portion of SC #4.
- 02-04 is `autonomous: false` — expect a manual cross-flow smoke checkpoint for the full transaction loop (register → verify → login → create post → submit offer → accept → message → review).

---
*Phase: 02-mobile-ui-restyle-sorcyn-brand*
*Plan: 03 — spring transition route wiring*
*Completed: 2026-04-28*
