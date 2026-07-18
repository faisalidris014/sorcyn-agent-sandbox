import 'package:flutter/material.dart';

import '../../../../shared/widgets/category_card.dart';
import '../../data/models/post_model.dart';

/// Builds the photo-less [CategoryCard] fallback for a [Post], pulling the
/// color (top-level family) and icon (subcategory) from its nested category
/// relations. Keeps the field-extraction logic in one place so every post
/// surface (feed, "for you", detail) renders an identical fallback.
extension PostCategoryCard on Post {
  Widget categoryCard({
    double iconSize = 44,
    bool showLabel = true,
    String? label,
    bool includeLocation = false,
  }) {
    final loc = includeLocation
        ? [locationCity, locationState].where((s) => (s ?? '').isNotEmpty).join(', ')
        : null;
    return CategoryCard(
      topLevelSlug: category?['slug'] as String?,
      iconName:
          (subcategory?['icon'] ?? category?['icon']) as String?,
      subcategorySlug: subcategory?['slug'] as String?,
      label: label ?? title,
      location: (loc != null && loc.isNotEmpty) ? loc : null,
      iconSize: iconSize,
      showLabel: showLabel,
    );
  }
}
