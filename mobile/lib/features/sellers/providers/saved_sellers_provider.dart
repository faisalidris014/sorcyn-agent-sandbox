import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/saved_seller_model.dart';
import '../data/repositories/saved_sellers_repository.dart';

// ── State ──

class SavedSellersState {
  final List<SavedSellerEntry> sellers;
  final bool isLoading;
  final String? error;
  final int total;

  const SavedSellersState({
    this.sellers = const [],
    this.isLoading = false,
    this.error,
    this.total = 0,
  });

  bool isSaved(String sellerProfileId) =>
      sellers.any((e) => e.seller.id == sellerProfileId);

  SavedSellersState copyWith({
    List<SavedSellerEntry>? sellers,
    bool? isLoading,
    String? error,
    int? total,
    bool clearError = false,
  }) {
    return SavedSellersState(
      sellers: sellers ?? this.sellers,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      total: total ?? this.total,
    );
  }
}

// ── Notifier ──

class SavedSellersNotifier extends StateNotifier<SavedSellersState> {
  final SavedSellersRepository _repository;

  SavedSellersNotifier(this._repository) : super(const SavedSellersState());

  Future<void> load() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _repository.listSavedSellers();
      state = state.copyWith(
        sellers: result.sellers,
        total: result.total,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: _message(e),
      );
    }
  }

  Future<void> toggleSave(String sellerProfileId) async {
    final wasSaved = state.isSaved(sellerProfileId);
    // Optimistic update
    if (wasSaved) {
      state = state.copyWith(
        sellers: state.sellers.where((e) => e.seller.id != sellerProfileId).toList(),
        total: state.total > 0 ? state.total - 1 : 0,
      );
    }
    try {
      if (wasSaved) {
        await _repository.unsaveSeller(sellerProfileId);
      } else {
        await _repository.saveSeller(sellerProfileId);
        // Reload to get the full entry with seller details
        await load();
      }
    } catch (e) {
      // Rollback optimistic update on failure
      await load();
    }
  }

  String _message(Object e) {
    if (e is DioException) return e.message ?? 'Network error';
    return e.toString();
  }
}

// ── Providers ──

final savedSellersRepositoryProvider = Provider<SavedSellersRepository>((_) {
  return SavedSellersRepository();
});

final savedSellersProvider =
    StateNotifierProvider<SavedSellersNotifier, SavedSellersState>((ref) {
  return SavedSellersNotifier(ref.read(savedSellersRepositoryProvider));
});
