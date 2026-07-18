import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_response.dart';
import '../../../core/network/dio_client.dart';
import '../../categories/providers/category_provider.dart';
import '../data/models/discover_models.dart';
import '../data/repositories/discover_repository.dart';

// ── State ──

class DiscoverState {
  final List<DiscoverItem> items;
  final PaginationMeta? meta;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;

  const DiscoverState({
    this.items = const [],
    this.meta,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
  });

  bool get hasMore => meta != null && meta!.page < meta!.totalPages;

  DiscoverState copyWith({
    List<DiscoverItem>? items,
    PaginationMeta? meta,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    bool clearError = false,
  }) {
    return DiscoverState(
      items: items ?? this.items,
      meta: meta ?? this.meta,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

// ── Notifier ──

class DiscoverNotifier extends StateNotifier<DiscoverState> {
  final DiscoverRepository _repository;
  final String? _categoryId;
  final String _mode;

  DiscoverNotifier(this._repository, this._categoryId, this._mode)
      : super(const DiscoverState()) {
    // Self-load on creation. The (categoryId, mode) family is autoDispose, so
    // switching modes disposes the previous instance and building a fresh one is
    // the normal path — including when returning to a mode viewed earlier.
    // Fetching here, rather than from the widget, guarantees every instance
    // loads exactly once: a widget-side trigger races with autoDispose and can
    // leave a recreated provider stranded on its empty state (#323).
    load();
  }

  Future<void> load({bool refresh = false}) async {
    if (state.isLoading) return;
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      items: refresh ? [] : null,
    );
    try {
      final result = await _repository.getDiscover(
        categoryId: _categoryId,
        mode: _mode,
        page: 1,
      );
      state = state.copyWith(
        items: result.items,
        meta: result.meta,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _extractError(e));
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    state = state.copyWith(isLoadingMore: true);
    try {
      final nextPage = (state.meta?.page ?? 0) + 1;
      final result = await _repository.getDiscover(
        categoryId: _categoryId,
        mode: _mode,
        page: nextPage,
      );
      state = state.copyWith(
        items: [...state.items, ...result.items],
        meta: result.meta,
        isLoadingMore: false,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  String _extractError(Object e) {
    if (e is DioException && e.error is ApiException) {
      return (e.error as ApiException).error.userMessage;
    }
    return 'Something went wrong. Please try again.';
  }
}

// ── Providers ──

final discoverRepositoryProvider = Provider<DiscoverRepository>((ref) {
  return DiscoverRepository();
});

/// Composite key for a Discover result set: a top-level category tab (null = all)
/// crossed with the active feed mode (#323). Records give value equality, so the
/// family caches one notifier per (categoryId, mode) pair.
typedef DiscoverKey = ({String? categoryId, String mode});

/// The active Discover feed mode (#323), shared across the three category tabs.
/// autoDispose resets to For You when the buyer leaves Discover.
final discoverModeProvider = StateProvider.autoDispose<String>((ref) => 'foryou');

/// Per-tab Discover state keyed by (major-category UUID, mode).
/// autoDispose so switching away from Discover (or account) drops stale results.
final discoverProvider = StateNotifierProvider.autoDispose
    .family<DiscoverNotifier, DiscoverState, DiscoverKey>((ref, key) {
  return DiscoverNotifier(
      ref.read(discoverRepositoryProvider), key.categoryId, key.mode);
});

/// Resolves the top-level category UUIDs (products / services / jobs) used to
/// scope the Discover category tabs. Derived from the cached category tree.
final topLevelCategoryIdsProvider = Provider<Map<String, String>>((ref) {
  final treeAsync = ref.watch(categoryTreeProvider);
  return treeAsync.maybeWhen(
    data: (nodes) {
      final map = <String, String>{};
      for (final node in nodes) {
        if (node.slug == 'products' ||
            node.slug == 'services' ||
            node.slug == 'jobs') {
          map[node.slug] = node.id;
        }
      }
      return map;
    },
    orElse: () => const <String, String>{},
  );
});
