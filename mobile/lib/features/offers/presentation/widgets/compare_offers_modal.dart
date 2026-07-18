import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../data/models/offer_model.dart';

class CompareOffersModal extends StatelessWidget {
  final List<Offer> offers;
  final double? budgetMax;
  final ValueChanged<Offer> onAccept;
  final VoidCallback onClose;

  const CompareOffersModal({
    super.key,
    required this.offers,
    this.budgetMax,
    required this.onAccept,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    // Determine best values
    final lowestPrice = offers
        .map((o) => o.quoteAmount)
        .reduce((a, b) => a < b ? a : b);
    final highestRating = offers
        .map((o) => o.sellerRating ?? 0.0)
        .reduce((a, b) => a > b ? a : b);
    final mostReviews = offers
        .map((o) => o.sellerReviewCount)
        .reduce((a, b) => a > b ? a : b);
    final mostCompleted = offers
        .map((o) => o.seller?.totalCompleted ?? 0)
        .reduce((a, b) => a > b ? a : b);

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Compare Offers',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.black,
                      letterSpacing: -0.4,
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'Side-by-side comparison',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.greyMedium,
                    ),
                  ),
                ],
              ),
              GestureDetector(
                onTap: onClose,
                child: Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border, width: 1.5),
                  ),
                  child: const Icon(Icons.close,
                      size: 16, color: AppColors.grey),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Seller avatars row
          Row(
            children: offers.map((offer) {
              return Expanded(
                child: Column(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        gradient: AppColors.primaryGradient,
                        image: offer.seller?.profilePhotoUrl != null
                            ? DecorationImage(
                                image: NetworkImage(
                                    offer.seller!.profilePhotoUrl!),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                      child: offer.seller?.profilePhotoUrl == null
                          ? Center(
                              child: Text(
                                offer.sellerName[0].toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      offer.sellerName.split(' ').first,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.black,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          // Comparison table
          Flexible(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  _CompareRow(
                    label: 'Price',
                    icon: Icons.attach_money,
                    values: offers
                        .map((o) => formatCurrency(o.quoteAmount))
                        .toList(),
                    highlights: offers
                        .map((o) => o.quoteAmount == lowestPrice)
                        .toList(),
                    highlightColor: const Color(0xFF059669),
                  ),
                  _CompareRow(
                    label: 'Timeline',
                    icon: Icons.schedule,
                    values: offers
                        .map((o) => o.completionTime ?? 'N/A')
                        .toList(),
                  ),
                  _CompareRow(
                    label: 'Rating',
                    icon: Icons.star,
                    values: offers
                        .map((o) => o.sellerRating?.toStringAsFixed(1) ?? 'N/A')
                        .toList(),
                    highlights: offers
                        .map((o) => (o.sellerRating ?? 0) == highestRating)
                        .toList(),
                    highlightColor: const Color(0xFFF59E0B),
                  ),
                  _CompareRow(
                    label: 'Reviews',
                    icon: Icons.rate_review_outlined,
                    values: offers
                        .map((o) => '${o.sellerReviewCount}')
                        .toList(),
                    highlights: offers
                        .map((o) => o.sellerReviewCount == mostReviews)
                        .toList(),
                  ),
                  _CompareRow(
                    label: 'Jobs Done',
                    icon: Icons.check_circle_outline,
                    values: offers
                        .map((o) => '${o.seller?.totalCompleted ?? 0}')
                        .toList(),
                    highlights: offers
                        .map((o) =>
                            (o.seller?.totalCompleted ?? 0) == mostCompleted)
                        .toList(),
                  ),
                  _CompareRow(
                    label: 'Badges',
                    icon: Icons.verified_outlined,
                    values: offers.map((o) {
                      final badges = o.seller?.badges ?? [];
                      return badges.isEmpty ? 'None' : badges.length.toString();
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Accept buttons per offer
          Row(
            children: offers.asMap().entries.map((entry) {
              final i = entry.key;
              final offer = entry.value;
              final isBest = offer.quoteAmount == lowestPrice &&
                  (offer.sellerRating ?? 0) == highestRating;
              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(
                    left: i == 0 ? 0 : 4,
                    right: i == offers.length - 1 ? 0 : 4,
                  ),
                  child: isBest
                      ? GradientButton(
                          text: 'Accept',
                          onPressed: () => onAccept(offer),
                          height: 42,
                          borderRadius: 12,
                        )
                      : GestureDetector(
                          onTap: () => onAccept(offer),
                          child: Container(
                            height: 42,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                  color: AppColors.primary, width: 1.5),
                            ),
                            child: const Center(
                              child: Text(
                                'Accept',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                ),
                              ),
                            ),
                          ),
                        ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _CompareRow extends StatelessWidget {
  final String label;
  final IconData icon;
  final List<String> values;
  final List<bool>? highlights;
  final Color? highlightColor;

  const _CompareRow({
    required this.label,
    required this.icon,
    required this.values,
    this.highlights,
    this.highlightColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      margin: const EdgeInsets.only(bottom: 1),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        border: Border(
          bottom: BorderSide(color: AppColors.border.withValues(alpha: 0.5)),
        ),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Row(
              children: [
                Icon(icon, size: 13, color: AppColors.grey),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    label,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.grey,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          ...values.asMap().entries.map((entry) {
            final i = entry.key;
            final val = entry.value;
            final isHighlighted = highlights != null && highlights![i];
            return Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 6),
                decoration: BoxDecoration(
                  color: isHighlighted
                      ? const Color(0xFFECFDF5)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  val,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight:
                        isHighlighted ? FontWeight.w700 : FontWeight.w500,
                    color: isHighlighted
                        ? (highlightColor ?? const Color(0xFF059669))
                        : AppColors.black,
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
