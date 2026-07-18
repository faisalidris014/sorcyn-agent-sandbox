import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_response.dart';
import '../../../core/network/socket_client.dart';
import '../data/models/notification_model.dart';
import '../data/repositories/notification_repository.dart';

class NotificationsState {
  final List<AppNotification> notifications;
  final PaginationMeta? meta;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final bool unreadOnly;

  const NotificationsState({
    this.notifications = const [],
    this.meta,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.unreadOnly = false,
  });

  bool get hasMore =>
      meta != null && meta!.page < meta!.totalPages;

  int get unreadCount =>
      notifications.where((n) => !n.read).length;

  NotificationsState copyWith({
    List<AppNotification>? notifications,
    PaginationMeta? meta,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    bool? unreadOnly,
    bool clearError = false,
  }) {
    return NotificationsState(
      notifications: notifications ?? this.notifications,
      meta: meta ?? this.meta,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: clearError ? null : (error ?? this.error),
      unreadOnly: unreadOnly ?? this.unreadOnly,
    );
  }
}

class NotificationsNotifier extends StateNotifier<NotificationsState> {
  final NotificationRepository _repository;
  StreamSubscription? _socketSub;

  NotificationsNotifier(this._repository)
      : super(const NotificationsState());

  void startSocketListening() {
    _socketSub?.cancel();
    _socketSub = SocketClient.instance.onNotification.listen((_) {
      // Refresh notifications list when a new notification arrives via socket
      loadNotifications();
    });
  }

  Future<void> loadNotifications() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _repository.getNotifications(
        unreadOnly: state.unreadOnly,
      );
      state = state.copyWith(
        notifications: result.items,
        meta: result.meta,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load notifications',
      );
    }
  }

  Future<void> loadMore() async {
    if (!state.hasMore || state.isLoadingMore) return;
    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await _repository.getNotifications(
        page: (state.meta?.page ?? 0) + 1,
        unreadOnly: state.unreadOnly,
      );
      state = state.copyWith(
        notifications: [...state.notifications, ...result.items],
        meta: result.meta,
        isLoadingMore: false,
      );
    } catch (_) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  void setUnreadFilter(bool unreadOnly) {
    state = state.copyWith(unreadOnly: unreadOnly);
    loadNotifications();
  }

  Future<void> markRead(String notificationId) async {
    try {
      await _repository.markRead(notificationId);
      state = state.copyWith(
        notifications: state.notifications.map((n) {
          if (n.id == notificationId) {
            return AppNotification(
              id: n.id,
              type: n.type,
              title: n.title,
              message: n.message,
              data: n.data,
              actionUrl: n.actionUrl,
              read: true,
              readAt: DateTime.now(),
              createdAt: n.createdAt,
            );
          }
          return n;
        }).toList(),
      );
    } catch (_) {}
  }

  Future<void> markAllRead() async {
    try {
      await _repository.markAllRead();
      state = state.copyWith(
        notifications: state.notifications.map((n) {
          return AppNotification(
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            data: n.data,
            actionUrl: n.actionUrl,
            read: true,
            readAt: DateTime.now(),
            createdAt: n.createdAt,
          );
        }).toList(),
      );
    } catch (_) {}
  }

  Future<void> deleteNotification(String notificationId) async {
    try {
      await _repository.deleteNotification(notificationId);
      state = state.copyWith(
        notifications:
            state.notifications.where((n) => n.id != notificationId).toList(),
      );
    } catch (_) {}
  }

  @override
  void dispose() {
    _socketSub?.cancel();
    super.dispose();
  }
}

// ── Providers ──

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository();
});

final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
  return NotificationsNotifier(ref.read(notificationRepositoryProvider));
});

/// Global unread count for the notification bell badge.
final notificationUnreadCountProvider = FutureProvider<int>((ref) async {
  final repo = ref.read(notificationRepositoryProvider);
  try {
    final result = await repo.getNotifications(unreadOnly: true, limit: 1);
    return result.meta?.total ?? 0;
  } catch (_) {
    return 0;
  }
});
