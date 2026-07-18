import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:reverse_marketplace/core/network/api_response.dart';
import 'package:reverse_marketplace/features/discover/data/models/discover_models.dart';
import 'package:reverse_marketplace/features/discover/data/repositories/discover_repository.dart';
import 'package:reverse_marketplace/features/discover/providers/discover_provider.dart';
import 'package:reverse_marketplace/features/posts/data/models/post_model.dart';

/// Records which modes were requested and returns one item per call.
class _FakeDiscoverRepository implements DiscoverRepository {
  final List<String> requestedModes = [];

  @override
  Future<({List<DiscoverItem> items, PaginationMeta? meta})> getDiscover({
    String? categoryId,
    String mode = 'foryou',
    int page = 1,
    int limit = 20,
  }) async {
    requestedModes.add(mode);
    return (
      items: <DiscoverItem>[
        DiscoverItem(post: _post('post-$mode'), offers: const []),
      ],
      meta: PaginationMeta(page: 1, limit: limit, total: 1, totalPages: 1),
    );
  }
}

Post _post(String id) => Post(
      id: id,
      buyerId: 'buyer-1',
      categoryId: 'cat-1',
      title: 'Need a used standing desk in good condition',
      description: 'Looking for a height-adjustable standing desk.',
      createdAt: DateTime(2026, 1, 1),
      updatedAt: DateTime(2026, 1, 1),
    );

void main() {
  ProviderContainer containerWith(_FakeDiscoverRepository repo) {
    final c = ProviderContainer(overrides: [
      discoverRepositoryProvider.overrideWithValue(repo),
    ]);
    addTearDown(c.dispose);
    return c;
  }

  test('a freshly created (category, mode) provider loads itself', () async {
    final repo = _FakeDiscoverRepository();
    final container = containerWith(repo);

    const key = (categoryId: 'cat-1', mode: 'foryou');
    // Listen so the autoDispose provider stays alive while it loads.
    container.listen(discoverProvider(key), (_, _) {});
    await Future<void>.delayed(Duration.zero);

    expect(repo.requestedModes, ['foryou']);
    expect(container.read(discoverProvider(key)).items, hasLength(1));
  });

  test('returning to a previously-disposed mode reloads instead of staying empty',
      () async {
    // Regression: switching modes disposes the prior autoDispose instance. When
    // the buyer switches back, the recreated instance must fetch again — a
    // widget-side trigger used to race with disposal and strand it empty (#323).
    final repo = _FakeDiscoverRepository();
    final container = containerWith(repo);

    const foryou = (categoryId: 'cat-1', mode: 'foryou');
    const trending = (categoryId: 'cat-1', mode: 'trending');

    final sub1 = container.listen(discoverProvider(foryou), (_, _) {});
    await Future<void>.delayed(Duration.zero);
    expect(container.read(discoverProvider(foryou)).items, hasLength(1));

    // Switch to Trending — drops the For You subscription, disposing it.
    sub1.close();
    final sub2 = container.listen(discoverProvider(trending), (_, _) {});
    await Future<void>.delayed(Duration.zero);
    expect(container.read(discoverProvider(trending)).items, hasLength(1));

    // Switch back to For You — must refetch and repopulate, not sit empty.
    sub2.close();
    container.listen(discoverProvider(foryou), (_, _) {});
    await Future<void>.delayed(Duration.zero);

    expect(container.read(discoverProvider(foryou)).items, hasLength(1),
        reason: 'returning to a disposed mode must reload the feed');
    expect(repo.requestedModes, ['foryou', 'trending', 'foryou']);
  });
}
