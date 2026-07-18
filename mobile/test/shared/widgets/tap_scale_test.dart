import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:reverse_marketplace/shared/widgets/tap_scale.dart';

void main() {
  Future<void> pumpTapScale(
    WidgetTester tester, {
    VoidCallback? onTap,
    Widget? child,
  }) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: TapScale(
              onTap: onTap,
              child: child ??
                  const SizedBox(
                    key: ValueKey('tap-scale-child'),
                    width: 80,
                    height: 80,
                  ),
            ),
          ),
        ),
      ),
    );
    await tester.pump();
  }

  group('TapScale', () {
    testWidgets('builds without error with required child', (tester) async {
      await pumpTapScale(tester, onTap: () {});
      expect(find.byType(TapScale), findsOneWidget);
      expect(find.byKey(const ValueKey('tap-scale-child')), findsOneWidget);
    });

    testWidgets('animates to 0.97 scale on tap-down (locked Sorcyn token)',
        (tester) async {
      await pumpTapScale(tester, onTap: () {});

      // Read initial scale.
      AnimatedScale initial = tester.widget<AnimatedScale>(
        find.descendant(
          of: find.byType(TapScale),
          matching: find.byType(AnimatedScale),
        ),
      );
      expect(initial.scale, 1.0);

      // Press and hold (do not release yet).
      final gesture = await tester.startGesture(tester.getCenter(
        find.byKey(const ValueKey('tap-scale-child')),
      ));
      await tester.pump(const Duration(milliseconds: 50));

      final pressed = tester.widget<AnimatedScale>(
        find.descendant(
          of: find.byType(TapScale),
          matching: find.byType(AnimatedScale),
        ),
      );
      expect(pressed.scale, 0.97,
          reason: 'Locked Sorcyn pressedScale token must be 0.97 on tap-down.');

      // Clean up gesture.
      await gesture.up();
      await tester.pumpAndSettle();
    });

    testWidgets('returns to 1.0 scale on tap-up', (tester) async {
      await pumpTapScale(tester, onTap: () {});

      final gesture = await tester.startGesture(tester.getCenter(
        find.byKey(const ValueKey('tap-scale-child')),
      ));
      await tester.pump(const Duration(milliseconds: 50));
      await gesture.up();
      await tester.pump(const Duration(milliseconds: 200));

      final released = tester.widget<AnimatedScale>(
        find.descendant(
          of: find.byType(TapScale),
          matching: find.byType(AnimatedScale),
        ),
      );
      expect(released.scale, 1.0);
    });

    testWidgets(
      'when onTap is null, taps are ignored and scale stays at 1.0 (disabled state)',
      (tester) async {
        await pumpTapScale(tester); // onTap omitted -> null
        final gesture = await tester.startGesture(tester.getCenter(
          find.byKey(const ValueKey('tap-scale-child')),
        ));
        await tester.pump(const Duration(milliseconds: 50));

        final scaleWidget = tester.widget<AnimatedScale>(
          find.descendant(
            of: find.byType(TapScale),
            matching: find.byType(AnimatedScale),
          ),
        );
        expect(scaleWidget.scale, 1.0,
            reason:
                'TapScale with null onTap is disabled — must not animate on tap.');

        await gesture.up();
        await tester.pumpAndSettle();
      },
    );

    testWidgets('default AnimatedScale duration is 100ms (matches existing buttons)',
        (tester) async {
      await pumpTapScale(tester, onTap: () {});
      final scaleWidget = tester.widget<AnimatedScale>(
        find.descendant(
          of: find.byType(TapScale),
          matching: find.byType(AnimatedScale),
        ),
      );
      expect(scaleWidget.duration, const Duration(milliseconds: 100));
    });

    testWidgets('onTap callback fires exactly once per complete tap',
        (tester) async {
      int taps = 0;
      await pumpTapScale(tester, onTap: () => taps++);

      await tester.tap(find.byType(TapScale));
      await tester.pumpAndSettle();

      expect(taps, 1);
    });
  });
}
