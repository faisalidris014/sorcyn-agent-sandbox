import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class SectionCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;

  const SectionCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin ?? const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppColors.subtleBorder,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: padding != null
            ? Padding(padding: padding!, child: child)
            : child,
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? accent;
  final Color? iconBackground;
  final Color? iconColor;

  const SectionHeader({
    super.key,
    required this.icon,
    required this.title,
    this.accent,
    this.iconBackground,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: iconBackground ??
                  AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(
              icon,
              size: 15,
              color: iconColor ?? AppColors.primary,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: AppColors.black,
                letterSpacing: -0.01,
              ),
            ),
          ),
          if (accent != null)
            Text(
              accent!,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
        ],
      ),
    );
  }
}
