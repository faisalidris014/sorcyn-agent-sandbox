import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:reverse_marketplace/features/auth/data/repositories/auth_repository.dart';
import 'package:reverse_marketplace/features/auth/presentation/screens/register_screen.dart';
import 'package:reverse_marketplace/features/auth/providers/auth_provider.dart';

/// Returns logged-out immediately so AuthNotifier._init() settles without
/// touching Dio or secure storage.
class _FakeAuthRepository extends AuthRepository {
  @override
  Future<bool> isLoggedIn() async => false;
}

Widget _buildSubject() {
  return ProviderScope(
    overrides: [
      authRepositoryProvider.overrideWithValue(_FakeAuthRepository()),
    ],
    child: const MaterialApp(home: RegisterScreen()),
  );
}

void main() {
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
      const MethodChannel('plugins.it_nomads.com/flutter_secure_storage'),
      (_) async => null,
    );
  });

  testWidgets('account-type selector is visible by default (non-business)',
      (tester) async {
    await tester.pumpWidget(_buildSubject());
    await tester.pumpAndSettle();

    expect(find.text('Account Type'), findsOneWidget);
    expect(find.text('Buy'), findsOneWidget);
    expect(find.text('Sell'), findsOneWidget);
    expect(find.text('Both'), findsOneWidget);
  });

  testWidgets('turning on the Business toggle hides the account-type selector',
      (tester) async {
    await tester.pumpWidget(_buildSubject());
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.byType(SwitchListTile));
    await tester.tap(find.byType(SwitchListTile));
    await tester.pumpAndSettle();

    expect(find.text('Account Type'), findsNothing);
    expect(find.text('Buy'), findsNothing);
    expect(find.text('Sell'), findsNothing);
    // The Both option label should no longer be on screen either.
    expect(find.text('Both'), findsNothing);
  });

  testWidgets('toggling Business back off restores the selector',
      (tester) async {
    await tester.pumpWidget(_buildSubject());
    await tester.pumpAndSettle();

    // On, then off.
    await tester.ensureVisible(find.byType(SwitchListTile));
    await tester.tap(find.byType(SwitchListTile));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byType(SwitchListTile));
    await tester.tap(find.byType(SwitchListTile));
    await tester.pumpAndSettle();

    expect(find.text('Account Type'), findsOneWidget);
    expect(find.text('Buy'), findsOneWidget);
    expect(find.text('Sell'), findsOneWidget);
    expect(find.text('Both'), findsOneWidget);
  });
}
