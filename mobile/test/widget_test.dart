import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:reverse_marketplace/app.dart';
import 'package:reverse_marketplace/features/announcements/data/models/announcement_model.dart';
import 'package:reverse_marketplace/features/announcements/data/repositories/announcement_repository.dart';
import 'package:reverse_marketplace/features/announcements/providers/announcement_provider.dart';

/// The announcement banner polls a public endpoint the moment the app mounts
/// (before auth), so the boot test must stub it out — a live Dio call would
/// leave a pending request timer when the widget tree is torn down.
class _NoopAnnouncementRepository extends AnnouncementRepository {
  @override
  Future<List<Announcement>> getActive() async => const [];
}

void main() {
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  testWidgets('App boots without throwing and mounts the router scaffold',
      (WidgetTester tester) async {
    // App.builder swaps ErrorWidget.builder globally for production-friendly
    // error rendering; the test binding's `_verifyErrorWidgetBuilderUnset`
    // check runs before tearDowns, so we must snapshot + restore inside the
    // test body itself.
    final originalErrorBuilder = ErrorWidget.builder;

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          announcementRepositoryProvider
              .overrideWithValue(_NoopAnnouncementRepository()),
        ],
        child: const App(),
      ),
    );
    // Don't pumpAndSettle — auth bootstrap, socket reconnect, and locale
    // resolution all queue background work that never fully settles in the
    // test binding. A single pump is enough to verify the app graph mounts.
    await tester.pump();

    expect(tester.takeException(), isNull,
        reason: 'App must boot without throwing');
    expect(find.byType(MaterialApp), findsOneWidget,
        reason: 'App mounts MaterialApp.router');

    // Restore the global error builder before the framework's invariant
    // check fires (it runs immediately after the test body returns).
    ErrorWidget.builder = originalErrorBuilder;
  });
}
