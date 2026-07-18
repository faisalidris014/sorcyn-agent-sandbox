import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class GradientFab extends StatefulWidget {
  final VoidCallback? onPressed;
  final IconData icon;
  final double size;

  const GradientFab({
    super.key,
    this.onPressed,
    this.icon = Icons.add,
    this.size = 56,
  });

  @override
  State<GradientFab> createState() => _GradientFabState();
}

class _GradientFabState extends State<GradientFab> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: widget.onPressed == null
          ? null
          : (_) => setState(() => _pressed = true),
      onTapUp: widget.onPressed == null
          ? null
          : (_) {
              setState(() => _pressed = false);
              widget.onPressed?.call();
            },
      onTapCancel: widget.onPressed == null
          ? null
          : () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [AppColors.primary, AppColors.secondaryPurple],
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.45),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Icon(
            widget.icon,
            color: Colors.white,
            size: 24,
          ),
        ),
      ),
    );
  }
}
