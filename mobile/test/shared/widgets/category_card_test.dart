import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:reverse_marketplace/shared/widgets/category_card.dart';

void main() {
  Future<void> pumpCard(WidgetTester tester, CategoryCard card) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(width: 200, height: 200, child: card),
        ),
      ),
    );
    await tester.pump();
  }

  group('categoryColorFor', () {
    test('maps each top-level family to its locked palette', () {
      expect(categoryColorFor('products').fg, const Color(0xFF6D28D9));
      expect(categoryColorFor('products').bg, const Color(0xFFEFE9FF));
      expect(categoryColorFor('services').fg, const Color(0xFF0E9384));
      expect(categoryColorFor('jobs').fg, const Color(0xFFB45309));
    });

    test('unknown / null slug falls back to the default surface tint', () {
      final fallback = categoryColorFor('nope');
      final nullSlug = categoryColorFor(null);
      expect(fallback.bg, nullSlug.bg);
      // Default fg is the brand primary, distinct from any family fg.
      expect(fallback.fg, isNot(const Color(0xFF6D28D9)));
    });
  });

  group('categoryIconFor', () {
    test('resolves the backend icon-name string first', () {
      expect(
        categoryIconFor(iconName: 'plumbing', subcategorySlug: 'plumbing'),
        Icons.plumbing,
      );
      expect(categoryIconFor(iconName: 'devices'), Icons.devices);
    });

    test('falls back to subcategory slug, then family, then default', () {
      // No icon-name, but slug matches an entry.
      expect(categoryIconFor(subcategorySlug: 'plumbing'), Icons.plumbing);
      // Nothing matches a sub, fall to the family icon name.
      expect(
        categoryIconFor(topLevelSlug: 'products', iconName: 'shopping_bag'),
        Icons.shopping_bag,
      );
      // Nothing resolves -> default.
      expect(categoryIconFor(iconName: 'totally_unknown'), Icons.category);
      expect(categoryIconFor(), Icons.category);
    });

    test('every seeded icon-name resolves to a non-default icon', () {
      // Mirrors backend/prisma/seed-categories.ts icon values.
      const seededIconNames = <String>[
        // top-level
        'shopping_bag', 'build', 'work', 'inventory', 'home',
        // products
        'devices', 'chair', 'directions_car', 'kitchen', 'checkroom',
        'sports', 'handyman', 'category',
        // services
        'plumbing', 'electrical_services', 'ac_unit', 'cleaning_services',
        'yard', 'format_paint', 'roofing', 'local_shipping', 'pest_control',
        'car_repair', 'child_care', 'pets', 'school', 'fitness_center',
        'camera_alt', 'event', 'miscellaneous_services',
        // jobs
        'construction', 'business_center', 'supervisor_account', 'schedule',
        'assignment', 'work_outline',
      ];
      for (final name in seededIconNames) {
        // 'category' legitimately maps to Icons.category; skip that one.
        if (name == 'category') continue;
        expect(
          categoryIconFor(iconName: name),
          isNot(Icons.category),
          reason: 'Seed icon "$name" must map to a real icon, not the default.',
        );
      }
    });
  });

  group('CategoryCard widget', () {
    testWidgets('renders the family color, subcategory icon, and title',
        (tester) async {
      await pumpCard(
        tester,
        const CategoryCard(
          topLevelSlug: 'services',
          iconName: 'plumbing',
          subcategorySlug: 'plumbing',
          label: 'Fix my leaky faucet',
        ),
      );

      expect(find.text('Fix my leaky faucet'), findsOneWidget);
      expect(find.byIcon(Icons.plumbing), findsOneWidget);

      final container = tester.widget<Container>(
        find.descendant(
          of: find.byType(CategoryCard),
          matching: find.byType(Container),
        ),
      );
      expect(container.color, const Color(0xFFE6F4F1));
    });

    testWidgets('empty label renders the "Listing" placeholder', (tester) async {
      await pumpCard(
        tester,
        const CategoryCard(topLevelSlug: 'products', label: '   '),
      );
      expect(find.text('Listing'), findsOneWidget);
    });

    testWidgets('showLabel: false hides the title (compact thumbnail)',
        (tester) async {
      await pumpCard(
        tester,
        const CategoryCard(
          topLevelSlug: 'products',
          iconName: 'devices',
          label: 'Gaming laptop',
          showLabel: false,
        ),
      );
      expect(find.text('Gaming laptop'), findsNothing);
      expect(find.byIcon(Icons.devices), findsOneWidget);
    });

    testWidgets('renders the optional location line when provided',
        (tester) async {
      await pumpCard(
        tester,
        const CategoryCard(
          topLevelSlug: 'jobs',
          iconName: 'business_center',
          label: 'Bookkeeper needed',
          location: 'Dallas, TX',
        ),
      );
      expect(find.text('Dallas, TX'), findsOneWidget);
    });
  });
}
