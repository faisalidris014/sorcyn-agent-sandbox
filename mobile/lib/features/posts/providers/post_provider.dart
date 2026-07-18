import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_response.dart';
import '../../../core/network/dio_client.dart';
import '../data/models/post_model.dart';
import '../data/repositories/post_repository.dart';

// ── State ──

class PostsState {
  final List<Post> posts;
  final PaginationMeta? meta;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final String? statusFilter;
  final String sortBy;

  const PostsState({
    this.posts = const [],
    this.meta,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.statusFilter,
    this.sortBy = 'newest',
  });

  bool get hasMore =>
      meta != null && meta!.page < meta!.totalPages;

  PostsState copyWith({
    List<Post>? posts,
    PaginationMeta? meta,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    String? statusFilter,
    String? sortBy,
    bool clearError = false,
    bool clearStatusFilter = false,
  }) {
    return PostsState(
      posts: posts ?? this.posts,
      meta: meta ?? this.meta,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: clearError ? null : (error ?? this.error),
      statusFilter:
          clearStatusFilter ? null : (statusFilter ?? this.statusFilter),
      sortBy: sortBy ?? this.sortBy,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PostsState &&
          isLoading == other.isLoading &&
          isLoadingMore == other.isLoadingMore &&
          error == other.error &&
          statusFilter == other.statusFilter &&
          sortBy == other.sortBy &&
          posts.length == other.posts.length &&
          meta?.page == other.meta?.page &&
          meta?.total == other.meta?.total;

  @override
  int get hashCode => Object.hash(
        isLoading,
        isLoadingMore,
        error,
        statusFilter,
        sortBy,
        posts.length,
        meta?.page,
        meta?.total,
      );
}

// ── Notifier ──

class PostsNotifier extends StateNotifier<PostsState> {
  final PostRepository _repository;
  DateTime? _lastFetchedAt;

  PostsNotifier(this._repository) : super(const PostsState());

  Future<void> loadMyPosts({bool refresh = false}) async {
    if (state.isLoading) return;

    // Deduplication: skip if fetched recently (unless explicit refresh)
    if (!refresh &&
        _lastFetchedAt != null &&
        DateTime.now().difference(_lastFetchedAt!).inSeconds < 5) {
      return;
    }

    state = state.copyWith(
      isLoading: true,
      clearError: true,
      posts: refresh ? [] : null,
    );
    try {
      final result = await _repository.getMyPosts(
        status: state.statusFilter,
        sort: state.sortBy,
        page: 1,
      );
      _lastFetchedAt = DateTime.now();
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
      final result = await _repository.getMyPosts(
        status: state.statusFilter,
        sort: state.sortBy,
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

  void setStatusFilter(String? status) {
    state = status == null
        ? state.copyWith(clearStatusFilter: true)
        : state.copyWith(statusFilter: status);
    loadMyPosts(refresh: true);
  }

  void setSortBy(String sort) {
    state = state.copyWith(sortBy: sort);
    loadMyPosts(refresh: true);
  }

  Future<Post> createPost(Map<String, dynamic> data) async {
    final post = await _repository.createPost(data);
    state = state.copyWith(posts: [post, ...state.posts]);
    return post;
  }

  Future<ParsedPost> parseWithAI({
    required String text,
    Map<String, String>? location,
  }) async {
    return _repository.parseWithAI(text: text, location: location);
  }

  Future<Post> updatePost(String postId, Map<String, dynamic> data) async {
    final updated = await _repository.updatePost(postId, data);
    _replacePost(updated);
    return updated;
  }

  Future<void> deletePost(String postId) async {
    await _repository.deletePost(postId);
    state = state.copyWith(
      posts: state.posts.where((p) => p.id != postId).toList(),
    );
  }

  /// Backend returns `{ postId, newExpiresAt, extensionsRemaining }` — not a
  /// full Post. Callers should invalidate `postDetailProvider(postId)` (and
  /// optionally refresh the list) to pick up the change.
  Future<ExtendPostResult> extendPost(String postId) async {
    return _repository.extendPost(postId);
  }

  /// Backend returns `{ postId, status: 'filled' }`. Same caller responsibility
  /// as [extendPost].
  Future<MarkFilledResult> markFilled(String postId) async {
    return _repository.markFilled(postId);
  }

  Future<Post> repost(String postId) async {
    final updated = await _repository.repost(postId);
    _replacePost(updated);
    return updated;
  }

  void _replacePost(Post updated) {
    state = state.copyWith(
      posts: state.posts.map((p) => p.id == updated.id ? updated : p).toList(),
    );
  }

  String _extractError(Object e) {
    if (e is DioException && e.error is ApiException) {
      return (e.error as ApiException).error.userMessage;
    }
    return 'Something went wrong. Please try again.';
  }
}

// ── Providers ──

final postRepositoryProvider = Provider<PostRepository>((ref) {
  return PostRepository();
});

final postsProvider = StateNotifierProvider<PostsNotifier, PostsState>((ref) {
  return PostsNotifier(ref.read(postRepositoryProvider));
});

final postDetailProvider =
    FutureProvider.autoDispose.family<Post, String>((ref, postId) async {
  final repo = ref.read(postRepositoryProvider);
  return repo.getPostById(postId);
});
