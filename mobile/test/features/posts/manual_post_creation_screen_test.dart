import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:reverse_marketplace/features/categories/data/models/category_model.dart';
import 'package:reverse_marketplace/features/categories/providers/category_provider.dart';
import 'package:reverse_marketplace/features/posts/presentation/screens/manual_post_creation_screen.dart';

Widget _buildSubject(List<CategoryTreeNode> categories) {
  return ProviderScope(
    overrides: [
      categoryTreeProvider.overrideWith((ref) async => categories),
    ],
    child: const MaterialApp(home: ManualPostCreationScreen()),
  );
}

// _FieldLabel renders as RichText; find.text() does not match RichText.
Finder _findFieldLabel(String text) => find.byWidgetPredicate(
      (w) => w is RichText && w.text.toPlainText().startsWith(text),
    );

void main() {
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
    // MarketplaceContextNotifier._loadSaved() calls flutter_secure_storage via
    // a platform channel. Mock it to return null so tests stay host-only.
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
      const MethodChannel('plugins.it_nomads.com/flutter_secure_storage'),
      (_) async => null,
    );
  });

  final jobsNode = CategoryTreeNode(
    id: 'test-jobs-id',
    slug: 'jobs',
    name: 'Jobs',
    enabledInMvp: true,
  );

  final servicesNode = CategoryTreeNode(
    id: 'test-services-id',
    slug: 'services',
    name: 'Services',
    enabledInMvp: true,
  );

  testWidgets('shows Budget label when no category is selected', (tester) async {
    await tester.pumpWidget(_buildSubject(const []));
    await tester.pumpAndSettle();

    expect(_findFieldLabel('Budget'), findsOneWidget);
    expect(_findFieldLabel('Salary'), findsNothing);
  });

  testWidgets('shows Salary label after selecting the Jobs category',
      (tester) async {
    await tester.pumpWidget(_buildSubject([jobsNode]));
    await tester.pumpAndSettle();

    // Open the category picker
    await tester.tap(find.text('Select category'));
    await tester.pumpAndSettle();

    // Jobs has no children → tapping it pops immediately with a result
    await tester.tap(find.widgetWithText(ListTile, 'Jobs'));
    await tester.pumpAndSettle();

    expect(_findFieldLabel('Salary'), findsOneWidget);
    expect(_findFieldLabel('Budget'), findsNothing);
  });

  testWidgets('reverts to Budget label when switching away from Jobs category',
      (tester) async {
    await tester.pumpWidget(_buildSubject([jobsNode, servicesNode]));
    await tester.pumpAndSettle();

    // Select Jobs → Salary
    await tester.tap(find.text('Select category'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ListTile, 'Jobs'));
    await tester.pumpAndSettle();
    expect(_findFieldLabel('Salary'), findsOneWidget);

    // Re-open picker (category display now shows "Jobs") and select Services
    await tester.tap(find.text('Jobs'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ListTile, 'Services'));
    await tester.pumpAndSettle();

    expect(_findFieldLabel('Budget'), findsOneWidget);
    expect(_findFieldLabel('Salary'), findsNothing);
  });

  testWidgets('salary toggle is hidden for non-Jobs categories', (tester) async {
    await tester.pumpWidget(_buildSubject(const []));
    await tester.pumpAndSettle();

    expect(find.byType(SegmentedButton<String>), findsNothing);
  });

  testWidgets('salary toggle appears and defaults to Hourly after Jobs selected',
      (tester) async {
    await tester.pumpWidget(_buildSubject([jobsNode]));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Select category'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ListTile, 'Jobs'));
    await tester.pumpAndSettle();

    expect(find.byType(SegmentedButton<String>), findsOneWidget);
    expect(find.text('Hourly'), findsOneWidget);
    expect(find.text('Yearly'), findsOneWidget);

    // Hourly is selected by default — hints show the base figure and the
    // unit is rendered as a separate /hr suffix on both Min and Max fields.
    expect(find.text('\$20'), findsOneWidget);
    expect(find.text('\$60'), findsOneWidget);
    expect(find.text('/hr'), findsNWidgets(2));
  });

  testWidgets('switching to Yearly updates hint text to annual figures',
      (tester) async {
    await tester.pumpWidget(_buildSubject([jobsNode]));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Select category'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ListTile, 'Jobs'));
    await tester.pumpAndSettle();

    // Toggle sits below the fold on the 800×600 test surface — scroll it in.
    await tester.ensureVisible(find.text('Yearly'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Yearly'));
    await tester.pumpAndSettle();

    expect(find.text('\$40,000'), findsOneWidget);
    expect(find.text('\$120,000'), findsOneWidget);
    expect(find.text('/yr'), findsNWidgets(2));
    expect(find.text('/hr'), findsNothing);
  });

  testWidgets('toggle resets to Hourly when category changes away from Jobs',
      (tester) async {
    await tester.pumpWidget(_buildSubject([jobsNode, servicesNode]));
    await tester.pumpAndSettle();

    // Select Jobs, scroll toggle into view, switch to Yearly
    await tester.tap(find.text('Select category'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ListTile, 'Jobs'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Yearly'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Yearly'));
    await tester.pumpAndSettle();
    expect(find.text('\$40,000'), findsOneWidget);

    // Scroll category display back into view before tapping it
    await tester.ensureVisible(find.text('Jobs'));
    await tester.pumpAndSettle();

    // Switch to Services → toggle hidden
    await tester.tap(find.text('Jobs'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ListTile, 'Services'));
    await tester.pumpAndSettle();
    expect(find.byType(SegmentedButton<String>), findsNothing);

    // Re-select Jobs → toggle resets to Hourly
    await tester.tap(find.text('Services'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ListTile, 'Jobs'));
    await tester.pumpAndSettle();
    expect(find.text('\$20'), findsOneWidget);
    expect(find.text('/hr'), findsNWidgets(2));
    expect(find.text('\$40,000'), findsNothing);
  });
}
