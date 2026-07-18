import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../data/models/offer_model.dart';

class OfferCard extends StatelessWidget {
  final Offer offer;
  final VoidCallback? onTap;
  final VoidCallback? onAccept;
  final VoidCallback? onDecline;
  final VoidCallback? onMessage;
  final bool isComparing;
  final VoidCallback? onToggleCompare;
  final double? budgetMax;

  const OfferCard({
    super.key,
    required this.offer,
    this.onTap,
    this.onAccept,
    this.onDecline,
    this.onMessage,
    this.isComparing = false,
    this.onToggleCompare,
    this.budgetMax,
  });

  @override
  Widget build(BuildContext context) {
    final isAccepted = offer.isAccepted;
    final isDeclined = offer.status == 'declined';

    return GestureDetector(
      onTap: onTap,
      child: AnimatedOpacity(
        opacity: isDeclined ? 0.5 : 1.0,
        duration: const Duration(milliseconds: 300),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isAccepted
                  ? const Color(0xFF10B981).withValues(alpha: 0.4)
                  : isComparing
                      ? AppColors.primary
                      : AppColors.border,
              width: isAccepted || isComparing ? 2 : 1.5,
            ),
            color: isAccepted
                ? const Color(0xFF10B981).withValues(alpha: 0.03)
                : isComparing
                    ? AppColors.primary.withValues(alpha: 0.03)
                    : Colors.white,
            boxShadow: [
              BoxShadow(
                color: isAccepted
                    ? const Color(0xFF10B981).withValues(alpha: 0.12)
                    : isComparing
                        ? AppColors.primary.withValues(alpha: 0.14)
                        : Colors.black.withValues(alpha: 0.05),
                blurRadius: 12,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              // Status ribbon
              if (isAccepted)
                Container(
                  height: 3,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF10B981), Color(0xFF34D399)],
                    ),
                  ),
                ),
              if (isDeclined)
                Container(height: 3, color: AppColors.error),

              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: Column(
                  children: [
                    // Header: avatar + name + badges + compare toggle
                    _buildHeader(),
                    const SizedBox(height: 12),

                    // Quote amount section
                    _buildQuoteSection(),
                    const SizedBox(height: 12),

                    // Meta info: timeline + distance
                    _buildMetaRow(),
                    const SizedBox(height: 12),

                    // Message preview
                    if (offer.message.isNotEmpty) _buildMessagePreview(),
                  ],
                ),
              ),

              // Action buttons. Accept/Decline are buyer-only — they render
              // only in the buyer's post-offers view, which wires onAccept.
              // The seller's own My Offers cards (no onAccept) instead show a
              // read-only status banner. (#1)
              if (offer.isPending && !isDeclined && !isAccepted)
                if (onAccept != null)
                  _buildActions()
                else
                  _buildStatusBanner(
                    icon: Icons.hourglass_top,
                    label: 'Pending',
                    color: const Color(0xFFD97706),
                    bgColor: const Color(0xFFF59E0B).withValues(alpha: 0.08),
                    borderColor: const Color(0xFFF59E0B).withValues(alpha: 0.22),
                  )
              else if (isAccepted)
                _buildStatusBanner(
                  icon: Icons.check,
                  label: 'Offer Accepted',
                  color: const Color(0xFF059669),
                  bgColor: const Color(0xFF10B981).withValues(alpha: 0.08),
                  borderColor: const Color(0xFF10B981).withValues(alpha: 0.2),
                )
              else if (isDeclined)
                _buildStatusBanner(
                  icon: Icons.close,
                  label: 'Offer Declined',
                  color: AppColors.error,
                  bgColor: AppColors.error.withValues(alpha: 0.06),
                  borderColor: AppColors.error.withValues(alpha: 0.18),
                )
              // In-between states that previously rendered NO banner, so they
              // looked indistinguishable from pending (#1).
              else if (offer.isCounterOffered)
                _buildStatusBanner(
                  icon: Icons.swap_horiz,
                  label: 'Counter Sent',
                  color: const Color(0xFF2563EB),
                  bgColor: const Color(0xFF3B82F6).withValues(alpha: 0.08),
                  borderColor: const Color(0xFF3B82F6).withValues(alpha: 0.22),
                )
              else if (offer.isNeedsReconfirmation)
                _buildStatusBanner(
                  icon: Icons.update,
                  label: 'Action Needed',
                  color: const Color(0xFFD97706),
                  bgColor: const Color(0xFFF59E0B).withValues(alpha: 0.08),
                  borderColor: const Color(0xFFF59E0B).withValues(alpha: 0.22),
                )
              else if (offer.isExpired || offer.isWithdrawn)
                _buildStatusBanner(
                  icon: Icons.timer_off_outlined,
                  label: offer.isExpired ? 'Expired' : 'Withdrawn',
                  color: const Color(0xFF6B7280),
                  bgColor: const Color(0xFF6B7280).withValues(alpha: 0.08),
                  borderColor: const Color(0xFF6B7280).withValues(alpha: 0.2),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final hasVerified = offer.seller?.badges.contains('verified') ?? false;
    final hasTopSeller = (offer.seller?.totalCompleted ?? 0) > 50;
    final hasPro = offer.seller?.badges.contains('licensed') ?? false;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Avatar
        Stack(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: AppColors.primaryGradient,
                image: offer.seller?.profilePhotoUrl != null
                    ? DecorationImage(
                        image: NetworkImage(offer.seller!.profilePhotoUrl!),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: offer.seller?.profilePhotoUrl == null
                  ? Center(
                      child: Text(
                        offer.sellerName.isNotEmpty
                            ? offer.sellerName[0].toUpperCase()
                            : '?',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    )
                  : null,
            ),
            // Online dot
            Positioned(
              bottom: 1,
              right: 1,
              child: Container(
                width: 11,
                height: 11,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF10B981),
                  border: Border.all(color: Colors.white, width: 2),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(width: 12),

        // Name + stars + badges
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Flexible(
                    child: Text(
                      offer.sellerName,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.black,
                        letterSpacing: -0.01,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (hasVerified) ...[
                    const SizedBox(width: 5),
                    Container(
                      width: 17,
                      height: 17,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [Color(0xFF7C3AED), Color(0xFFA855F7)],
                        ),
                      ),
                      child: const Icon(Icons.check,
                          size: 9, color: Colors.white),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 3),
              // Stars
              if (offer.sellerRating != null)
                Row(
                  children: [
                    ...List.generate(5, (i) {
                      return Icon(
                        i < offer.sellerRating!.round()
                            ? Icons.star
                            : Icons.star_border,
                        size: 11,
                        color: const Color(0xFFF59E0B),
                      );
                    }),
                    const SizedBox(width: 5),
                    Text(
                      offer.sellerRating!.toStringAsFixed(1),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.black,
                      ),
                    ),
                    const SizedBox(width: 3),
                    Text(
                      '(${offer.sellerReviewCount})',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.greyMedium,
                      ),
                    ),
                  ],
                ),
              const SizedBox(height: 5),
              // Badges
              Wrap(
                spacing: 5,
                runSpacing: 4,
                children: [
                  if (hasTopSeller)
                    _SellerBadge(
                      label: 'Top Seller',
                      color: const Color(0xFFD97706),
                      bgColor: const Color(0xFFF59E0B).withValues(alpha: 0.08),
                      borderColor:
                          const Color(0xFFF59E0B).withValues(alpha: 0.25),
                      icon: Icons.star,
                    ),
                  if (hasPro)
                    _SellerBadge(
                      label: 'PRO',
                      color: AppColors.primary,
                      bgColor: AppColors.primary.withValues(alpha: 0.07),
                      borderColor: AppColors.primary.withValues(alpha: 0.22),
                      icon: Icons.work_outline,
                    ),
                  if (hasVerified)
                    _SellerBadge(
                      label: 'Verified',
                      color: const Color(0xFF059669),
                      bgColor:
                          const Color(0xFF10B981).withValues(alpha: 0.07),
                      borderColor:
                          const Color(0xFF10B981).withValues(alpha: 0.22),
                      icon: Icons.verified_outlined,
                    ),
                ],
              ),
            ],
          ),
        ),

        // Compare toggle
        if (onToggleCompare != null)
          GestureDetector(
            onTap: onToggleCompare,
            child: Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(9),
                border: Border.all(
                  color: isComparing ? AppColors.primary : AppColors.border,
                  width: 1.5,
                ),
                color: isComparing
                    ? AppColors.primary.withValues(alpha: 0.1)
                    : AppColors.surfaceVariant,
              ),
              child: Icon(
                Icons.compare_arrows,
                size: 14,
                color:
                    isComparing ? AppColors.primary : AppColors.greyMedium,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildQuoteSection() {
    final pctOfBudget = budgetMax != null && budgetMax! > 0
        ? (offer.quoteAmount / budgetMax! * 100).round()
        : null;
    final isUnderBudget =
        budgetMax == null || offer.quoteAmount <= budgetMax!;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary.withValues(alpha: 0.06),
            AppColors.secondaryPurple.withValues(alpha: 0.06),
          ],
        ),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.12),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Quote amount',
                style: TextStyle(
                  fontSize: 11,
                  color: AppColors.greyMedium,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    formatCurrency(offer.quoteAmount),
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                      letterSpacing: -0.84,
                      height: 1,
                    ),
                  ),
                  if (offer.pricingType == 'hourly')
                    const Text(
                      '/hr',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.secondaryPurple,
                        fontWeight: FontWeight.w600,
                      ),
                    )
                  else
                    const Text(
                      ' total',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.secondaryPurple,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
            ],
          ),
          if (pctOfBudget != null)
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const Text(
                  'vs. your budget',
                  style: TextStyle(fontSize: 10, color: AppColors.greyMedium),
                ),
                const SizedBox(height: 4),
                SizedBox(
                  width: 80,
                  height: 5,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(3),
                    child: LinearProgressIndicator(
                      value: (pctOfBudget / 100).clamp(0.0, 1.0),
                      backgroundColor: AppColors.border,
                      color: pctOfBudget > 100
                          ? AppColors.error
                          : pctOfBudget > 85
                              ? AppColors.warning
                              : AppColors.success,
                    ),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  isUnderBudget ? '$pctOfBudget% of budget' : 'Over budget',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isUnderBudget
                        ? const Color(0xFF059669)
                        : const Color(0xFFDC2626),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildMetaRow() {
    return Row(
      children: [
        if (offer.completionTime != null) ...[
          _MetaChip(
            icon: Icons.schedule,
            label: offer.completionTime!,
          ),
          const SizedBox(width: 12),
        ],
        if (offer.canStart != null)
          _MetaChip(
            icon: Icons.event_available,
            label: offer.canStart!,
          ),
        if (offer.photoUrls.isNotEmpty) ...[
          const SizedBox(width: 12),
          _MetaChip(
            icon: Icons.photo_library_outlined,
            label: '${offer.photoUrls.length}',
          ),
        ],
        const Spacer(),
        Text(
          _timeAgo(offer.createdAt),
          style: const TextStyle(fontSize: 11, color: AppColors.greyMedium),
        ),
      ],
    );
  }

  Widget _buildMessagePreview() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.subtleBorder),
      ),
      child: Text(
        '"${offer.message}"',
        style: const TextStyle(
          fontSize: 13,
          color: Color(0xFF4B5563),
          height: 1.55,
        ),
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  Widget _buildActions() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
      child: Row(
        children: [
          // View Details
          Expanded(
            child: _ActionButton(
              label: 'Details',
              icon: Icons.info_outline,
              onTap: onTap,
              borderColor: AppColors.border,
              bgColor: AppColors.surfaceVariant,
              textColor: const Color(0xFF374151),
            ),
          ),
          const SizedBox(width: 8),
          // Accept
          Expanded(
            flex: 2,
            child: _GradientActionButton(
              label: 'Accept',
              icon: Icons.check,
              onTap: onAccept,
            ),
          ),
          const SizedBox(width: 8),
          // Decline
          Expanded(
            child: _ActionButton(
              label: 'Decline',
              icon: Icons.close,
              onTap: onDecline,
              borderColor: AppColors.error.withValues(alpha: 0.4),
              bgColor: AppColors.error.withValues(alpha: 0.04),
              textColor: AppColors.error,
            ),
          ),
          if (onMessage != null) ...[
            const SizedBox(width: 8),
            GestureDetector(
              onTap: onMessage,
              child: Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border, width: 1.5),
                  color: AppColors.surfaceVariant,
                ),
                child: const Icon(Icons.chat_bubble_outline,
                    size: 15, color: AppColors.grey),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatusBanner({
    required IconData icon,
    required String label,
    required Color color,
    required Color bgColor,
    required Color borderColor,
  }) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 15, color: color),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _timeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

class _SellerBadge extends StatelessWidget {
  final String label;
  final Color color;
  final Color bgColor;
  final Color borderColor;
  final IconData icon;

  const _SellerBadge({
    required this.label,
    required this.color,
    required this.bgColor,
    required this.borderColor,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: borderColor, width: 1.2),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: color),
          const SizedBox(width: 3),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _MetaChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            color: AppColors.greyLight,
            borderRadius: BorderRadius.circular(7),
          ),
          child: Icon(icon, size: 11, color: AppColors.grey),
        ),
        const SizedBox(width: 5),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Color(0xFF374151),
          ),
        ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback? onTap;
  final Color borderColor;
  final Color bgColor;
  final Color textColor;

  const _ActionButton({
    required this.label,
    required this.icon,
    this.onTap,
    required this.borderColor,
    required this.bgColor,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 38,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor, width: 1.5),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 13, color: textColor),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GradientActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback? onTap;

  const _GradientActionButton({
    required this.label,
    required this.icon,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 38,
        decoration: BoxDecoration(
          gradient: AppColors.primaryGradient,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.3),
              blurRadius: 14,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 13, color: Colors.white),
            const SizedBox(width: 4),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
