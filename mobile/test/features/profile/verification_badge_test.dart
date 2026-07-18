// #245 — the Profile → Verification row must show the "Verified" badge based on
// the seller's real identity verification, NOT `user.emailVerified` (which is
// true for every logged-in user, making the badge meaningless).
//
// Two layers of coverage:
//   1. SellerProfile.hasIdentityVerification (pure getter) — the decision logic.
//   2. Widget test — ProfileScreen in seller mode shows/hides the badge based on
//      the injected seller profile.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:reverse_marketplace/features/profile/presentation/screens/profile_screen.dart';
import 'package:reverse_marketplace/features/auth/providers/auth_provider.dart';
import 'package:reverse_marketplace/features/auth/data/models/user_model.dart';
import 'package:reverse_marketplace/features/auth/data/repositories/auth_repository.dart';
import 'package:reverse_marketplace/features/sellers/providers/seller_provider.dart';
import 'package:reverse_marketplace/features/sellers/data/repositories/seller_repository.dart';
import 'package:reverse_marketplace/features/sellers/data/models/seller_profile_model.dart';
import 'package:reverse_marketplace/core/providers/app_mode_provider.dart';

SellerProfile _profile({
  bool emailVerified = false,
  bool idVerified = false,
  bool licenseVerified = false,
  bool insuranceVerified = false,
  bool backgroundCheckVerified = false,
}) {
  final now = DateTime(2026, 1, 1);
  return SellerProfile(
    id: 'seller-1',
    userId: 'user-1',
    emailVerified: emailVerified,
    idVerified: idVerified,
    licenseVerified: licenseVerified,
    insuranceVerified: insuranceVerified,
    backgroundCheckVerified: backgroundCheckVerified,
    createdAt: now,
    updatedAt: now,
  );
}

// ── Stubs for the widget test ────────────────────────────────────────────────

final _stubUser = User(
  id: 'user-1',
  email: 'seller@test.com',
  firstName: 'Test',
  lastName: 'Seller',
  accountType: 'seller',
  emailVerified: true, // email always verified — must NOT drive the badge
  createdAt: DateTime(2025),
);

class _StubAuthRepository extends AuthRepository {
  @override
  Future<bool> isLoggedIn() async => true;
  @override
  Future<User> getCurrentUser() async => _stubUser;
  @override
  Future<void> logout() async {}
}

class _StubAuthNotifier extends AuthNotifier {
  _StubAuthNotifier() : super(_StubAuthRepository());
}

class _SellerModeNotifier extends AppModeNotifier {
  _SellerModeNotifier() {
    state = AppMode.seller;
  }
}

class _StubSellerProfileNotifier extends SellerProfileNotifier {
  _StubSellerProfileNotifier(SellerProfile? profile)
      : super(SellerRepository()) {
    state = SellerProfileState(profile: profile);
  }
  @override
  Future<void> loadProfile() async {}
  @override
  Future<void> loadStripeStatus() async {}
}

void _stubPlatformChannels() {
  const secureStorage =
      MethodChannel('plugins.it_expertise.com/flutter_secure_storage');
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(secureStorage, (_) async => null);
  const secureStorageMac =
      MethodChannel('plugins.it_expertise.com/flutter_secure_storage_macos');
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(secureStorageMac, (_) async => null);
}

Widget _app(SellerProfile? profile) {
  final router = GoRouter(
    initialLocation: '/profile',
    routes: [
      GoRoute(
          path: '/profile', builder: (c, s) => const ProfileScreen()),
      GoRoute(
          path: '/seller/verification',
          builder: (c, s) => const Scaffold(body: Text('verification_screen'))),
      GoRoute(
          path: '/seller/profile',
          builder: (c, s) => const Scaffold(body: Text('seller_profile'))),
      GoRoute(
          path: '/settings',
          builder: (c, s) => const Scaffold(body: Text('settings'))),
    ],
  );
  return ProviderScope(
    overrides: [
      authProvider.overrideWith((_) => _StubAuthNotifier()),
      appModeProvider.overrideWith((_) => _SellerModeNotifier()),
      sellerProfileProvider
          .overrideWith((_) => _StubSellerProfileNotifier(profile)),
    ],
    child: MaterialApp.router(routerConfig: router),
  );
}

/// Scroll the profile menu until the Verification row is on-screen, so a badge
/// absence assertion is meaningful (the row itself must be built).
Future<void> _revealVerificationRow(WidgetTester tester) async {
  final row = find.text('Verification');
  if (row.evaluate().isEmpty) {
    await tester.scrollUntilVisible(
      row,
      300,
      scrollable: find.byType(Scrollable).first,
    );
  }
  await tester.pumpAndSettle();
}

void main() {
  group('SellerProfile.hasIdentityVerification (#245)', () {
    test('false when nothing is verified', () {
      expect(_profile().hasIdentityVerification, isFalse);
    });

    test('email verification alone does NOT count', () {
      expect(_profile(emailVerified: true).hasIdentityVerification, isFalse);
    });

    test('any single identity credential flips it true', () {
      expect(_profile(idVerified: true).hasIdentityVerification, isTrue);
      expect(_profile(licenseVerified: true).hasIdentityVerification, isTrue);
      expect(_profile(insuranceVerified: true).hasIdentityVerification, isTrue);
      expect(
          _profile(backgroundCheckVerified: true).hasIdentityVerification,
          isTrue);
    });
  });

  group('Profile Verification badge (#245 widget)', () {
    setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);
    setUp(_stubPlatformChannels);

    testWidgets('hidden for an email-only seller (no identity verification)',
        (tester) async {
      await tester.pumpWidget(_app(_profile(emailVerified: true)));
      await tester.pumpAndSettle(const Duration(seconds: 2));
      await _revealVerificationRow(tester);

      expect(find.text('Verification'), findsOneWidget);
      expect(find.text('Verified'), findsNothing);
    });

    testWidgets('shown once the seller has an identity credential',
        (tester) async {
      await tester.pumpWidget(_app(_profile(idVerified: true)));
      await tester.pumpAndSettle(const Duration(seconds: 2));
      await _revealVerificationRow(tester);

      expect(find.text('Verification'), findsOneWidget);
      expect(find.text('Verified'), findsOneWidget);
    });
  });
}
