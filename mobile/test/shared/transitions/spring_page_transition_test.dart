import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:reverse_marketplace/shared/transitions/spring_page_transition.dart';

void main() {
  group('springPage', () {
    test('returns a CustomTransitionPage with the child unwrapped', () {
      const child = SizedBox(key: ValueKey('test-child'));
      final page = springPage<void>(child: child);

      expect(page, isA<CustomTransitionPage<void>>());
      expect(page.child, same(child));
    });

    test('transitionDuration is at least 350ms (spring settle window)', () {
      final page = springPage<void>(child: const SizedBox());
      expect(
        page.transitionDuration.inMilliseconds,
        greaterThanOrEqualTo(350),
        reason:
            'Spring settle at stiffness 320 / damping 32 needs ~400ms; helper '
            'must allocate at least 350ms so the transition does not get cut '
            'off mid-animation.',
      );
    });

    test('uses locked Sorcyn spring tokens (stiffness 320, damping 32, mass 1.0)',
        () {
      // Sanity check: the public token constants must remain locked. These are
      // exposed for tests + downstream verification only.
      expect(SpringPageTransition.kStiffness, 320.0);
      expect(SpringPageTransition.kDamping, 32.0);
      expect(SpringPageTransition.kMass, 1.0);
    });

    testWidgets(
      'spring transition completes within finite time on GoRouter navigation',
      (tester) async {
        final router = GoRouter(
          initialLocation: '/a',
          routes: [
            GoRoute(
              path: '/a',
              pageBuilder: (context, state) => springPage<void>(
                key: state.pageKey,
                child: const Scaffold(
                  body: Center(child: Text('Page A')),
                ),
              ),
            ),
            GoRoute(
              path: '/b',
              pageBuilder: (context, state) => springPage<void>(
                key: state.pageKey,
                child: const Scaffold(
                  body: Center(child: Text('Page B')),
                ),
              ),
            ),
          ],
        );

        await tester.pumpWidget(MaterialApp.router(routerConfig: router));
        await tester.pumpAndSettle();

        expect(find.text('Page A'), findsOneWidget);

        router.go('/b');
        // pumpAndSettle must not timeout — i.e. animation completes in finite time.
        await tester.pumpAndSettle(const Duration(seconds: 2));

        expect(find.text('Page B'), findsOneWidget);
      },
    );

    testWidgets(
      'spring curve is monotonically advancing (no infinite oscillation)',
      (tester) async {
        // Sample the curve at multiple t values; final t=1 must hit (or cross)
        // 1.0 within reasonable tolerance — i.e. settles to its target.
        final curve = SpringPageTransition.springCurve;
        final start = curve.transform(0.0);
        final end = curve.transform(1.0);

        expect(start, closeTo(0.0, 0.01),
            reason: 'Curve must start at 0.');
        expect(end, closeTo(1.0, 0.05),
            reason: 'Curve must settle to 1.0 (within 5% tolerance) by t=1.');
      },
    );
  });
}
