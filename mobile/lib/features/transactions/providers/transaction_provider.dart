import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_response.dart';
import '../../../core/network/dio_client.dart';
import '../data/models/transaction_model.dart';
import '../data/repositories/transaction_repository.dart';

// ── State ──

class TransactionsState {
  final List<Transaction> transactions;
  final PaginationMeta? meta;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final String? statusFilter;
  final String sortBy;

  /// Which side of the transaction to load: 'buyer' (purchases) or 'seller'
  /// (jobs). Driven by the active app mode so sellers see their jobs and reach
  /// the seller transaction-detail screen (#290).
  final String role;

  const TransactionsState({
    this.transactions = const [],
    this.meta,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.statusFilter,
    this.sortBy = 'newest',
    this.role = 'buyer',
  });

  bool get hasMore => meta != null && meta!.page < meta!.totalPages;

  TransactionsState copyWith({
    List<Transaction>? transactions,
    PaginationMeta? meta,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    String? statusFilter,
    String? sortBy,
    String? role,
    bool clearError = false,
    bool clearStatusFilter = false,
  }) {
    return TransactionsState(
      transactions: transactions ?? this.transactions,
      meta: meta ?? this.meta,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: clearError ? null : (error ?? this.error),
      statusFilter:
          clearStatusFilter ? null : (statusFilter ?? this.statusFilter),
      sortBy: sortBy ?? this.sortBy,
      role: role ?? this.role,
    );
  }
}

// ── Notifier ──

class TransactionsNotifier extends StateNotifier<TransactionsState> {
  final TransactionRepository _repository;

  TransactionsNotifier(this._repository) : super(const TransactionsState());

  Future<void> loadMyTransactions({bool refresh = false, String? role}) async {
    if (state.isLoading) return;
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      role: role,
      transactions: refresh ? [] : null,
    );
    try {
      final result = await _repository.getMyTransactions(
        role: state.role,
        status: state.statusFilter,
        sort: state.sortBy,
        page: 1,
      );
      state = state.copyWith(
        transactions: result.transactions,
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
      final result = await _repository.getMyTransactions(
        role: state.role,
        status: state.statusFilter,
        sort: state.sortBy,
        page: nextPage,
      );
      state = state.copyWith(
        transactions: [...state.transactions, ...result.transactions],
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
    loadMyTransactions(refresh: true);
  }

  void setSortBy(String sort) {
    state = state.copyWith(sortBy: sort);
    loadMyTransactions(refresh: true);
  }

  Future<void> approveTransaction(
    String transactionId, {
    List<String>? completionPhotos,
    String? note,
  }) async {
    await _repository.approveTransaction(
      transactionId,
      completionPhotos: completionPhotos,
      note: note,
    );
    _updateStatus(transactionId, 'completed');
  }

  Future<void> requestChanges(
      String transactionId, String reason) async {
    await _repository.requestChanges(transactionId, reason);
    _updateStatus(transactionId, 'in_progress');
  }

  Future<void> cancelTransaction(
      String transactionId, String reason) async {
    await _repository.cancelTransaction(transactionId, reason);
    _updateStatus(transactionId, 'cancelled');
  }

  // ── Seller methods ──

  Future<void> updateTransactionStatus(
    String transactionId, {
    required String status,
    String? scheduledDate,
    String? scheduledTime,
    String? specialInstructions,
    String? trackingNumber,
    String? carrier,
    String? estimatedDeliveryDate,
    String? meetupLocation,
    String? meetupDate,
    String? meetupTime,
    String? note,
  }) async {
    await _repository.updateTransactionStatus(
      transactionId,
      status: status,
      scheduledDate: scheduledDate,
      scheduledTime: scheduledTime,
      specialInstructions: specialInstructions,
      trackingNumber: trackingNumber,
      carrier: carrier,
      estimatedDeliveryDate: estimatedDeliveryDate,
      meetupLocation: meetupLocation,
      meetupDate: meetupDate,
      meetupTime: meetupTime,
      note: note,
    );
    _updateStatus(transactionId, status);
  }

  Future<void> markComplete(
    String transactionId, {
    required List<String> afterPhotos,
    List<String>? beforePhotos,
    String? workSummary,
    String? completionNotes,
  }) async {
    await _repository.markComplete(
      transactionId,
      afterPhotos: afterPhotos,
      beforePhotos: beforePhotos,
      workSummary: workSummary,
      completionNotes: completionNotes,
    );
    _updateStatus(transactionId, 'awaiting_approval');
  }

  void _updateStatus(String id, String newStatus) {
    state = state.copyWith(
      transactions: state.transactions.map((t) {
        if (t.id == id) {
          return Transaction.fromJson({...t.toJson(), 'status': newStatus});
        }
        return t;
      }).toList(),
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

final transactionRepositoryProvider =
    Provider<TransactionRepository>((ref) {
  return TransactionRepository();
});

final transactionsProvider =
    StateNotifierProvider<TransactionsNotifier, TransactionsState>((ref) {
  return TransactionsNotifier(ref.read(transactionRepositoryProvider));
});

// autoDispose so each time a transaction-detail screen opens it refetches the
// current server state instead of serving a cached snapshot. Without this, a
// detail screen reopened after a status change (e.g. completion) showed a stale
// status (#290).
final transactionDetailProvider =
    FutureProvider.family.autoDispose<Transaction, String>(
        (ref, transactionId) async {
  final repo = ref.read(transactionRepositoryProvider);
  return repo.getTransactionById(transactionId);
});
