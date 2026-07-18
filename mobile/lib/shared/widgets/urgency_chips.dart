import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Urgency values that match the backend `posts.schemas.ts` enum.
/// Source of truth: `backend/src/modules/posts/posts.schemas.ts` urgency enum.
class UrgencyChips extends StatelessWidget {
  final String value;
  final ValueChanged<String> onChanged;

  const UrgencyChips({
    super.key,
    required this.value,
    required this.onChanged,
  });

  static const List<({String value, String label})> options = [
    (value: 'flexible', label: 'Flexible'),
    (value: 'within_1_week', label: 'This Week'),
    (value: 'within_24_hours', label: '24 Hours'),
    (value: 'asap', label: 'ASAP'),
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: options.map((o) {
        final isActive = value == o.value;
        return Expanded(
          child: GestureDetector(
            onTap: () => onChanged(o.value),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              margin: const EdgeInsets.only(right: 8),
              height: 38,
              decoration: BoxDecoration(
                color: isActive
                    ? AppColors.primary.withValues(alpha: 0.08)
                    : AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(100),
                border: Border.all(
                  color: isActive ? AppColors.primary : AppColors.border,
                  width: isActive ? 1.5 : 1,
                ),
              ),
              child: Center(
                child: Text(
                  o.label,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isActive ? AppColors.primary : AppColors.grey,
                  ),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
