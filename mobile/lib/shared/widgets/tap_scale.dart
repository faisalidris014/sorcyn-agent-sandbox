import 'package:flutter/material.dart';

/// Reusable tap-scale wrapper that applies the locked Sorcyn
/// `active:scale-[0.97]` token (per ROADMAP Phase 2 SC #4 +
/// `FRONTEND_RESTYLING_PLAN.md` "Active states").
///
/// Wrap any tappable widget that is **not** already
/// `gradient_button` / `gradient_fab` / `social_auth_button` (those embed the
/// same animation internally — keep them untouched to preserve SC #5
/// zero-functional-regression on shipped buttons).
///
/// Typical consumers: filter chips, post cards, conversation tiles, settings
/// rows, avatar buttons, FAB-adjacent icons.
///
/// Behavior:
/// - On `onTapDown`: scale animates to [pressedScale] over [duration].
/// - On `onTapUp` / `onTapCancel`: scale animates back to 1.0 over [duration].
/// - On `onTapUp`: [onTap] is invoked once.
/// - When [onTap] is `null`: the widget is disabled — taps do not register
///   and scale stays at 1.0 throughout. Mirrors the disabled-state pattern
///   used in `gradient_button.dart`.
class TapScale extends StatefulWidget {
  /// The child widget that will be scaled on tap.
  final Widget child;

  /// Tap callback. When `null`, the widget is disabled and renders inert.
  final VoidCallback? onTap;

  /// How long the scale animation takes in each direction.
  /// Default `100ms` — matches the locked Sorcyn token used by
  /// `gradient_button.dart` and the other shipped Sorcyn buttons.
  final Duration duration;

  /// Scale to animate to while pressed. Default `0.97` — locked Sorcyn token
  /// from the design contract; do not pass other values without an ADR.
  final double pressedScale;

  /// Hit-test behavior of the underlying [GestureDetector]. Default
  /// [HitTestBehavior.opaque] so transparent regions still receive taps.
  final HitTestBehavior behavior;

  const TapScale({
    super.key,
    required this.child,
    this.onTap,
    this.duration = const Duration(milliseconds: 100),
    this.pressedScale = 0.97,
    this.behavior = HitTestBehavior.opaque,
  });

  @override
  State<TapScale> createState() => _TapScaleState();
}

class _TapScaleState extends State<TapScale> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (_pressed == value) return;
    setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final disabled = widget.onTap == null;

    return GestureDetector(
      behavior: widget.behavior,
      onTapDown: disabled ? null : (_) => _setPressed(true),
      onTapUp: disabled
          ? null
          : (_) {
              _setPressed(false);
              widget.onTap?.call();
            },
      onTapCancel: disabled ? null : () => _setPressed(false),
      child: AnimatedScale(
        scale: _pressed ? widget.pressedScale : 1.0,
        duration: widget.duration,
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}
