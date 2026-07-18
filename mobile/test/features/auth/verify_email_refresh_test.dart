// Widget tests for the VerifyEmailScreen refresh path.
//
// Verifies that the "Already verified?" button and pull-to-refresh both
// call refreshCurrentUser(), which re-fetches the user from the backend
// and lets the GoRouter redirect fire once emailVerified flips to true.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:reverse_marketplace/features/auth/data/models/user_model.dart';
import 'package:reverse_marketplace/features/auth/data/repositories/auth_repository.dart';
import 'package:reverse_marketplace/features/auth/presentation/screens/verify_email_screen.dart';
import 'package:reverse_marketplace/features/auth/providers/auth_provider.dart';

// ── Fake repository ───────────────────────────────────────────────────────────
//
// First call to getCurrentUser() returns an unverified user (simulates the
// state right after registration). Every subsequent call returns a verified
// user (simulates out-of-band verification having happened).

class _FakeAuthRepository extends AuthRepository {
  int getCallCount = 0;

  @override
  Future<bool> isLoggedIn() async => true;

  @override
  Future<User> getCurrentUser() async {
    getCallCount++;
    return User(
      id: 'u1',
      email: 'buyer@test.com',
      firstName: 'Test',
      lastName: 'Buyer',
      accountType: 'buyer',
      emailVerified: getCallCount > 1,
      createdAt: DateTime(2026),
    );
  }

  @override
  Future<void> resendVerification(String email) async {}

  @override
  Future<void> logout() async {}
}

// ── Harness ───────────────────────────────────────────────────────────────────

Widget _harness(_FakeAuthRepository repo) => ProviderScope(
      overrides: [authRepositoryProvider.overrideWithValue(repo)],
      child: const MaterialApp(home: VerifyEmailScreen()),
    );

// ── Helpers ───────────────────────────────────────────────────────────────────

// VerifyEmailScreen contains a looping AnimationController (_floatController)
// that schedules frames indefinitely, so pumpAndSettle() will always time out.
// We use targeted pump() calls instead:
//   _settle() — lets the async _init() on AuthNotifier finish
//   _pump()   — ticks the clock enough for a single async action to complete
Future<void> _settle(WidgetTester t) async {
  await t.pump();
  await t.pump(const Duration(milliseconds: 500));
}

Future<void> _tick(WidgetTester t) async {
  await t.pump();
  await t.pump(const Duration(milliseconds: 300));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

void main() {
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  testWidgets('renders "Already verified?" button', (tester) async {
    final repo = _FakeAuthRepository();
    await tester.pumpWidget(_harness(repo));
    await _settle(tester);

    expect(find.text('Already verified? Tap to continue'), findsOneWidget);
  });

  testWidgets(
      'tapping "Already verified?" calls refreshCurrentUser (second getCurrentUser call)',
      (tester) async {
    final repo = _FakeAuthRepository();
    await tester.pumpWidget(_harness(repo));
    await _settle(tester);

    // _init() on AuthNotifier already made the first call.
    expect(repo.getCallCount, 1);

    await tester.ensureVisible(find.text('Already verified? Tap to continue'));
    await tester.tap(find.text('Already verified? Tap to continue'));
    await _tick(tester);

    // refreshCurrentUser() triggered a second getCurrentUser call.
    expect(repo.getCallCount, 2);
  });

  testWidgets('pull-to-refresh triggers refreshCurrentUser', (tester) async {
    final repo = _FakeAuthRepository();
    await tester.pumpWidget(_harness(repo));
    await _settle(tester);

    expect(repo.getCallCount, 1);

    // Fling downward to trigger RefreshIndicator.
    await tester.fling(
      find.byType(SingleChildScrollView),
      const Offset(0, 300),
      800,
    );
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));

    expect(repo.getCallCount, 2);
  });
}
