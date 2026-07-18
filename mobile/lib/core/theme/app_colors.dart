import 'package:flutter/material.dart';

class AppColors {
  // Primary Purple
  static const Color primary = Color(0xFF7C3AED);
  static const Color primaryDark = Color(0xFF6D28D9);
  static const Color primaryLight = Color(0xFF8B5CF6);
  static const Color primarySurface = Color(0xFFF5F3FF);

  // Neutrals
  static const Color white = Colors.white;
  static const Color black = Color(0xFF1F2937);
  static const Color grey = Color(0xFF6B7280);
  static const Color greyLight = Color(0xFFF3F4F6);
  static const Color greyMedium = Color(0xFF9CA3AF);
  static const Color border = Color(0xFFE5E7EB);

  // Status
  static const Color success = Color(0xFF10B981);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  // Secondary Purple (gradient end)
  static const Color secondaryPurple = Color(0xFFA855F7);

  // Backgrounds
  static const Color background = Colors.white;
  static const Color surface = Colors.white;
  static const Color surfaceVariant = Color(0xFFF9FAFB);

  // Subtle borders (cards)
  static const Color subtleBorder = Color(0xFFF0F0F0);

  // Input focused background (rgba(124,58,237,0.03))
  static const Color inputFocusedBg = Color(0x087C3AED);

  // Button shadow color
  static const Color primaryShadow = Color(0x597C3AED); // ~35% opacity

  // Gradient
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, secondaryPurple],
  );

  AppColors._();
}
