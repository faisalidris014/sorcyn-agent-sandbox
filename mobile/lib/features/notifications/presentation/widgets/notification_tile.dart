import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../data/models/notification_model.dart';

class NotificationTile extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  const NotificationTile({
    super.key,
    required this.notification,
    required this.onTap,
    required this.onDismiss,
  });

  IconData _iconForType(String type) {
    return switch (type) {
      'offer_received' || 'offer_accepted' || 'offer_declined' =>
        Icons.local_offer,
      'message_new' => Icons.chat_bubble_outline,
      'escrow_auto_released' || 'payment_received' || 'payment_released' =>
        Icons.attach_money,
      'transaction_completed' || 'transaction_cancelled' =>
        Icons.receipt_long_outlined,
      'post_expired' => Icons.timer_off_outlined,
      'review_reminder' => Icons.rate_review_outlined,
      'verification_approved' || 'verification_rejected' =>
        Icons.verified_user_outlined,
      // #382 PR2: credential lapse lifecycle (license/insurance/background check).
      'credential_expiring' => Icons.hourglass_bottom,
      'credential_expired' => Icons.gpp_bad_outlined,
      'dispute_created' || 'dispute_resolved' => Icons.gavel,
      _ => Icons.notifications_outlined,
    };
  }

  Color _colorForType(String type) {
    return switch (type) {
      'offer_received' || 'offer_accepted' => AppColors.primary,
      'payment_received' || 'payment_released' ||
      'escrow_auto_released' ||
      'transaction_completed' ||
      'verification_approved' =>
        AppColors.success,
      'offer_declined' ||
      'transaction_cancelled' ||
      'post_expired' ||
      'verification_rejected' ||
      'credential_expired' =>
        AppColors.error,
      'message_new' => AppColors.info,
      'dispute_created' ||
      'dispute_resolved' ||
      'review_reminder' ||
      'credential_expiring' =>
        AppColors.warning,
      _ => AppColors.grey,
    };
  }

  @override
  Widget build(BuildContext context) {
    final isUnread = !notification.read;
    final color = _colorForType(notification.type);

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
          child: const Icon(Icons.delete_outline, size: 18, color: AppColors.error),
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Type icon
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _iconForType(notification.type),
                    size: 17,
                    color: color,
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
                          fontWeight: isUnread ? FontWeight.w700 : FontWeight.w600,
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
                          color: AppColors.grey,
                          height: 1.5,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        formatRelativeDate(notification.createdAt),
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.greyMedium,
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
