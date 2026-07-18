// Phase 03-02 — StripeOnboardScreen widget tests.
//
// Asserts that:
//   1. The State class for StripeOnboardScreen mixes in WidgetsBindingObserver
//      (D-24 requirement: screen observes app lifecycle to refetch server state)
//   2. Calling didChangeAppLifecycleState(AppLifecycleState.resumed) triggers
//      loadStripeStatus() and loadProfile() on the SellerProfileNotifier
//      (verifies the fix for Bug B: stale 60% progress after Stripe return)
//   3. isInProgress is derived from server StripeStatus, not ephemeral widget
//      state (Bug D fix: onboarded=true + chargesEnabled=false → "Complete Setup")
//   4. "View Dashboard" CTA navigates to /seller/earnings when seller is
//      fully connected (Bug C CTA fix)

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:reverse_marketplace/features/sellers/presentation/screens/payout_setup_screen.dart';
import 'package:reverse_marketplace/features/sellers/providers/seller_provider.dart';
import 'package:reverse_marketplace/features/sellers/data/models/seller_profile_model.dart';
import 'package:reverse_marketplace/features/sellers/data/repositories/seller_repository.dart';

// ── Fake repository ─────────────────────────────────────────────────────────
// A no-network SellerRepository subclass. All methods throw to make it clear
// the tests should not reach the repository layer.

class _NullSellerRepository extends SellerRepository {
  @override
  Future<SellerProfile> createSellerProfile({
    String? businessName,
    String? bio,
    int serviceRadiusMiles = 25,
    List<String> categories = const [],
    List<String> subcategories = const [],
    int? yearsExperience,
    String? businessWebsite,
    Map<String, dynamic>? businessHours,
  }) =>
      Future.error('not used in tests');

  @override
  Future<SellerProfile> updateSellerProfile({
    String? businessName,
    String? bio,
    int? serviceRadiusMiles,
    List<String>? categories,
    List<String>? subcategories,
    int? yearsExperience,
    String? businessWebsite,
    Map<String, dynamic>? businessHours,
    List<String>? portfolioPhotos,
    String? profilePhotoUrl,
  }) =>
      Future.error('not used in tests');

  @override
  Future<SellerProfile> getMySellerProfile() =>
      Future.error('not used in tests');

  @override
  Future<StripeStatus> getStripeStatus() =>
      Future.error('not used in tests');

  @override
  Future<StripeOnboardingResult> startStripeOnboarding() =>
      Future.error('not used in tests');
}

// ── Fake notifier ────────────────────────────────────────────────────────────
// Extends SellerProfileNotifier so it satisfies overrideWith's type constraint.
// Overrides loadStripeStatus() and loadProfile() to count calls instead of
// making network requests.

class _FakeSellerProfileNotifier extends SellerProfileNotifier {
  int loadStripeStatusCalls = 0;
  int loadProfileCalls = 0;

  _FakeSellerProfileNotifier() : super(_NullSellerRepository());

  @override
  Future<void> loadStripeStatus() async {
    loadStripeStatusCalls++;
  }

  @override
  Future<void> loadProfile() async {
    loadProfileCalls++;
  }
}

// ── Fake notifier: seller in-progress (onboarded, charges not yet enabled) ──

class _InProgressSellerNotifier extends SellerProfileNotifier {
  _InProgressSellerNotifier() : super(_NullSellerRepository()) {
    state = SellerProfileState(
      stripeStatus: StripeStatus(
        onboarded: true,
        chargesEnabled: false,
        payoutsEnabled: false,
      ),
    );
  }

  @override
  Future<void> loadStripeStatus() async {}

  @override
  Future<void> loadProfile() async {}
}

// ── Fake notifier: seller fully connected (chargesEnabled = true) ────────────

final _connectedProfile = SellerProfile(
  id: 'test-seller-id',
  userId: 'test-user-id',
  stripeChargesEnabled: true,
  createdAt: DateTime(2025),
  updatedAt: DateTime(2025),
);

class _ConnectedSellerNotifier extends SellerProfileNotifier {
  _ConnectedSellerNotifier() : super(_NullSellerRepository()) {
    state = SellerProfileState(
      profile: _connectedProfile,
      stripeStatus: StripeStatus(
        onboarded: true,
        chargesEnabled: true,
        payoutsEnabled: true,
      ),
    );
  }

  @override
  Future<void> loadStripeStatus() async {}

  @override
  Future<void> loadProfile() async {}
}

// ── Helpers ────────────────────────────────────────────────────────────────

(Override, _FakeSellerProfileNotifier) _fakeSellerOverride() {
  final notifier = _FakeSellerProfileNotifier();
  final override = sellerProfileProvider.overrideWith((_) => notifier);
  return (override, notifier);
}

void main() {
  setUpAll(() {
    // Prevent GoogleFonts from making network requests in tests.
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  testWidgets(
    'StripeOnboardScreen state mixes WidgetsBindingObserver',
    (tester) async {
      final (override, _) = _fakeSellerOverride();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [override],
          child: const MaterialApp(
            home: StripeOnboardScreen(),
          ),
        ),
      );
      await tester.pump();

      // The State object returned by StripeOnboardScreen must implement
      // WidgetsBindingObserver (added in D-24 fix).
      final state = tester.state(find.byType(StripeOnboardScreen));
      expect(
        state,
        isA<WidgetsBindingObserver>(),
        reason: 'StripeOnboardScreen state must mix in WidgetsBindingObserver',
      );
    },
  );

  // ── Bug D: isInProgress derived from server StripeStatus ──────────────────

  testWidgets(
    'isInProgress shows "Complete Setup" when onboarded=true chargesEnabled=false',
    (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sellerProfileProvider
                .overrideWith((_) => _InProgressSellerNotifier()),
          ],
          child: const MaterialApp(home: StripeOnboardScreen()),
        ),
      );
      await tester.pump();

      // "Continue Setup" is the CTA label when isInProgress is true.
      expect(
        find.text('Continue Setup'),
        findsOneWidget,
        reason:
            'isInProgress must be true when onboarded=true and chargesEnabled=false '
            '(server-derived, not ephemeral widget state)',
      );
      // "Set Up Stripe" must NOT appear — that is the not-started state.
      expect(find.text('Set Up Stripe'), findsNothing);
    },
  );

  // ── Bug C CTA: "View Dashboard" navigates to /seller/earnings ─────────────

  testWidgets(
    '"View Dashboard" CTA pushes /seller/earnings when seller is fully connected',
    (tester) async {
      const String earningsSentinel = 'earnings_screen_sentinel';

      final router = GoRouter(
        initialLocation: '/seller/stripe-onboard',
        routes: [
          GoRoute(
            path: '/seller/stripe-onboard',
            builder: (_, _) => const StripeOnboardScreen(),
          ),
          GoRoute(
            path: '/seller/earnings',
            builder: (_, _) =>
                const Scaffold(body: Center(child: Text(earningsSentinel))),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sellerProfileProvider
                .overrideWith((_) => _ConnectedSellerNotifier()),
          ],
          child: MaterialApp.router(routerConfig: router),
        ),
      );
      await tester.pump();

      expect(
        find.text('View Dashboard'),
        findsOneWidget,
        reason: 'CTA must read "View Dashboard" when seller is fully connected',
      );

      // The CTA sits at the bottom of a SingleChildScrollView; on the default
      // 800x600 test surface it renders below the fold, so scroll it into view
      // before tapping.
      await tester.ensureVisible(find.text('View Dashboard'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('View Dashboard'));
      await tester.pumpAndSettle();

      expect(
        find.text(earningsSentinel),
        findsOneWidget,
        reason:
            'Tapping "View Dashboard" must push /seller/earnings — '
            'SellerEarningsScreen sentinel not found',
      );
    },
  );

  testWidgets(
    'didChangeAppLifecycleState(resumed) triggers loadStripeStatus and loadProfile',
    (tester) async {
      final (override, notifier) = _fakeSellerOverride();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [override],
          child: const MaterialApp(
            home: StripeOnboardScreen(),
          ),
        ),
      );
      // First pump builds widget; second pump flushes initState microtask.
      await tester.pump();
      await tester.pump();

      // Record baseline after initState calls.
      final baselineStripeStatus = notifier.loadStripeStatusCalls;
      final baselineProfile = notifier.loadProfileCalls;

      // Simulate returning from Stripe (app comes to foreground).
      final state = tester.state(find.byType(StripeOnboardScreen));
      // ignore: invalid_use_of_protected_member
      (state as dynamic).didChangeAppLifecycleState(AppLifecycleState.resumed);
      await tester.pump();

      // Both methods must have been called at least once MORE after the
      // lifecycle event (above the initState baseline).
      expect(
        notifier.loadStripeStatusCalls,
        greaterThan(baselineStripeStatus),
        reason: 'loadStripeStatus must be called on AppLifecycleState.resumed',
      );
      expect(
        notifier.loadProfileCalls,
        greaterThan(baselineProfile),
        reason: 'loadProfile must be called on AppLifecycleState.resumed',
      );
    },
  );
}
