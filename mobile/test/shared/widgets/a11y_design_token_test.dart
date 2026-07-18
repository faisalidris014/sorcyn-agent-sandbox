// Phase 02-04 — Accessibility design-token contribution tests.
//
// Per ROADMAP NFR-accessibility (this phase ships the design-token contribution
// only — full WCAG 2.1 AA audit lives in Phase 4):
//   • Tap targets on primary CTAs are ≥48dp (Flutter Material standard,
//     exceeds WCAG 44×44 px).
//   • White-on-primary contrast passes WCAG AA (≥4.5:1) — actual ratio for
//     #FFFFFF on #7C3AED is ~5.27:1.
//   • GradientButton renders without overflow at TextScaler 2.0.
//   • Locked palette tokens unchanged (defense-in-depth — duplicates one
//     widget_conformance_test, kept here so the a11y file is self-contained
//     for future expansion).

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:reverse_marketplace/core/theme/app_colors.dart';
import 'package:reverse_marketplace/shared/widgets/gradient_button.dart';
import 'package:reverse_marketplace/shared/widgets/gradient_fab.dart';

const _lockedPrimary = Color(0xFF7C3AED);
const _lockedWhite = Color(0xFFFFFFFF);
const _wcagAaThreshold = 4.5; // normal-text WCAG AA

/// WCAG 2.x relative luminance formula.
/// https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
double _relativeLuminance(Color c) {
  double channel(double v) {
    final n = v / 255.0;
    return n <= 0.03928 ? n / 12.92 : math.pow((n + 0.055) / 1.055, 2.4) as double;
  }

  final r = channel(c.r * 255);
  final g = channel(c.g * 255);
  final b = channel(c.b * 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

double contrastRatio(Color a, Color b) {
  final la = _relativeLuminance(a);
  final lb = _relativeLuminance(b);
  final lighter = la > lb ? la : lb;
  final darker = la > lb ? lb : la;
  return (lighter + 0.05) / (darker + 0.05);
}

Widget _wrap(Widget child, {TextScaler? textScaler}) {
  return MaterialApp(
    home: MediaQuery(
      data: MediaQueryData(textScaler: textScaler ?? const TextScaler.linear(1.0)),
      child: Scaffold(body: Center(child: child)),
    ),
  );
}

void main() {
  group('Tap-target size (Flutter Material ≥48dp / WCAG 44×44 px)', () {
    testWidgets('GradientButton default tap target is at least 48dp tall',
        (tester) async {
      await tester.pumpWidget(_wrap(GradientButton(
        text: 'Continue',
        width: 200,
        onPressed: () {},
      )));
      final size = tester.getSize(find.byType(GradientButton));
      expect(size.height, greaterThanOrEqualTo(48),
          reason: 'GradientButton default height (56) must clear the 48dp threshold');
    });

    testWidgets('GradientFab default tap target is at least 48dp', (tester) async {
      await tester.pumpWidget(_wrap(GradientFab(onPressed: () {})));
      final size = tester.getSize(find.byType(GradientFab));
      expect(size.height, greaterThanOrEqualTo(48));
      expect(size.width, greaterThanOrEqualTo(48));
    });
  });

  group('Color contrast (WCAG AA)', () {
    test('white on locked primary passes WCAG AA (4.5:1)', () {
      final ratio = contrastRatio(_lockedWhite, _lockedPrimary);
      expect(ratio, greaterThanOrEqualTo(_wcagAaThreshold),
          reason: 'White (#FFFFFF) on locked primary (#7C3AED) must pass WCAG AA. '
              'Actual ratio: ${ratio.toStringAsFixed(2)}:1');
    });

    test('contrastRatio symmetric and bounded', () {
      final ab = contrastRatio(_lockedWhite, _lockedPrimary);
      final ba = contrastRatio(_lockedPrimary, _lockedWhite);
      expect(ab, closeTo(ba, 0.001),
          reason: 'contrastRatio must be order-independent');
      expect(ab, greaterThanOrEqualTo(1.0));
      expect(ab, lessThanOrEqualTo(21.0));
    });
  });

  group('Text scaler 2.0 support', () {
    testWidgets('GradientButton renders without exceptions at TextScaler 2.0',
        (tester) async {
      await tester.pumpWidget(_wrap(
        GradientButton(
          text: 'A long button label',
          onPressed: () {},
        ),
        textScaler: const TextScaler.linear(2.0),
      ));
      // takeException returns null when no errors fired during pump.
      expect(tester.takeException(), isNull,
          reason: 'GradientButton must not throw at TextScaler 2.0');
      expect(find.byType(GradientButton), findsOneWidget);
    });
  });

  group('Locked palette tokens (defense-in-depth)', () {
    test('AppColors.primary equals locked Sorcyn primary', () {
      expect(AppColors.primary, _lockedPrimary);
    });

    test('AppColors.secondaryPurple equals locked Sorcyn secondary', () {
      expect(AppColors.secondaryPurple, const Color(0xFFA855F7));
    });
  });
}
