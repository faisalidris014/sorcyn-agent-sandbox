import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reverse_marketplace/features/notifications/data/models/notification_model.dart';
import 'package:reverse_marketplace/features/notifications/presentation/widgets/notification_tile.dart';

// #382 PR2: the daily credential-expiry sweep emits `credential_expiring` and
// `credential_expired` notifications. Without explicit icon/color cases they fall
// through to the default bell + grey; these tests lock in the intended mapping.
AppNotification _notif(String type) => AppNotification(
      id: 'n-$type',
      type: type,
      title: 'Credential',
      message: 'Your license verification is changing.',
      read: false,
      createdAt: DateTime(2026, 7, 16),
    );

Widget _wrap(AppNotification n) => MaterialApp(
      home: Scaffold(
        body: NotificationTile(
          notification: n,
          onTap: () {},
          onDismiss: () {},
        ),
      ),
    );

void main() {
  testWidgets('credential_expiring renders the hourglass icon, not the default bell',
      (tester) async {
    await tester.pumpWidget(_wrap(_notif('credential_expiring')));

    expect(find.byIcon(Icons.hourglass_bottom), findsOneWidget);
    expect(find.byIcon(Icons.notifications_outlined), findsNothing);
  });

  testWidgets('credential_expired renders the gpp_bad icon, not the default bell',
      (tester) async {
    await tester.pumpWidget(_wrap(_notif('credential_expired')));

    expect(find.byIcon(Icons.gpp_bad_outlined), findsOneWidget);
    expect(find.byIcon(Icons.notifications_outlined), findsNothing);
  });
}
