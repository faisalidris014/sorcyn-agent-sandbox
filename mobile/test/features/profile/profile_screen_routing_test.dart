// Phase 03-02 — Profile screen Earnings Dashboard routing test.
//
// Asserts that tapping the 'Earnings Dashboard' menu item on ProfileScreen
// triggers a navigation push to /seller/earnings. Verifies the fix for
// Bug C: the item previously routed to /seller/stripe-onboard, making
// SellerEarningsScreen unreachable from the profile.
//
// Strategy: build the ProfileScreen inside a GoRouter, tap the Earnings
// Dashboard tile, then assert that the destination route rendered.
//
// Platform channel stubs: flutter_secure_storage, flutter_localizations and
// firebase_core all use platform channels unavailable in the unit-test
// runner. We install no-op method-call handlers so that SecureStorage.read()
// returns null (provider state never reset) and FirebaseMessaging is skipped.

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
import 'package:reverse_marketplace/core/providers/app_mode_provider.dart';

// ── Stub user ───────────────────────────────────────────────────────────────

final _stubUser = User(
  id: 'test-user-id',
  email: 'seller@test.com',
  firstName: 'Test',
  lastName: 'Seller',
  accountType: 'seller',
  emailVerified: true,
  createdAt: DateTime(2025),
);

// ── Stub repositories ───────────────────────────────────────────────────────

class _StubAuthRepository extends AuthRepository {
  @override
  Future<bool> isLoggedIn() async => true;

  @override
  Future<User> getCurrentUser() async => _stubUser;

  /// No-op logout prevents SecureStorage.deleteAll() in the error path.
  @override
  Future<void> logout() async {}
}

// ── Stub notifiers ──────────────────────────────────────────────────────────

class _StubAuthNotifier extends AuthNotifier {
  _StubAuthNotifier() : super(_StubAuthRepository());
}

/// AppModeNotifier subclass that forces seller mode.
/// _loadSavedMode() is still called by the super-constructor but
/// SecureStorage.read() is mocked to return null (see setUp), so the
/// `if (saved == 'seller')` branch is never taken and state stays
/// AppMode.seller as set in the constructor body.
class _SellerModeNotifier extends AppModeNotifier {
  _SellerModeNotifier() {
    state = AppMode.seller;
  }
}

class _StubSellerProfileNotifier extends SellerProfileNotifier {
  _StubSellerProfileNotifier() : super(SellerRepository());

  @override
  Future<void> loadProfile() async {}

  @override
  Future<void> loadStripeStatus() async {}
}

// ── Platform channel stubs ─────────────────────────────────────────────────

/// Installs no-op handlers for platform channels that are not available in
/// the unit-test runner. Must be called before pumpWidget.
void _stubPlatformChannels() {
  // flutter_secure_storage — all calls return null so reads return null
  // (no value found) and writes are silently swallowed.
  const MethodChannel secureStorageChannel =
      MethodChannel('plugins.it_expertise.com/flutter_secure_storage');
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(secureStorageChannel, (_) async => null);

  // flutter_secure_storage macOS/iOS variant channel name used on desktop runners.
  const MethodChannel secureStorageChannelMac =
      MethodChannel('plugins.it_expertise.com/flutter_secure_storage_macos');
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(secureStorageChannelMac, (_) async => null);
}

// ── Test ───────────────────────────────────────────────────────────────────

void main() {
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  setUp(() {
    _stubPlatformChannels();
  });

  testWidgets(
    "Earnings Dashboard tile pushes '/seller/earnings'",
    (tester) async {
      const String earningsScreenKey = 'earnings_screen_sentinel';

      final router = GoRouter(
        initialLocation: '/profile',
        routes: [
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/seller/earnings',
            builder: (ctx, st) => const Scaffold(
              body: Center(
                child: Text(earningsScreenKey),
              ),
            ),
          ),
          // Supplementary routes the ProfileScreen may reference.
          GoRoute(
            path: '/profile/edit',
            builder: (ctx, st) =>
                const Scaffold(body: Text('edit_profile_screen')),
          ),
          GoRoute(
            path: '/settings',
            builder: (ctx, st) =>
                const Scaffold(body: Text('settings_screen')),
          ),
          GoRoute(
            path: '/settings/language',
            builder: (ctx, st) =>
                const Scaffold(body: Text('language_screen')),
          ),
          GoRoute(
            path: '/seller/stripe-onboard',
            builder: (ctx, st) =>
                const Scaffold(body: Text('stripe_onboard_screen')),
          ),
          GoRoute(
            path: '/seller/verification',
            builder: (ctx, st) =>
                const Scaffold(body: Text('verification_screen')),
          ),
          GoRoute(
            path: '/seller/profile',
            builder: (ctx, st) =>
                const Scaffold(body: Text('seller_profile_screen')),
          ),
          GoRoute(
            path: '/seller/profile/setup',
            builder: (ctx, st) =>
                const Scaffold(body: Text('seller_profile_setup_screen')),
          ),
          GoRoute(
            path: '/transactions',
            builder: (ctx, st) =>
                const Scaffold(body: Text('transactions_screen')),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith((_) => _StubAuthNotifier()),
            appModeProvider.overrideWith((_) => _SellerModeNotifier()),
            sellerProfileProvider
                .overrideWith((_) => _StubSellerProfileNotifier()),
          ],
          child: MaterialApp.router(routerConfig: router),
        ),
      );

      // Allow all async init to complete (auth _init, appMode _loadSavedMode).
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Verify the profile screen rendered (basic sanity).
      expect(find.byType(ProfileScreen), findsOneWidget);

      // Earnings Dashboard tile is only shown in seller mode — confirm it.
      final earningsFinder = find.text('Earnings Dashboard');

      // If not visible (off-screen in the scroll list), scroll to it.
      if (earningsFinder.evaluate().isEmpty ||
          !tester.getRect(earningsFinder).overlaps(
                const Rect.fromLTWH(0, 0, 800, 600),
              )) {
        await tester.scrollUntilVisible(
          earningsFinder,
          500,
          scrollable: find.byType(Scrollable).first,
        );
        await tester.pumpAndSettle();
      }

      expect(
        earningsFinder,
        findsOneWidget,
        reason: 'Earnings Dashboard tile must be visible in seller mode',
      );

      // Tap the tile — this calls context.push('/seller/earnings').
      await tester.tap(earningsFinder);
      await tester.pumpAndSettle();

      // Verify the /seller/earnings destination was rendered.
      // The sentinel text appearing confirms push('/seller/earnings') fired.
      expect(
        find.text(earningsScreenKey),
        findsOneWidget,
        reason:
            "After tapping Earnings Dashboard, SellerEarningsScreen sentinel "
            "('$earningsScreenKey') must be visible — navigation to "
            "'/seller/earnings' did not occur",
      );

      // Confirm via router state. GoRouter.push() adds to the stack; the
      // topmost location is accessible via the last segment of the full path
      // on the delegate. We verify by inspecting the route matches rather
      // than the root uri, which reflects the shell route on push.
      final matches =
          router.routerDelegate.currentConfiguration.matches;
      final topPath = matches.last.matchedLocation;
      expect(
        topPath,
        '/seller/earnings',
        reason:
            "Router top-of-stack path must be '/seller/earnings' after tapping "
            "Earnings Dashboard",
      );
    },
  );
}
