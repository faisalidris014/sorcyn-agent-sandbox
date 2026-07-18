import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../data/models/notification_model.dart';
import '../../providers/notification_provider.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final notifier = ref.read(notificationsProvider.notifier);
      notifier.loadNotifications();
      notifier.startSocketListening();
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(notificationsProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationsProvider);
    final hasUnread = state.notifications.any((n) => !n.read);
    final unreadCount = state.notifications.where((n) => !n.read).length;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        automaticallyImplyLeading: false,
        leading: Padding(
          padding: const EdgeInsets.only(left: 16),
          child: Center(
            child: GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppColors.border,
                    width: 1.5,
                  ),
                ),
                child: const Icon(
                  Icons.chevron_left,
                  color: AppColors.black,
                  size: 22,
                ),
              ),
            ),
          ),
        ),
        title: const Text(
          'Notifications',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: AppColors.black,
            letterSpacing: -0.02,
          ),
        ),
        centerTitle: false,
        titleSpacing: 8,
        actions: [
          if (hasUnread)
            Padding(
              padding: const EdgeInsets.only(right: 20),
              child: GestureDetector(
                onTap: () {
                  ref.read(notificationsProvider.notifier).markAllRead();
                  ref.invalidate(notificationUnreadCountProvider);
                },
                child: const Text(
                  'Mark all read',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // Filter chips
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
            child: Row(
              children: [
                _FilterChip(
                  label: 'All',
                  selected: !state.unreadOnly,
                  onTap: () => ref
                      .read(notificationsProvider.notifier)
                      .setUnreadFilter(false),
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  label: 'Unread',
                  selected: state.unreadOnly,
                  onTap: () => ref
                      .read(notificationsProvider.notifier)
                      .setUnreadFilter(true),
                  count: unreadCount,
                ),
              ],
            ),
          ),

          // List
          Expanded(
            child: state.isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: AppColors.primary,
                      strokeWidth: 2.5,
                    ),
                  )
                : state.notifications.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        color: AppColors.primary,
                        onRefresh: () => ref
                            .read(notificationsProvider.notifier)
                            .loadNotifications(),
                        child: ListView.separated(
                          controller: _scrollController,
                          itemCount: state.notifications.length +
                              (state.isLoadingMore ? 1 : 0),
                          separatorBuilder: (context, index) => Padding(
                            padding: const EdgeInsets.only(left: 64),
                            child: Container(
                              height: 1,
                              color: const Color(0xFFF0F0F0),
                            ),
                          ),
                          itemBuilder: (context, index) {
                            if (index == state.notifications.length) {
                              return const Padding(
                                padding: EdgeInsets.all(16),
                                child: Center(
                                  child: CircularProgressIndicator(
                                    color: AppColors.primary,
                                    strokeWidth: 2.5,
                                  ),
                                ),
                              );
                            }

                            final notification = state.notifications[index];
                            return _NotificationItem(
                              notification: notification,
                              onTap: () {
                                if (!notification.read) {
                                  ref
                                      .read(notificationsProvider.notifier)
                                      .markRead(notification.id);
                                  ref.invalidate(
                                      notificationUnreadCountProvider);
                                }
                                final actionUrl = notification.actionUrl;
                                if (actionUrl != null &&
                                    actionUrl.isNotEmpty) {
                                  context.push(actionUrl);
                                }
                              },
                              onDismiss: () {
                                ref
                                    .read(notificationsProvider.notifier)
                                    .deleteNotification(notification.id);
                                ref.invalidate(
                                    notificationUnreadCountProvider);
                              },
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.greyLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.notifications_none_rounded,
                size: 32,
                color: AppColors.greyMedium,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'All caught up!',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.black,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'No notifications to show',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Notification Item ──

class _NotificationItem extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  const _NotificationItem({
    required this.notification,
    required this.onTap,
    required this.onDismiss,
  });

  IconData _iconForType(String type) {
    return switch (type) {
      'offer_received' || 'offer_accepted' || 'offer_declined' =>
        Icons.local_offer_rounded,
      'message_new' => Icons.chat_bubble_rounded,
      'escrow_auto_released' || 'payment_received' || 'payment_released' =>
        Icons.attach_money_rounded,
      'transaction_completed' || 'transaction_cancelled' =>
        Icons.receipt_long_rounded,
      'post_expired' => Icons.timer_off_rounded,
      'review_reminder' => Icons.rate_review_rounded,
      'verification_approved' || 'verification_rejected' =>
        Icons.verified_user_rounded,
      'dispute_created' || 'dispute_resolved' => Icons.gavel_rounded,
      _ => Icons.notifications_rounded,
    };
  }

  /// Returns the background color for the type icon circle.
  Color _bgColorForType(String type) {
    return switch (type) {
      'offer_received' || 'offer_accepted' || 'offer_declined' =>
        const Color(0xFF7C3AED).withValues(alpha: 0.1), // purple
      'message_new' =>
        const Color(0xFF2563EB).withValues(alpha: 0.1), // blue
      'escrow_auto_released' ||
      'payment_received' ||
      'payment_released' ||
      'transaction_completed' =>
        const Color(0xFF10B981).withValues(alpha: 0.1), // green
      'transaction_cancelled' ||
      'post_expired' ||
      'verification_rejected' =>
        const Color(0xFFF59E0B).withValues(alpha: 0.1), // amber
      _ => const Color(0xFFF59E0B).withValues(alpha: 0.1), // amber/system
    };
  }

  /// Returns the icon color for the type.
  Color _iconColorForType(String type) {
    return switch (type) {
      'offer_received' || 'offer_accepted' || 'offer_declined' =>
        const Color(0xFF7C3AED),
      'message_new' => const Color(0xFF2563EB),
      'escrow_auto_released' ||
      'payment_received' ||
      'payment_released' ||
      'transaction_completed' =>
        const Color(0xFF10B981),
      'transaction_cancelled' ||
      'post_expired' ||
      'verification_rejected' =>
        const Color(0xFFF59E0B),
      _ => const Color(0xFFF59E0B),
    };
  }

  @override
  Widget build(BuildContext context) {
    final isUnread = !notification.read;

    return Dismissible(
      key: Key(notification.id),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDismiss(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 24),
        decoration: BoxDecoration(
          color: AppColors.error.withValues(alpha: 0.08),
        ),
        child: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: AppColors.error.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(
            Icons.delete_outline,
            size: 18,
            color: AppColors.error,
          ),
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            color: isUnread
                ? const Color(0xFF7C3AED).withValues(alpha: 0.02)
                : Colors.transparent,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Type icon circle
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: _bgColorForType(notification.type),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _iconForType(notification.type),
                    size: 16,
                    color: _iconColorForType(notification.type),
                  ),
                ),
                const SizedBox(width: 12),

                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        notification.title,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight:
                              isUnread ? FontWeight.w700 : FontWeight.w600,
                          color: AppColors.black,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 3),
                      Text(
                        notification.message,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF6B7280),
                          height: 1.4,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        formatRelativeDate(notification.createdAt),
                        style: const TextStyle(
                          fontSize: 11,
                          color: Color(0xFF9CA3AF),
                        ),
                      ),
                    ],
                  ),
                ),

                // Unread dot
                if (isUnread) ...[
                  const SizedBox(width: 8),
                  Container(
                    width: 8,
                    height: 8,
                    margin: const EdgeInsets.only(top: 6),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Filter Chip ──

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final int? count;

  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.count,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          gradient: selected ? AppColors.primaryGradient : null,
          color: selected ? null : const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(20),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.25),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ]
              : [],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: selected ? Colors.white : AppColors.grey,
              ),
            ),
            if (count != null && count! > 0) ...[
              const SizedBox(width: 6),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(
                  color: selected
                      ? Colors.white.withValues(alpha: 0.25)
                      : AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: selected ? Colors.white : AppColors.primary,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
