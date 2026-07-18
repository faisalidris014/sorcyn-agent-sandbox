import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_response.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/network/socket_client.dart';
import '../data/models/conversation_model.dart';
import '../data/repositories/message_repository.dart';

// ── State ──

class ConversationsState {
  final List<Conversation> conversations;
  final PaginationMeta? meta;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final String? statusFilter;

  const ConversationsState({
    this.conversations = const [],
    this.meta,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.statusFilter,
  });

  bool get hasMore => meta != null && meta!.page < meta!.totalPages;

  int get totalUnread =>
      conversations.fold<int>(0, (sum, c) => sum + c.unreadCount);

  ConversationsState copyWith({
    List<Conversation>? conversations,
    PaginationMeta? meta,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    String? statusFilter,
    bool clearError = false,
    bool clearStatusFilter = false,
  }) {
    return ConversationsState(
      conversations: conversations ?? this.conversations,
      meta: meta ?? this.meta,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: clearError ? null : (error ?? this.error),
      statusFilter:
          clearStatusFilter ? null : (statusFilter ?? this.statusFilter),
    );
  }
}

// ── Notifier ──

class ConversationsNotifier extends StateNotifier<ConversationsState> {
  final MessageRepository _repository;
  Timer? _pollingTimer;
  StreamSubscription<Map<String, dynamic>>? _notificationSub;
  bool _pollingStopped = false;

  ConversationsNotifier(this._repository) : super(const ConversationsState());

  @override
  void dispose() {
    _pollingStopped = true;
    _pollingTimer?.cancel();
    _notificationSub?.cancel();
    super.dispose();
  }

  Future<void> loadConversations({bool refresh = false}) async {
    if (state.isLoading) return;
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      conversations: refresh ? [] : null,
    );
    try {
      final result = await _repository.getConversations(
        status: state.statusFilter,
        page: 1,
      );
      state = state.copyWith(
        conversations: result.conversations,
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
      final result = await _repository.getConversations(
        status: state.statusFilter,
        page: nextPage,
      );
      state = state.copyWith(
        conversations: [...state.conversations, ...result.conversations],
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
    loadConversations(refresh: true);
  }

  // ── Edit-mode bulk actions ──────────────────────────────────

  /// Delete (hide) the given conversations from this user's inbox. Optimistic:
  /// rows are removed immediately, then reloaded if any request fails.
  Future<void> deleteConversations(Set<String> ids) async {
    if (ids.isEmpty) return;
    final previous = state.conversations;
    state = state.copyWith(
      conversations: previous.where((c) => !ids.contains(c.id)).toList(),
    );
    try {
      await Future.wait(ids.map(_repository.deleteConversation));
    } catch (_) {
      // Reconcile with the server on any failure.
      await loadConversations(refresh: true);
    }
  }

  /// Mark the given conversations read (unreadCount → 0).
  Future<void> markConversationsRead(Set<String> ids) async {
    if (ids.isEmpty) return;
    _patchUnread(ids, 0);
    try {
      await Future.wait(ids.map(_repository.markRead));
    } catch (_) {
      await loadConversations(refresh: true);
    }
  }

  /// Mark the given conversations unread (unreadCount → at least 1).
  Future<void> markConversationsUnread(Set<String> ids) async {
    if (ids.isEmpty) return;
    _patchUnread(ids, 1, onlyIfZero: true);
    try {
      await Future.wait(ids.map(_repository.markUnread));
    } catch (_) {
      await loadConversations(refresh: true);
    }
  }

  void _patchUnread(Set<String> ids, int value, {bool onlyIfZero = false}) {
    state = state.copyWith(
      conversations: state.conversations.map((c) {
        if (!ids.contains(c.id)) return c;
        if (onlyIfZero && c.unreadCount > 0) return c;
        return Conversation(
          id: c.id,
          postId: c.postId,
          offerId: c.offerId,
          status: c.status,
          isLocked: c.isLocked,
          otherParticipant: c.otherParticipant,
          otherRole: c.otherRole,
          unreadCount: value,
          deal: c.deal,
          lastMessage: c.lastMessage,
          lastMessageAt: c.lastMessageAt,
          createdAt: c.createdAt,
        );
      }).toList(),
    );
  }

  // ── Socket.IO integration ──

  /// Start listening for real-time notification events to update
  /// conversation list (new messages, etc.).
  void startSocketListening() {
    _notificationSub?.cancel();
    _notificationSub =
        SocketClient.instance.onNotification.listen(_handleNotification);
  }

  void _handleNotification(Map<String, dynamic> data) {
    if (!mounted) return;
    final type = data['type'] as String?;
    if (type == 'message_received') {
      // Refresh conversations to get updated last message and unread count
      pollConversations();
    }
  }

  // ── Polling fallback ──

  /// Silently refresh conversations (no loading indicators).
  Future<void> pollConversations() async {
    if (_pollingStopped) return;
    try {
      final result = await _repository.getConversations(
        status: state.statusFilter,
        page: 1,
      );
      if (mounted && !_pollingStopped) {
        state = state.copyWith(
          conversations: result.conversations,
          meta: result.meta,
        );
      }
    } catch (_) {
      // Silently fail during polling
    }
  }

  void startPolling() {
    _pollingStopped = false;
    _pollingTimer?.cancel();
    // Reduced to 60s when socket is active, serves as a fallback
    _pollingTimer = Timer.periodic(const Duration(seconds: 60), (_) {
      pollConversations();
    });
  }

  void stopPolling() {
    _pollingStopped = true;
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  String _extractError(Object e) {
    if (e is DioException && e.error is ApiException) {
      return (e.error as ApiException).error.userMessage;
    }
    return 'Failed to load conversations';
  }
}

// ── Providers ──

final messageRepositoryProvider = Provider<MessageRepository>((ref) {
  return MessageRepository();
});

final conversationsProvider =
    StateNotifierProvider<ConversationsNotifier, ConversationsState>((ref) {
  return ConversationsNotifier(ref.read(messageRepositoryProvider));
});

final unreadCountProvider = Provider<int>((ref) {
  return ref.watch(conversationsProvider).totalUnread;
});
