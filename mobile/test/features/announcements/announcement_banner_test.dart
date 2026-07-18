import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:reverse_marketplace/l10n/app_localizations.dart';
import 'package:reverse_marketplace/core/theme/app_colors.dart';
import 'package:reverse_marketplace/features/announcements/data/models/announcement_model.dart';
import 'package:reverse_marketplace/features/announcements/presentation/widgets/announcement_banner.dart';

Announcement _announcement(AnnouncementSeverity severity) => Announcement(
      id: 'a-1',
      message: 'Heads up: our payment processor is degraded.',
      severity: severity,
    );

Future<void> _pumpBanner(
  WidgetTester tester, {
  required AnnouncementSeverity severity,
  required VoidCallback onDismiss,
}) async {
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: AnnouncementBanner(
          announcement: _announcement(severity),
          onDismiss: onDismiss,
        ),
      ),
    ),
  );
}

void main() {
  group('AnnouncementBanner', () {
    testWidgets('renders the message text', (tester) async {
      await _pumpBanner(
        tester,
        severity: AnnouncementSeverity.info,
        onDismiss: () {},
      );

      expect(
        find.text('Heads up: our payment processor is degraded.'),
        findsOneWidget,
      );
    });

    testWidgets('info severity uses the purple background', (tester) async {
      await _pumpBanner(
        tester,
        severity: AnnouncementSeverity.info,
        onDismiss: () {},
      );

      final material = tester.widget<Material>(
        find.ancestor(of: find.byIcon(Icons.campaign_outlined), matching: find.byType(Material)).first,
      );
      expect(material.color, AppColors.primary);
    });

    testWidgets('warning severity uses the amber background', (tester) async {
      await _pumpBanner(
        tester,
        severity: AnnouncementSeverity.warning,
        onDismiss: () {},
      );

      final material = tester.widget<Material>(
        find.ancestor(of: find.byIcon(Icons.warning_amber_rounded), matching: find.byType(Material)).first,
      );
      expect(material.color, AppColors.warning);
    });

    testWidgets('critical severity uses the red background', (tester) async {
      await _pumpBanner(
        tester,
        severity: AnnouncementSeverity.critical,
        onDismiss: () {},
      );

      final material = tester.widget<Material>(
        find.ancestor(of: find.byIcon(Icons.error_outline), matching: find.byType(Material)).first,
      );
      expect(material.color, AppColors.error);
    });

    testWidgets('renders in MaterialApp.builder (above the Navigator) without '
        'needing an Overlay', (tester) async {
      // Reproduces the real mount point: the banner lives in
      // MaterialApp.builder, ABOVE the Navigator that provides the Overlay.
      // A tooltip/IconButton here would throw "No Overlay widget found".
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: const Scaffold(body: SizedBox()),
          builder: (context, child) => Column(
            children: [
              AnnouncementBanner(
                announcement: _announcement(AnnouncementSeverity.critical),
                onDismiss: () {},
              ),
              Expanded(child: child!),
            ],
          ),
        ),
      );
      await tester.pump();

      expect(tester.takeException(), isNull);
      expect(find.byIcon(Icons.close), findsOneWidget);
    });

    testWidgets('tapping close fires onDismiss', (tester) async {
      var dismissed = false;
      await _pumpBanner(
        tester,
        severity: AnnouncementSeverity.info,
        onDismiss: () => dismissed = true,
      );

      await tester.tap(find.byIcon(Icons.close));
      await tester.pump();

      expect(dismissed, isTrue);
    });
  });

  group('AnnouncementSeverity.fromString', () {
    test('maps known values and defaults unknown to info', () {
      expect(AnnouncementSeverity.fromString('warning'), AnnouncementSeverity.warning);
      expect(AnnouncementSeverity.fromString('critical'), AnnouncementSeverity.critical);
      expect(AnnouncementSeverity.fromString('info'), AnnouncementSeverity.info);
      expect(AnnouncementSeverity.fromString('nonsense'), AnnouncementSeverity.info);
      expect(AnnouncementSeverity.fromString(null), AnnouncementSeverity.info);
    });
  });
}
