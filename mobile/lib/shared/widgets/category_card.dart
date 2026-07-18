import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Generated **category card** fallback for posts that have no uploaded photo.
///
/// Sorcyn never pulls product images from a third-party API — every photo is
/// user-uploaded (epic #310). When there is nothing to show, we render this
/// composed widget instead of a blank or broken image slot: a category-family
/// background tint + a subcategory icon + the item/service title.
///
/// Granularity (epic #310 open question 3): **color by top-level family**
/// (Products / Services / Jobs) so users learn the family at a glance, and
/// **icon by subcategory** for specificity.
///
/// Params are primitives (not the `Post` model) so this widget stays in
/// `shared/` with no feature dependency and is trivially unit-testable. Callers
/// extract the fields from their post, e.g.:
/// ```dart
/// CategoryCard(
///   topLevelSlug: post.category?['slug'] as String?,
///   iconName: (post.subcategory?['icon'] ?? post.category?['icon']) as String?,
///   subcategorySlug: post.subcategory?['slug'] as String?,
///   label: post.title,
/// )
/// ```
class CategoryCard extends StatelessWidget {
  /// Top-level category slug (`products` / `services` / `jobs` / …). Drives the
  /// background + foreground **color**.
  final String? topLevelSlug;

  /// Backend `Category.icon` name string (e.g. `plumbing`, `devices`). Preferred
  /// source for the **icon**; falls back to [subcategorySlug] then [topLevelSlug].
  final String? iconName;

  /// Subcategory slug, used to resolve the icon when [iconName] is missing.
  final String? subcategorySlug;

  /// The post title (shown when [showLabel] is true).
  final String label;

  /// Optional location line rendered under the label.
  final String? location;

  /// Icon size. Callers shrink this for compact thumbnails.
  final double iconSize;

  /// Whether to render the [label] (and [location]). Small thumbnails that
  /// already show the title elsewhere can hide it.
  final bool showLabel;

  const CategoryCard({
    super.key,
    required this.topLevelSlug,
    required this.label,
    this.iconName,
    this.subcategorySlug,
    this.location,
    this.iconSize = 44,
    this.showLabel = true,
  });

  @override
  Widget build(BuildContext context) {
    final visual = categoryColorFor(topLevelSlug);
    final icon = categoryIconFor(
      iconName: iconName,
      subcategorySlug: subcategorySlug,
      topLevelSlug: topLevelSlug,
    );
    final text = label.trim().isNotEmpty ? label.trim() : 'Listing';

    return Container(
      width: double.infinity,
      height: double.infinity,
      color: visual.bg,
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: iconSize, color: visual.fg),
          if (showLabel) ...[
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                text,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: visual.fg,
                ),
              ),
            ),
            if (location != null && location!.trim().isNotEmpty) ...[
              const SizedBox(height: 2),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                  location!.trim(),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: visual.fg.withValues(alpha: 0.75),
                  ),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }
}

/// A resolved category-card color pair: soft [bg] tint + [fg] icon/text color.
class CategoryVisual {
  final Color bg;
  final Color fg;
  const CategoryVisual({required this.bg, required this.fg});
}

/// Deterministic **top-level family → color** map. Palette matches the original
/// Discover-grid fallback so nothing shifts visually for existing screens.
CategoryVisual categoryColorFor(String? topLevelSlug) {
  switch (topLevelSlug) {
    case 'products':
      return const CategoryVisual(
        bg: Color(0xFFEFE9FF), // soft purple
        fg: Color(0xFF6D28D9),
      );
    case 'services':
      return const CategoryVisual(
        bg: Color(0xFFE6F4F1), // soft teal
        fg: Color(0xFF0E9384),
      );
    case 'jobs':
      return const CategoryVisual(
        bg: Color(0xFFFFF3E0), // soft amber
        fg: Color(0xFFB45309),
      );
    case 'inventory_wholesale':
      return const CategoryVisual(
        bg: Color(0xFFEAF1FB), // soft blue
        fg: Color(0xFF1D4ED8),
      );
    case 'real_estate':
      return const CategoryVisual(
        bg: Color(0xFFFDEBF0), // soft rose
        fg: Color(0xFFBE185D),
      );
    default:
      return const CategoryVisual(
        bg: AppColors.surfaceVariant,
        fg: AppColors.primary,
      );
  }
}

/// Deterministic **category → icon** resolution. Tries the backend
/// `Category.icon` name string first (covers every slug seeded in
/// `backend/prisma/seed-categories.ts`), then the subcategory slug, then the
/// top-level family, and finally [Icons.category].
IconData categoryIconFor({
  String? iconName,
  String? subcategorySlug,
  String? topLevelSlug,
}) {
  return _iconByName[iconName] ??
      _iconByName[subcategorySlug] ??
      _iconByName[topLevelSlug] ??
      Icons.category;
}

/// Maps the backend icon-name strings (and, conveniently, the slugs that share
/// those names) to Material [IconData]. Keep in sync with the `icon` values in
/// `backend/prisma/seed-categories.ts`.
const Map<String, IconData> _iconByName = {
  // ── Top-level families ──
  'shopping_bag': Icons.shopping_bag,
  'build': Icons.build,
  'work': Icons.work,
  'inventory': Icons.inventory,
  'home': Icons.home,

  // ── Products subcategories ──
  'devices': Icons.devices,
  'chair': Icons.chair,
  'directions_car': Icons.directions_car,
  'kitchen': Icons.kitchen,
  'checkroom': Icons.checkroom,
  'sports': Icons.sports,
  'category': Icons.category,

  // ── Services subcategories ──
  'plumbing': Icons.plumbing,
  'electrical_services': Icons.electrical_services,
  'ac_unit': Icons.ac_unit,
  'cleaning_services': Icons.cleaning_services,
  'yard': Icons.yard,
  'water_drop': Icons.water_drop,
  'grass': Icons.grass,
  'format_paint': Icons.format_paint,
  'roofing': Icons.roofing,
  'local_shipping': Icons.local_shipping,
  'pest_control': Icons.pest_control,
  'handyman': Icons.handyman,
  'car_repair': Icons.car_repair,
  'child_care': Icons.child_care,
  'pets': Icons.pets,
  'school': Icons.school,
  'fitness_center': Icons.fitness_center,
  'camera_alt': Icons.camera_alt,
  'event': Icons.event,
  'miscellaneous_services': Icons.miscellaneous_services,

  // ── Jobs subcategories ──
  'construction': Icons.construction,
  'business_center': Icons.business_center,
  'supervisor_account': Icons.supervisor_account,
  'schedule': Icons.schedule,
  'assignment': Icons.assignment,
  'work_outline': Icons.work_outline,

  // ── Extra names referenced elsewhere in the app (category_picker) ──
  'carpenter': Icons.carpenter,
  'home_repair_service': Icons.home_repair_service,
  'computer': Icons.computer,
  'brush': Icons.brush,
  'engineering': Icons.engineering,
  'medical_services': Icons.medical_services,
  'restaurant': Icons.restaurant,
};
