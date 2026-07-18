import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:reverse_marketplace/features/discover/presentation/screens/discover_screen.dart';
import 'package:reverse_marketplace/features/discover/providers/discover_provider.dart';

/// #323 — the Discover feed-mode selector drives [discoverModeProvider], which
/// keys every category tab's result set. These pin the default + switching.
void main() {
  Widget harness(ProviderContainer container) => UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(
          home: Scaffold(body: DiscoverModeSelector()),
        ),
      );

  testWidgets('defaults to For You', (tester) async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    await tester.pumpWidget(harness(container));

    expect(container.read(discoverModeProvider), 'foryou');
    expect(find.text('For You'), findsOneWidget);
    expect(find.text('Trending'), findsOneWidget);
    expect(find.text('Nearby'), findsOneWidget);
  });

  testWidgets('tapping a mode updates the shared mode provider', (tester) async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    await tester.pumpWidget(harness(container));

    await tester.tap(find.text('Trending'));
    await tester.pump();
    expect(container.read(discoverModeProvider), 'trending');

    await tester.tap(find.text('Nearby'));
    await tester.pump();
    expect(container.read(discoverModeProvider), 'nearby');

    await tester.tap(find.text('For You'));
    await tester.pump();
    expect(container.read(discoverModeProvider), 'foryou');
  });
}
