import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../data/models/conversation_model.dart';

/// Deal-aware inbox row: listing photo + status ring + person badge on the left,
/// name/preview in the middle, price + unread on the right. Supports Edit-mode
/// multi-select (checkbox slides in, tap toggles instead of navigating).
class ConversationTile extends StatelessWidget {
  final Conversation conversation;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  final bool editMode;
  final bool selected;

  const ConversationTile({
    super.key,
    required this.conversation,
    required this.onTap,
    this.onLongPress,
    this.editMode = false,
    this.selected = false,
  });

  @override
  Widget build(BuildContext context) {
    final hasUnread = conversation.hasUnread;
    final participant = conversation.otherParticipant;
    final deal = conversation.deal;
    final dealState = deal?.state ?? DealState.none;
    final stateColor = _stateColor(dealState);

    return GestureDetector(
      onTap: onTap,
      onLongPress: onLongPress,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
        color: selected
            ? AppColors.primary.withValues(alpha: 0.07)
            : Colors.transparent,
        child: Row(
          children: [
            // Selection checkbox (Edit mode)
            AnimatedSize(
              duration: const Duration(milliseconds: 150),
              curve: Curves.easeOut,
              child: editMode
                  ? Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: _Checkbox(selected: selected),
                    )
                  : const SizedBox.shrink(),
            ),

            // Deal photo + status ring + person badge
            _DealAvatar(
              participant: participant,
              photoUrl: deal?.photoUrl,
              // Colored ring for an active deal; a subtle grey ring otherwise so
              // every row still reads as a framed thumbnail.
              ringColor: dealState == DealState.none
                  ? AppColors.border
                  : stateColor,
              progress: deal?.progress,
            ),
            const SizedBox(width: 12),

            // Name + preview
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          participant.fullName,
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight:
                                hasUnread ? FontWeight.w700 : FontWeight.w600,
                            color: AppColors.black,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (conversation.lastMessage != null)
                        Text(
                          formatRelativeDate(conversation.lastMessage!.sentAt),
                          style: TextStyle(
                            fontSize: 11,
                            color: hasUnread
                                ? AppColors.primary
                                : AppColors.greyMedium,
                            fontWeight: hasUnread
                                ? FontWeight.w600
                                : FontWeight.w400,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  conversation.lastMessage != null
                      ? Text(
                          conversation.lastMessage!.isOwn
                              ? 'You: ${conversation.lastMessage!.text}'
                              : conversation.lastMessage!.text,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12.5,
                            color:
                                hasUnread ? AppColors.black : AppColors.grey,
                            fontWeight: hasUnread
                                ? FontWeight.w500
                                : FontWeight.w400,
                          ),
                        )
                      : const Text(
                          'No messages yet',
                          style: TextStyle(
                            fontSize: 12.5,
                            color: AppColors.greyMedium,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                ],
              ),
            ),

            // Price + unread badge
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (deal?.amount != null)
                  Text(
                    _formatAmount(deal!.amount!),
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w800,
                      color: stateColor,
                    ),
                  ),
                if (hasUnread) ...[
                  const SizedBox(height: 5),
                  Container(
                    constraints: const BoxConstraints(minWidth: 18),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(9),
                    ),
                    child: Text(
                      '${conversation.unreadCount}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  static Color _stateColor(DealState state) {
    switch (state) {
      case DealState.inEscrow:
        return AppColors.warning; // amber
      case DealState.newOffer:
        return AppColors.primary; // purple
      case DealState.offerSent:
        return AppColors.info; // blue
      case DealState.completed:
        return AppColors.success; // green
      case DealState.none:
        return AppColors.greyMedium;
    }
  }

  static String _formatAmount(double amount) {
    final whole = amount.roundToDouble() == amount;
    return whole ? '\$${amount.toStringAsFixed(0)}' : '\$${amount.toStringAsFixed(2)}';
  }
}

// ── Deal avatar (photo + ring + person badge) ────────────────

class _DealAvatar extends StatelessWidget {
  final OtherParticipant participant;
  final String? photoUrl;
  final Color ringColor;
  final double? progress;

  const _DealAvatar({
    required this.participant,
    required this.photoUrl,
    required this.ringColor,
    required this.progress,
  });

  // Ring sits with a clear gap around the photo so it reads as a distinct frame.
  static const double _ring = 48;
  static const double _photo = 36;

  @override
  Widget build(BuildContext context) {
    final initial = participant.firstName.isNotEmpty
        ? participant.firstName[0].toUpperCase()
        : '?';

    return SizedBox(
      width: _ring + 4,
      height: _ring + 4,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          // Status ring (always drawn; grey when there's no active deal)
          CustomPaint(
            size: const Size(_ring, _ring),
            painter: _RingPainter(
              color: ringColor,
              progress: progress,
              trackColor: AppColors.greyLight,
            ),
          ),
          // Listing photo (or gradient + initial fallback)
          Container(
            width: _photo,
            height: _photo,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(11),
              gradient: photoUrl == null ? AppColors.primaryGradient : null,
              color: photoUrl != null ? AppColors.greyLight : null,
              image: photoUrl != null
                  ? DecorationImage(
                      image: NetworkImage(photoUrl!),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: photoUrl == null
                ? Center(
                    child: Text(
                      initial,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  )
                : null,
          ),
          // Person badge (bottom-right) — only when a listing photo is shown,
          // otherwise the tile already shows the person's initial.
          if (photoUrl != null)
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                width: 19,
                height: 19,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppColors.primaryGradient,
                  border: Border.all(color: Colors.white, width: 2),
                ),
                alignment: Alignment.center,
                child: Text(
                  initial,
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Status ring painter ──────────────────────────────────────

class _RingPainter extends CustomPainter {
  final Color color;
  final double? progress; // 0..1; null = full ring
  final Color trackColor;

  _RingPainter({
    required this.color,
    required this.progress,
    required this.trackColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    const stroke = 3.0;
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - stroke) / 2;
    final rect = Rect.fromCircle(center: center, radius: radius);

    final ringPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round
      ..color = color;

    if (progress == null) {
      canvas.drawCircle(center, radius, ringPaint);
      return;
    }

    // Track + progress arc (starts at 12 o'clock, clockwise).
    final trackPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..color = trackColor;
    canvas.drawCircle(center, radius, trackPaint);

    final sweep = 2 * math.pi * progress!.clamp(0.0, 1.0);
    canvas.drawArc(rect, -math.pi / 2, sweep, false, ringPaint);
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      old.color != color || old.progress != progress || old.trackColor != trackColor;
}

// ── Selection checkbox ───────────────────────────────────────

class _Checkbox extends StatelessWidget {
  final bool selected;
  const _Checkbox({required this.selected});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: selected ? AppColors.primary : Colors.transparent,
        border: Border.all(
          color: selected ? AppColors.primary : AppColors.border,
          width: 2,
        ),
      ),
      child: selected
          ? const Icon(Icons.check, size: 14, color: Colors.white)
          : null,
    );
  }
}
