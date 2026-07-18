import 'package:flutter/physics.dart';
import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

/// Spring-based page transition for GoRouter, using the locked Sorcyn animation
/// tokens (`stiffness: 320`, `damping: 32`, `mass: 1.0`) from
/// `FRONTEND_RESTYLING_PLAN.md` ("Spring-based page route transitions") and
/// the Phase 2 ROADMAP success-criterion #4.
///
/// GoRouter's `CustomTransitionPage` drives transitions by an
/// `AnimationController` + `transitionDuration`, not by `SpringSimulation`
/// directly. This file integrates a `SpringSimulation(SpringDescription(mass,
/// stiffness, damping), 0, 1, 0)` into a custom `Curve` and uses it to drive
/// a `slide + fade` `transitionsBuilder`.
///
/// Why slide + fade and not scale: the bottom-nav shell already animates its
/// active dot indicator. A scale-driven page transition on top of that adds
/// jitter; a 4%-of-height slide reads as "settled into place" without competing
/// with the nav animation. (See plan 02-01 task 1 `<action>` block.)
///
/// Plan 02-03 wires `springPage<T>(...)` into every GoRoute in `app.dart`.
class SpringPageTransition {
  SpringPageTransition._();

  /// Locked Sorcyn spring-physics tokens. Public for verification by tests
  /// and downstream code; constants are `static const` and cannot be mutated.
  static const double kStiffness = 320.0;
  static const double kDamping = 32.0;
  static const double kMass = 1.0;

  /// Total transition duration. The spring simulation at the locked tokens
  /// settles to within 1% of its target around ~360-400 ms; 420 ms gives a
  /// small safety margin so `pumpAndSettle()` does not race the simulation.
  static const Duration kTransitionDuration = Duration(milliseconds: 420);

  /// Singleton curve instance — backed by `SpringSimulation` integration.
  /// Pre-computed once at startup; safe to share across all transitions.
  static final Curve springCurve = _SpringCurve();
}

// Module-level alias so callers can use the more idiomatic constants spelling.
const double _kStiffness = SpringPageTransition.kStiffness;
const double _kDamping = SpringPageTransition.kDamping;
const double _kMass = SpringPageTransition.kMass;
const Duration _kTransitionDuration = SpringPageTransition.kTransitionDuration;

/// Builds a [CustomTransitionPage] driven by spring physics, suitable for use
/// as the `pageBuilder` of any [GoRoute].
///
/// Example:
/// ```dart
/// GoRoute(
///   path: '/profile',
///   pageBuilder: (context, state) => springPage<void>(
///     key: state.pageKey,
///     child: const ProfileScreen(),
///   ),
/// )
/// ```
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
}) {
  return CustomTransitionPage<T>(
    key: key,
    name: name,
    arguments: arguments,
    restorationId: restorationId,
    maintainState: maintainState,
    fullscreenDialog: fullscreenDialog,
    opaque: opaque,
    barrierDismissible: barrierDismissible,
    barrierColor: barrierColor,
    barrierLabel: barrierLabel,
    transitionDuration: _kTransitionDuration,
    reverseTransitionDuration: _kTransitionDuration,
    transitionsBuilder: _buildSpringTransition,
    child: child,
  );
}

Widget _buildSpringTransition(
  BuildContext context,
  Animation<double> animation,
  Animation<double> secondaryAnimation,
  Widget child,
) {
  // Drive both slide and fade via the spring curve. Reverse uses the same
  // curve so dismissals feel symmetric.
  final curved = CurvedAnimation(
    parent: animation,
    curve: SpringPageTransition.springCurve,
    reverseCurve: SpringPageTransition.springCurve,
  );

  // 4% of viewport height — subtle enough not to feel like a heavy push,
  // strong enough to read as "settling in".
  const beginOffset = Offset(0, 0.04);
  const endOffset = Offset.zero;

  return SlideTransition(
    position: Tween<Offset>(begin: beginOffset, end: endOffset).animate(curved),
    child: FadeTransition(
      opacity: Tween<double>(begin: 0.0, end: 1.0).animate(curved),
      child: child,
    ),
  );
}

/// Custom curve that integrates a [SpringSimulation] over the transition
/// duration and normalizes its output to `[0, 1]`.
///
/// Pre-samples the simulation across `_kSamples` points at construction time
/// for cheap O(1) lookup during animation. The simulation reaches ~1.0 well
/// before t=1 at the locked tokens, but normalizing on the actual final value
/// guarantees `transform(1.0) == 1.0` (clamped).
class _SpringCurve extends Curve {
  _SpringCurve() {
    final spring = SpringSimulation(
      const SpringDescription(
        mass: _kMass,
        stiffness: _kStiffness,
        damping: _kDamping,
      ),
      0, // start position
      1, // end position
      0, // initial velocity
    );

    final durationSeconds = _kTransitionDuration.inMicroseconds / 1e6;

    // Sample the simulation at evenly spaced intervals across the duration.
    for (int i = 0; i <= _kSamples; i++) {
      final t = i / _kSamples;
      final simTime = t * durationSeconds;
      _samples[i] = spring.x(simTime);
    }

    // The simulation may overshoot or settle below 1.0 mid-way; normalize so
    // the final sampled value maps cleanly to 1.0 and intermediates are
    // proportional. Use the value at t=1 as the normalization reference.
    final reference = _samples[_kSamples];
    if (reference != 0 && (reference - 1.0).abs() > 0.001) {
      for (int i = 0; i <= _kSamples; i++) {
        _samples[i] = _samples[i] / reference;
      }
    }
  }

  static const int _kSamples = 100;
  final List<double> _samples = List<double>.filled(_kSamples + 1, 0.0);

  @override
  double transformInternal(double t) {
    // Linear interpolation between pre-sampled points.
    final scaled = t * _kSamples;
    final lower = scaled.floor().clamp(0, _kSamples);
    final upper = (lower + 1).clamp(0, _kSamples);
    final frac = scaled - lower;
    final value = _samples[lower] + (_samples[upper] - _samples[lower]) * frac;
    return value.clamp(0.0, 1.0);
  }
}
