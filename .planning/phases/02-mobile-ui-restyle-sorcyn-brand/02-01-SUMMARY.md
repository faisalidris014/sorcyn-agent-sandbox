---
phase: 02-mobile-ui-restyle-sorcyn-brand
plan: 01
subsystem: mobile/shared
tags: [flutter, animation, design-tokens, sorcyn, gorouter, foundation]
requires: []
provides:
  - mobile/lib/shared/transitions/spring_page_transition.dart
  - mobile/lib/shared/widgets/tap_scale.dart
affects: []
tech_stack_added: []
patterns_added:
  - "GoRouter CustomTransitionPage backed by SpringSimulation-derived Curve"
  - "Reusable TapScale wrapper applying locked active-scale token (0.97)"
key_files_created:
  - mobile/lib/shared/transitions/spring_page_transition.dart
  - mobile/lib/shared/widgets/tap_scale.dart
  - mobile/test/shared/transitions/spring_page_transition_test.dart
  - mobile/test/shared/widgets/tap_scale_test.dart
key_files_modified: []
decisions:
  - "Pre-sample SpringSimulation into a Curve at construction (100 samples) rather than driving an AnimationController with SpringSimulation directly — CustomTransitionPage requires a fixed transitionDuration, and a sampled curve gives O(1) lookup with the locked spring physics baked in."
  - "Slide (4% of viewport height) + fade for the page transition; no scale. Avoids visual conflict with bottom_nav_shell's existing scale animation on the active dot indicator."
  - "Locked tokens exposed as static const on SpringPageTransition (kStiffness, kDamping, kMass, kTransitionDuration) — public so tests and downstream code can verify them, immutable so consumers cannot drift."
metrics:
  duration_minutes: 18
  tasks_completed: 2
  files_created: 4
  files_modified: 0
  tests_added: 11
  commits: 4
  completed_date: 2026-04-28
---

# Phase 2 Plan 01: Foundation Animation Primitives Summary

Locked the two missing reusable animation primitives that block Phase 2 success criterion #4 (spring page transitions + tap-scale animation): a `springPage()` helper backed by `SpringSimulation(stiffness: 320, damping: 32, mass: 1.0)` and a `TapScale` widget applying the locked `pressedScale = 0.97` token over a 100ms `AnimatedScale`.

## Exported Symbols

### `mobile/lib/shared/transitions/spring_page_transition.dart`

```dart
// Function — primary public API
CustomTransitionPage<T> springPage<T>({
  LocalKey? key,
  required Widget child,
  String? name,
  Object? arguments,
  String? restorationId,
  bool maintainState = true,
  bool fullscreenDialog = false,
  bool opaque = true,
  bool barrierDismissible = false,
  Color? barrierColor,
  String? barrierLabel,
});

// Class — locked-token registry + curve singleton
class SpringPageTransition {
  static const double kStiffness = 320.0;
  static const double kDamping = 32.0;
  static const double kMass = 1.0;
  static const Duration kTransitionDuration = Duration(milliseconds: 420);
  static final Curve springCurve;
}
```

### `mobile/lib/shared/widgets/tap_scale.dart`

```dart
class TapScale extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;            // null => disabled
  final Duration duration;              // default 100ms
  final double pressedScale;            // default 0.97
  final HitTestBehavior behavior;       // default opaque

  const TapScale({
    super.key,
    required Widget child,
    VoidCallback? onTap,
    Duration duration = const Duration(milliseconds: 100),
    double pressedScale = 0.97,
    HitTestBehavior behavior = HitTestBehavior.opaque,
  });
}
```

## Implementation Choices

### Spring physics: pre-sampled custom Curve, not direct AnimationController.animateWith

Flutter's `SpringSimulation` is normally driven by `AnimationController.animateWith(simulation)`, but GoRouter's `CustomTransitionPage` only exposes a `transitionsBuilder(animation, ...)` where `animation` is a regular `Animation<double>` ticking over a fixed `transitionDuration`. To preserve the locked spring-physics feel inside that linear `[0, 1]` animation, the implementation:

1. Constructs `SpringSimulation(SpringDescription(mass: 1, stiffness: 320, damping: 32), 0, 1, 0)` once at `_SpringCurve` construction time.
2. Pre-samples it at 101 evenly spaced points over the 420ms transition window.
3. Normalizes so `transform(1.0) == 1.0` (since the simulation may overshoot or under-settle at the locked tokens).
4. Implements `transformInternal(t)` as a clamped linear interpolation between adjacent samples — O(1) lookup, no per-frame physics integration.

This gives downstream callers an animation that *feels* like a spring (settle-in deceleration shape) while remaining drop-in compatible with `CustomTransitionPage`'s linear-time animation contract. The locked tokens stay authoritative — they live in `static const` fields that the curve-builder reads and that tests assert on directly.

### Slide + fade, not scale

Both shipped Sorcyn components (`bottom_nav_shell`, `gradient_button` family) already animate scale on active state. Adding a third scale animation at the page-transition layer compounds visually as jitter on bottom-nav navigations. Replaced with a 4%-of-viewport-height vertical slide that reads as "settle into place" without competing.

### TapScale: explicit disabled-state mirror of gradient_button.dart

Reused the exact disabled pattern from `gradient_button.dart` (`isDisabled` short-circuit on `onTapDown/onTapUp/onTapCancel`) so consumer mental-model is identical: `onTap == null` ⇒ widget is dead-inert, scale stays at 1.0, no taps register, no callback runs. Tested explicitly.

## Tests Added

11 widget/unit tests across two files (target was ≥6 — exceeded):

**`test/shared/transitions/spring_page_transition_test.dart` — 5 tests**

1. `springPage` returns `CustomTransitionPage` with child unwrapped (identity).
2. `transitionDuration ≥ 350ms` (spring settle window).
3. Locked tokens — `kStiffness == 320.0`, `kDamping == 32.0`, `kMass == 1.0`.
4. `pumpAndSettle()` completes within 2s on GoRouter navigation (finite-time settle).
5. Curve starts at 0, settles to 1.0 within 5% tolerance by `t=1` (no infinite oscillation).

**`test/shared/widgets/tap_scale_test.dart` — 6 tests**

1. Builds without error around an arbitrary child.
2. `AnimatedScale.scale` reads `0.97` after tap-down (locked token).
3. Scale returns to `1.0` after tap-up.
4. Disabled state (`onTap == null`) — taps ignored, scale stays at `1.0`.
5. Default `AnimatedScale.duration == Duration(milliseconds: 100)`.
6. `onTap` fires exactly once per complete tap.

## Verification

| Check | Command | Result |
|-------|---------|--------|
| Test pass | `flutter test test/shared/transitions/ test/shared/widgets/` | 11/11 passed, no warnings |
| Lint clean | `flutter analyze lib/shared/transitions/spring_page_transition.dart lib/shared/widgets/tap_scale.dart` | "No issues found!" |
| Locked-token sanity | `grep -rn "stiffness" lib/shared/transitions/` | matches 320 only |
| Locked-token sanity | `grep -rnE "0\\.97\|pressedScale" lib/shared/widgets/tap_scale.dart` | matches 0.97 only |
| No pubspec change | `git diff mobile/pubspec.yaml` | empty |
| Existing buttons untouched | `git diff mobile/lib/shared/widgets/gradient_button.dart gradient_fab.dart social_auth_button.dart` | empty |

## Commits

| Commit | Type | Files |
|--------|------|-------|
| `cc59255` | test(02-01) | mobile/test/shared/transitions/spring_page_transition_test.dart (RED gate) |
| `83e7a8b` | feat(02-01) | mobile/lib/shared/transitions/spring_page_transition.dart (GREEN gate) |
| `f7f1306` | test(02-01) | mobile/test/shared/widgets/tap_scale_test.dart (RED gate) |
| `2809e92` | feat(02-01) | mobile/lib/shared/widgets/tap_scale.dart (GREEN gate) |

## Confirmation: Existing Components Unchanged

Per task 2's `<acceptance_criteria>`, the three shipped buttons that already embed their own tap-scale animation must remain functionally and stylistically identical (preserves Phase 2 SC #5: zero-functional-regression on shipped buttons):

- `mobile/lib/shared/widgets/gradient_button.dart` — **unchanged** (verified empty `git diff`)
- `mobile/lib/shared/widgets/gradient_fab.dart` — **unchanged** (verified empty `git diff`)
- `mobile/lib/shared/widgets/social_auth_button.dart` — **unchanged** (verified empty `git diff`)

`TapScale` is intended for ad-hoc consumers (filter chips, post cards, tappable settings rows, etc.). Refactoring the existing 3 buttons onto `TapScale` is explicitly **out of scope** for Phase 2.

## Wiring (handled by downstream plans)

`springPage()` has no callers yet. Plan 02-03 imports it from `app.dart` and wraps every `GoRoute` with `pageBuilder: (ctx, st) => springPage(key: st.pageKey, child: ...)`.

`TapScale` has no callers yet. Plans 02-02 / 02-03 / 02-04 import it where ad-hoc tappables need the locked active-scale animation.

## Deviations from Plan

None — plan executed exactly as written.

The plan's `<action>` block for Task 1 referenced `_kStiffness = 320.0` etc. as private constants. Implementation kept the underlying constants private (`_kStiffness` module-level aliases) but additionally exposed them on the public `SpringPageTransition` class as `static const` fields for verifiability — this is a strict superset of the locked-token contract (still immutable, just visible) and was needed to satisfy the test assertion `expect(SpringPageTransition.kStiffness, 320.0)`. No design intent diverged.

## Self-Check

Verifying claims before returning to orchestrator:

```bash
$ [ -f mobile/lib/shared/transitions/spring_page_transition.dart ] && echo FOUND
FOUND
$ [ -f mobile/lib/shared/widgets/tap_scale.dart ] && echo FOUND
FOUND
$ [ -f mobile/test/shared/transitions/spring_page_transition_test.dart ] && echo FOUND
FOUND
$ [ -f mobile/test/shared/widgets/tap_scale_test.dart ] && echo FOUND
FOUND
$ git log --oneline | grep -E "cc59255|83e7a8b|f7f1306|2809e92"
2809e92 feat(02-01): implement reusable TapScale wrapper for Sorcyn tap-animation
f7f1306 test(02-01): add failing test for reusable TapScale wrapper widget
83e7a8b feat(02-01): implement SpringPageTransition with locked Sorcyn tokens
cc59255 test(02-01): add failing test for SpringPageTransition GoRouter helper
```

## Self-Check: PASSED

All 4 task files created and committed. All 4 commit hashes present in `git log`. All locked Sorcyn tokens (stiffness 320, damping 32, mass 1.0, pressedScale 0.97, duration 100ms) present and immutable. Both new files compile clean under `flutter analyze`; both new test files pass under `flutter test`. The 3 shipped buttons (`gradient_button`, `gradient_fab`, `social_auth_button`) are confirmed untouched.
