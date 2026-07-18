import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/validators.dart';

class PasswordStrengthIndicator extends StatelessWidget {
  final String password;

  const PasswordStrengthIndicator({super.key, required this.password});

  @override
  Widget build(BuildContext context) {
    final strength = Validators.passwordStrength(password);
    if (password.isEmpty) return const SizedBox.shrink();

    final color = switch (strength) {
      0 || 1 => AppColors.error,
      2 => AppColors.warning,
      3 => AppColors.primary,
      _ => AppColors.secondaryPurple,
    };

    final label = switch (strength) {
      0 || 1 => 'Weak',
      2 => 'Fair',
      3 => 'Good',
      _ => 'Strong',
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        Row(
          children: List.generate(4, (index) {
            return Expanded(
              child: Container(
                height: 4,
                margin: EdgeInsets.only(right: index < 3 ? 6 : 0),
                decoration: BoxDecoration(
                  color: index < strength ? color : AppColors.border,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            color: color,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
