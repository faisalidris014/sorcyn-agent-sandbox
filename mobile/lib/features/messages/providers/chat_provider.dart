import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_response.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/network/socket_client.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/models/message_model.dart';
import '../data/repositories/message_repository.dart';
import 'conversations_provider.dart';

// ── State ──

class ChatState {
  final ConversationDetail? conversation;
  final List<Message> messages;
  final PaginationMeta? meta;
  final bool isLoading;
  final bool isLoadingMore;
  final bool isSending;
  final String? error;
  final List<String> optimisticMessageIds;
  final bool isOtherTyping;
  final String? typingUserName;

  const ChatState({
    this.conversation,
    this.messages = const [],
    this.meta,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.isSending = false,
    this.error,
    this.optimisticMessageIds = const [],
    this.isOtherTyping = false,
    this.typingUserName,
  });

  bool get hasMore => meta != null && meta!.page < meta!.totalPages;

  ChatState copyWith({
    ConversationDetail? conversation,
    List<Message>? messages,
    PaginationMeta? meta,
    bool? isLoading,
    bool? isLoadingMore,
    bool? isSending,
    String? error,
    List<String>? optimisticMessageIds,
    bool? isOtherTyping,
    String? typingUserName,
    bool clearError = false,
    bool clearTyping = false,
  }) {
    return ChatState(
      conversation: conversation ?? this.conversation,
      messages: messages ?? this.messages,
      meta: meta ?? this.meta,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      isSending: isSending ?? this.isSending,
      error: clearError ? null : (error ?? this.error),
      optimisticMessageIds:
          optimisticMessageIds ?? this.optimisticMessageIds,
      isOtherTyping:
          clearTyping ? false : (isOtherTyping ?? this.isOtherTyping),
      typingUserName:
          clearTyping ? null : (typingUserName ?? this.typingUserName),
    );
  }
}

// ── Notifier ──

class ChatNotifier extends StateNotifier<ChatState> {
  final MessageRepository _repository;
  final String _currentUserId;
  final Ref _ref;
  final String _conversationId;
  Timer? _pollingTimer;
  Timer? _typingTimeout;
  StreamSubscription<Map<String, dynamic>>? _messageSub;
  StreamSubscription<Map<String, dynamic>>? _typingStartSub;
  StreamSubscription<Map<String, dynamic>>? _typingStopSub;
  StreamSubscription<Map<String, dynamic>>? _readSub;
  bool _pollingStopped = false;

  ChatNotifier(
    this._repository,
    this._currentUserId,
    this._ref,
    this._conversationId,
  ) : super(const ChatState());

  @override
  void dispose() {
    _pollingStopped = true;
    _pollingTimer?.cancel();
    _typingTimeout?.cancel();
    _messageSub?.cancel();
    _typingStartSub?.cancel();
    _typingStopSub?.cancel();
    _readSub?.cancel();
    // Leave the conversation room
    SocketClient.instance.leaveConversation(_conversationId);
    super.dispose();
  }

  Future<void> loadConversation() async {
    if (state.isLoading) return;
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result =
          await _repository.getConversationDetail(_conversationId);
      state = state.copyWith(
        conversation: result.conversation,
        messages: result.messages, // Already oldest-first from backend
        meta: result.meta,
        isLoading: false,
      );
      // Mark as read
      await _repository.markRead(_conversationId);
      // Refresh conversations list to update unread count
      _ref.read(conversationsProvider.notifier).pollConversations();
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _extractError(e));
    }
  }

  Future<void> loadMoreMessages() async {
    if (state.isLoadingMore || !state.hasMore) return;
    state = state.copyWith(isLoadingMore: true);
    try {
      final nextPage = (state.meta?.page ?? 0) + 1;
      final result = await _repository.getConversationDetail(
        _conversationId,
        page: nextPage,
      );
      // Prepend older messages
      state = state.copyWith(
        messages: [...result.messages, ...state.messages],
        meta: result.meta,
        isLoadingMore: false,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty) return;
    state = state.copyWith(isSending: true);

    // Stop typing indicator when sending
    SocketClient.instance.emitTypingStop(_conversationId);

    // Optimistic message
    final optimisticId = 'temp-${DateTime.now().millisecondsSinceEpoch}';
    final optimisticMessage = Message(
      id: optimisticId,
      conversationId: _conversationId,
      senderId: _currentUserId,
      messageText: text.trim(),
      sender: MessageSender(
        id: _currentUserId,
        firstName: '',
        lastName: '',
      ),
      createdAt: DateTime.now(),
    );

    state = state.copyWith(
      messages: [...state.messages, optimisticMessage],
      optimisticMessageIds: [...state.optimisticMessageIds, optimisticId],
    );

    try {
      final sentMessage =
          await _repository.sendMessage(_conversationId, text.trim());

      // Replace optimistic with real message
      final updatedMessages =
          state.messages.where((m) => m.id != optimisticId).toList()
            ..add(sentMessage);

      state = state.copyWith(
        messages: updatedMessages,
        optimisticMessageIds: state.optimisticMessageIds
            .where((id) => id != optimisticId)
            .toList(),
        isSending: false,
      );

      // Refresh conversations list
      _ref.read(conversationsProvider.notifier).pollConversations();
    } catch (e) {
      // Remove optimistic message on error
      state = state.copyWith(
        messages:
            state.messages.where((m) => m.id != optimisticId).toList(),
        optimisticMessageIds: state.optimisticMessageIds
            .where((id) => id != optimisticId)
            .toList(),
        isSending: false,
        error: _extractError(e),
      );
    }
  }

  // ── Socket.IO integration ──

  /// Subscribe to real-time events and join the conversation room.
  void startSocketListening() {
    final socket = SocketClient.instance;
    socket.joinConversation(_conversationId);

    _messageSub = socket.onNewMessage.listen(_handleNewMessage);
    _typingStartSub = socket.onTypingStart.listen(_handleTypingStart);
    _typingStopSub = socket.onTypingStop.listen(_handleTypingStop);
    _readSub = socket.onMessagesRead.listen(_handleMessagesRead);
  }

  void _handleNewMessage(Map<String, dynamic> data) {
    if (!mounted) return;
    final convId = data['conversationId'] as String?;
    if (convId != _conversationId) return;

    final senderId = data['senderId'] as String?;
    if (senderId == _currentUserId) return; // Ignore own messages (handled optimistically)

    // Check if message already exists
    final messageId = data['id'] as String?;
    if (messageId != null && state.messages.any((m) => m.id == messageId)) {
      return;
    }

    try {
      final message = Message.fromJson(data);
      state = state.copyWith(
        messages: [...state.messages, message],
        clearTyping: true, // Clear typing indicator when message arrives
      );
      // Mark as read since user is viewing this conversation
      _repository.markRead(_conversationId);
      _ref.read(conversationsProvider.notifier).pollConversations();
    } catch (_) {
      // If parsing fails, fall back to polling
    }
  }

  void _handleTypingStart(Map<String, dynamic> data) {
    if (!mounted) return;
    if (data['conversationId'] != _conversationId) return;
    if (data['userId'] == _currentUserId) return;

    state = state.copyWith(
      isOtherTyping: true,
      typingUserName: data['firstName'] as String?,
    );

    // Auto-clear typing after 4 seconds of no updates
    _typingTimeout?.cancel();
    _typingTimeout = Timer(const Duration(seconds: 4), () {
      if (mounted) {
        state = state.copyWith(clearTyping: true);
      }
    });
  }

  void _handleTypingStop(Map<String, dynamic> data) {
    if (!mounted) return;
    if (data['conversationId'] != _conversationId) return;
    if (data['userId'] == _currentUserId) return;

    _typingTimeout?.cancel();
    state = state.copyWith(clearTyping: true);
  }

  void _handleMessagesRead(Map<String, dynamic> data) {
    if (!mounted) return;
    if (data['conversationId'] != _conversationId) return;
    // Could update individual message read receipts in the future
  }

  // ── Typing emission ──

  void onUserTyping() {
    SocketClient.instance.emitTypingStart(_conversationId);
  }

  void onUserStoppedTyping() {
    SocketClient.instance.emitTypingStop(_conversationId);
  }

  // ── Polling fallback ──

  /// Silently fetch new messages (no loading indicators).
  Future<void> pollMessages() async {
    if (_pollingStopped) return;
    try {
      final result =
          await _repository.getConversationDetail(_conversationId);
      if (mounted && !_pollingStopped) {
        state = state.copyWith(
          messages: result.messages,
          meta: result.meta,
        );
        await _repository.markRead(_conversationId);
        _ref.read(conversationsProvider.notifier).pollConversations();
      }
    } catch (_) {
      // Silently fail
    }
  }

  void startPolling() {
    _pollingStopped = false;
    _pollingTimer?.cancel();
    // Reduced to 30s when socket is active, serves as a fallback
    _pollingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      pollMessages();
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
    return 'Something went wrong. Please try again.';
  }
}

// ── Provider ──

// autoDispose: the chat state for a conversation is disposed as soon as no
// widget watches it (i.e. the user navigates away). Without this, every
// conversation the user has ever opened in the session kept its messages in
// memory forever — a real leak in a high-volume marketplace chat app. The
// ChatNotifier.dispose() already cleans up sockets, timers, and stream
// subscriptions, so disposal is safe.
final chatProvider =
    StateNotifierProvider.autoDispose
        .family<ChatNotifier, ChatState, String>(
  (ref, conversationId) {
    final repo = ref.read(messageRepositoryProvider);
    final userId = ref.read(authProvider).user?.id ?? '';
    return ChatNotifier(repo, userId, ref, conversationId);
  },
);
