import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_response.dart';
import '../../../core/network/dio_client.dart';
import '../../auth/providers/auth_provider.dart';
import '../../posts/data/models/post_model.dart';
import '../../sellers/providers/seller_provider.dart';
import '../data/repositories/feed_repository.dart';

// ── State ──

class FeedState {
  final List<Post> posts;
  final PaginationMeta? meta;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final String sortBy;
  final String? categoryId;
  final String? urgency;
  final String? search;

  const FeedState({
    this.posts = const [],
    this.meta,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.sortBy = 'newest',
    this.categoryId,
    this.urgency,
    this.search,
  });

  bool get hasMore => meta != null && meta!.page < meta!.totalPages;

  FeedState copyWith({
    List<Post>? posts,
    PaginationMeta? meta,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    String? sortBy,
    String? categoryId,
    String? urgency,
    String? search,
    bool clearError = false,
    bool clearCategoryId = false,
    bool clearUrgency = false,
    bool clearSearch = false,
  }) {
    return FeedState(
      posts: posts ?? this.posts,
      meta: meta ?? this.meta,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: clearError ? null : (error ?? this.error),
      sortBy: sortBy ?? this.sortBy,
      categoryId:
          clearCategoryId ? null : (categoryId ?? this.categoryId),
      urgency: clearUrgency ? null : (urgency ?? this.urgency),
      search: clearSearch ? null : (search ?? this.search),
    );
  }
}

// ── Notifier ──

class FeedNotifier extends StateNotifier<FeedState> {
  final FeedRepository _repository;
  final Ref _ref;

  FeedNotifier(this._repository, this._ref) : super(const FeedState());

  Future<void> loadFeed({bool refresh = false}) async {
    if (state.isLoading) return;
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      posts: refresh ? [] : null,
    );
    try {
      // Pass seller's lat/lng + serviceRadius so the backend auto-filters by
      // service radius and returns distanceMiles on each post card.
      final user = _ref.read(authProvider).user;
      final sellerProfile = _ref.read(sellerProfileProvider).profile;
      final result = await _repository.getFeed(
        categoryId: state.categoryId,
        urgency: state.urgency,
        search: state.search,
        sort: state.sortBy,
        latitude: user?.latitude,
        longitude: user?.longitude,
        radiusMiles: sellerProfile?.serviceRadiusMiles,
        page: 1,
      );
      state = state.copyWith(
        posts: result.posts,
        meta: result.meta,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: _extractError(e),
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    state = state.copyWith(isLoadingMore: true);
    try {
      final nextPage = (state.meta?.page ?? 0) + 1;
      final user = _ref.read(authProvider).user;
      final sellerProfile = _ref.read(sellerProfileProvider).profile;
      final result = await _repository.getFeed(
        categoryId: state.categoryId,
        urgency: state.urgency,
        search: state.search,
        sort: state.sortBy,
        latitude: user?.latitude,
        longitude: user?.longitude,
        radiusMiles: sellerProfile?.serviceRadiusMiles,
        page: nextPage,
      );
      state = state.copyWith(
        posts: [...state.posts, ...result.posts],
        meta: result.meta,
        isLoadingMore: false,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  void setSortBy(String sort) {
    state = state.copyWith(sortBy: sort);
    loadFeed(refresh: true);
  }

  void setCategoryFilter(String? categoryId) {
    state = categoryId == null
        ? state.copyWith(clearCategoryId: true)
        : state.copyWith(categoryId: categoryId);
    loadFeed(refresh: true);
  }

  void setUrgencyFilter(String? urgency) {
    state = urgency == null
        ? state.copyWith(clearUrgency: true)
        : state.copyWith(urgency: urgency);
    loadFeed(refresh: true);
  }

  void setSearch(String? search) {
    state = (search == null || search.isEmpty)
        ? state.copyWith(clearSearch: true)
        : state.copyWith(search: search);
    loadFeed(refresh: true);
  }

  String _extractError(Object e) {
    if (e is DioException && e.error is ApiException) {
      return (e.error as ApiException).error.userMessage;
    }
    return 'Something went wrong. Please try again.';
  }
}

// ── Providers ──

final feedRepositoryProvider = Provider<FeedRepository>((ref) {
  return FeedRepository();
});

final feedProvider =
    StateNotifierProvider<FeedNotifier, FeedState>((ref) {
  return FeedNotifier(ref.read(feedRepositoryProvider), ref);
});
