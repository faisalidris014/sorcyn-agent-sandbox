import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_response.dart';
import '../../../core/network/dio_client.dart';
import '../data/models/offer_model.dart';
import '../data/repositories/offer_repository.dart';

// ── State ──

class OffersState {
  final List<Offer> offers;
  final PaginationMeta? meta;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final String sortBy;

  const OffersState({
    this.offers = const [],
    this.meta,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.sortBy = 'best_match',
  });

  bool get hasMore => meta != null && meta!.page < meta!.totalPages;

  OffersState copyWith({
    List<Offer>? offers,
    PaginationMeta? meta,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    String? sortBy,
    bool clearError = false,
  }) {
    return OffersState(
      offers: offers ?? this.offers,
      meta: meta ?? this.meta,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: clearError ? null : (error ?? this.error),
      sortBy: sortBy ?? this.sortBy,
    );
  }
}

// ── Notifier ──

class OffersNotifier extends StateNotifier<OffersState> {
  final OfferRepository _repository;
  String? _currentPostId;

  OffersNotifier(this._repository) : super(const OffersState());

  Future<void> loadPostOffers(String postId, {bool refresh = false}) async {
    if (state.isLoading) return;
    _currentPostId = postId;
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      offers: refresh ? [] : null,
    );
    try {
      final result = await _repository.getPostOffers(
        postId,
        sort: state.sortBy,
        page: 1,
      );
      state = state.copyWith(
        offers: result.offers,
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
    if (state.isLoadingMore || !state.hasMore || _currentPostId == null) return;
    state = state.copyWith(isLoadingMore: true);
    try {
      final nextPage = (state.meta?.page ?? 0) + 1;
      final result = await _repository.getPostOffers(
        _currentPostId!,
        sort: state.sortBy,
        page: nextPage,
      );
      state = state.copyWith(
        offers: [...state.offers, ...result.offers],
        meta: result.meta,
        isLoadingMore: false,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  void setSortBy(String sort) {
    state = state.copyWith(sortBy: sort);
    if (_currentPostId != null) {
      loadPostOffers(_currentPostId!, refresh: true);
    }
  }

  Future<AcceptOfferResult> acceptOffer(String offerId) async {
    return _repository.acceptOffer(offerId);
  }

  /// Buyer declines a seller's offer on their post.
  Future<void> declineOffer(String offerId) async {
    return _repository.declineOffer(offerId);
  }

  Future<Offer> counterOffer(
    String offerId, {
    required double counterAmount,
    String? counterMessage,
  }) async {
    return _repository.counterOffer(
      offerId,
      counterAmount: counterAmount,
      counterMessage: counterMessage,
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

final offerRepositoryProvider = Provider<OfferRepository>((ref) {
  return OfferRepository();
});

final offersProvider =
    StateNotifierProvider<OffersNotifier, OffersState>((ref) {
  return OffersNotifier(ref.read(offerRepositoryProvider));
});

final offerDetailProvider =
    FutureProvider.family<Offer, String>((ref, offerId) async {
  final repo = ref.read(offerRepositoryProvider);
  return repo.getOfferById(offerId);
});

/// The current seller's live offer on a given post, or null if none.
/// Drives the state-aware post-detail action button (Submit / Pending /
/// Start Work / Resubmit) so the seller can't blindly re-open the offer
/// form on a post they've already bid on. Withdrawn offers are treated as
/// "no offer" (the seller may submit again, subject to the backend cooldown).
final myOfferForPostProvider =
    FutureProvider.family<Offer?, String>((ref, postId) async {
  final repo = ref.read(offerRepositoryProvider);
  final result = await repo.getMyOffers(page: 1, sort: 'newest');
  for (final o in result.offers) {
    if (o.postId == postId && o.status != 'withdrawn') return o;
  }
  return null;
});

// ── My Offers (Seller) ──

class MyOffersState {
  final List<Offer> offers;
  final PaginationMeta? meta;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final String? statusFilter;
  final String sortBy;

  const MyOffersState({
    this.offers = const [],
    this.meta,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.statusFilter,
    this.sortBy = 'newest',
  });

  bool get hasMore => meta != null && meta!.page < meta!.totalPages;

  MyOffersState copyWith({
    List<Offer>? offers,
    PaginationMeta? meta,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    String? statusFilter,
    String? sortBy,
    bool clearError = false,
    bool clearStatusFilter = false,
  }) {
    return MyOffersState(
      offers: offers ?? this.offers,
      meta: meta ?? this.meta,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: clearError ? null : (error ?? this.error),
      statusFilter:
          clearStatusFilter ? null : (statusFilter ?? this.statusFilter),
      sortBy: sortBy ?? this.sortBy,
    );
  }
}

class MyOffersNotifier extends StateNotifier<MyOffersState> {
  final OfferRepository _repository;

  MyOffersNotifier(this._repository) : super(const MyOffersState());

  Future<void> loadMyOffers({bool refresh = false}) async {
    if (state.isLoading) return;
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      offers: refresh ? [] : null,
    );
    try {
      final result = await _repository.getMyOffers(
        status: state.statusFilter,
        sort: state.sortBy,
        page: 1,
      );
      state = state.copyWith(
        offers: result.offers,
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
      final result = await _repository.getMyOffers(
        status: state.statusFilter,
        sort: state.sortBy,
        page: nextPage,
      );
      state = state.copyWith(
        offers: [...state.offers, ...result.offers],
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
    loadMyOffers(refresh: true);
  }

  void setSortBy(String sort) {
    state = state.copyWith(sortBy: sort);
    loadMyOffers(refresh: true);
  }

  Future<Offer> submitOffer(CreateOfferInput input) async {
    return _repository.submitOffer(input);
  }

  Future<Offer> updateOffer(
      String offerId, Map<String, dynamic> data) async {
    return _repository.updateOffer(offerId, data);
  }

  Future<void> withdrawOffer(String offerId) async {
    await _repository.withdrawOffer(offerId);
    state = state.copyWith(
      offers: state.offers.where((o) => o.id != offerId).toList(),
    );
  }

  String _extractError(Object e) {
    if (e is DioException && e.error is ApiException) {
      return (e.error as ApiException).error.userMessage;
    }
    return 'Something went wrong. Please try again.';
  }
}

final myOffersProvider =
    StateNotifierProvider<MyOffersNotifier, MyOffersState>((ref) {
  return MyOffersNotifier(ref.read(offerRepositoryProvider));
});
