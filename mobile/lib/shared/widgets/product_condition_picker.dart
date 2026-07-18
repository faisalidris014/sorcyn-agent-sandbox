import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Condition values that match the backend `productCategorySpecificSchema`
/// in `backend/src/modules/posts/posts.schemas.ts`. Required for any post
/// whose category is under the "products" tree.
class ProductConditionPicker extends StatelessWidget {
  final String? value;
  final ValueChanged<String> onChanged;

  const ProductConditionPicker({
    super.key,
    required this.value,
    required this.onChanged,
  });

  static const List<({String value, String label})> options = [
    (value: 'new', label: 'New'),
    (value: 'like_new', label: 'Like New'),
    (value: 'excellent', label: 'Excellent'),
    (value: 'good', label: 'Good'),
    (value: 'fair', label: 'Fair'),
    (value: 'poor', label: 'Poor'),
  ];

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: options.map((o) {
        final isActive = value == o.value;
        return GestureDetector(
          onTap: () => onChanged(o.value),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
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
            child: Text(
              o.label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isActive ? AppColors.primary : AppColors.grey,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
