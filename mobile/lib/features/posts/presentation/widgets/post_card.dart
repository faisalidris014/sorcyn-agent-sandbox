import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../../shared/widgets/urgency_chip.dart';
import '../../data/models/post_model.dart';
import 'post_category_card.dart';

class PostCard extends StatefulWidget {
  final Post post;
  final VoidCallback? onTap;
  final List<Widget>? actionButtons;

  const PostCard({
    super.key,
    required this.post,
    this.onTap,
    this.actionButtons,
  });

  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> {
  bool _pressed = false;

  Color get _accentColor {
    return switch (widget.post.status.toLowerCase()) {
      'active' => const Color(0xFF10B981),
      'draft' => const Color(0xFF9CA3AF),
      'filled' => AppColors.primary,
      'expired' => const Color(0xFFEF4444),
      'archived' => const Color(0xFFF59E0B),
      _ => AppColors.primary,
    };
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: widget.onTap == null
          ? null
          : (_) => setState(() => _pressed = true),
      onTapUp: widget.onTap == null
          ? null
          : (_) {
              setState(() => _pressed = false);
              widget.onTap?.call();
            },
      onTapCancel: widget.onTap == null
          ? null
          : () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.98 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top accent bar
              Container(
                height: 3,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [_accentColor, _accentColor.withValues(alpha: 0.4)],
                  ),
                ),
              ),

              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Category tag + Status badge
                    Row(
                      children: [
                        if (widget.post.categoryName.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color:
                                    AppColors.primary.withValues(alpha: 0.28),
                                width: 1.5,
                              ),
                            ),
                            child: Text(
                              widget.post.categoryName,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                        const Spacer(),
                        StatusBadge(status: widget.post.status),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Title + optional photo thumbnail
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.post.title,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.black,
                                  height: 1.4,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  Icon(
                                    Icons.attach_money,
                                    size: 14,
                                    color: AppColors.grey,
                                  ),
                                  const SizedBox(width: 2),
                                  Text(
                                    formatBudget(
                                      budgetMin: widget.post.budgetMin,
                                      budgetMax: widget.post.budgetMax,
                                      budgetType: widget.post.budgetType,
                                    ),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.grey,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: SizedBox(
                            width: 64,
                            height: 64,
                            child: widget.post.photoUrls.isEmpty
                                ? widget.post.categoryCard(
                                    iconSize: 28, showLabel: false)
                                : Image.network(
                                    widget.post.photoUrls.first,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, _, _) =>
                                        widget.post.categoryCard(
                                            iconSize: 28, showLabel: false),
                                  ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Bottom row: Urgency + Offers + Time ago
                    Row(
                      children: [
                        if (widget.post.urgency != null)
                          UrgencyChip(urgency: widget.post.urgency!),
                        if (widget.post.urgency != null)
                          const SizedBox(width: 10),
                        Container(
                          width: 1,
                          height: 12,
                          color: AppColors.border,
                        ),
                        const SizedBox(width: 10),
                        Icon(
                          Icons.person_outline,
                          size: 14,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          '${widget.post.offerCount} ${widget.post.offerCount == 1 ? 'offer' : 'offers'}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          formatRelativeDate(widget.post.createdAt),
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.greyMedium,
                          ),
                        ),
                      ],
                    ),

                    // Action buttons (optional)
                    if (widget.actionButtons != null &&
                        widget.actionButtons!.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      const Divider(height: 1, color: AppColors.border),
                      const SizedBox(height: 12),
                      Row(
                        children: widget.actionButtons!
                            .expand((btn) => [btn, const SizedBox(width: 8)])
                            .toList()
                          ..removeLast(),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
