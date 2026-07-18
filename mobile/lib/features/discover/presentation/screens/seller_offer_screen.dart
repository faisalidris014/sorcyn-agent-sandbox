import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../data/models/discover_models.dart';

/// Detail of a single seller offer seen from the Discover feed (#315): the
/// seller's identity + offer, the underlying request, and the actions a buyer
/// can take — engage this seller for their own job (Task E), or duplicate the
/// request as their own post.
class SellerOfferScreen extends StatelessWidget {
  final SellerOfferArgs args;
  const SellerOfferScreen({super.key, required this.args});

  @override
  Widget build(BuildContext context) {
    final offer = args.offer;
    final post = args.item.post;
    final seller = offer.seller;

    return Scaffold(
      backgroundColor: AppColors.surfaceVariant,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: AppColors.black,
        title: const Text('Seller Offer',
            style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          // Seller identity
          _Card(
            child: Row(
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.storefront_outlined,
                      size: 22, color: AppColors.primary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        seller.displayName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.black,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          const Icon(Icons.star,
                              size: 13, color: AppColors.warning),
                          const SizedBox(width: 3),
                          Text(
                            seller.rating != null
                                ? '${seller.rating!.toStringAsFixed(1)} (${seller.totalReviews})'
                                : 'New seller',
                            style: const TextStyle(
                                fontSize: 12, color: AppColors.greyMedium),
                          ),
                          if (seller.totalCompleted > 0) ...[
                            const SizedBox(width: 10),
                            Text(
                              '${seller.totalCompleted} jobs done',
                              style: const TextStyle(
                                  fontSize: 12, color: AppColors.greyMedium),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // The offer
          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Their offer',
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.black),
                ),
                const SizedBox(height: 8),
                Text(
                  '\$${offer.quoteAmount.toStringAsFixed(0)}',
                  style: const TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                    color: AppColors.primary,
                  ),
                ),
                if (offer.message != null && offer.message!.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(
                    offer.message!,
                    style: const TextStyle(
                        fontSize: 14, color: AppColors.grey, height: 1.4),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),

          // The underlying request
          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'For this request',
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.black),
                ),
                const SizedBox(height: 8),
                Text(
                  post.title,
                  style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.black),
                ),
                const SizedBox(height: 4),
                Text(
                  '${post.categoryName.isNotEmpty ? post.categoryName : 'General'} · ${formatBudget(budgetMin: post.budgetMin, budgetMax: post.budgetMax, budgetType: post.budgetType)}',
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.greyMedium),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Primary action — engage this seller for your own job (Task E #315).
          // The Accept/Decline-via-message flow is being finalized; the button is
          // intentionally disabled until that lands so nothing here is a fake.
          Opacity(
            opacity: 0.5,
            child: Container(
              height: 52,
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Center(
                child: Text(
                  'I\'m ready to accept this offer',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          const Center(
            child: Text(
              'Messaging the seller to accept their offer is coming next.',
              style: TextStyle(fontSize: 11, color: AppColors.greyMedium),
            ),
          ),
          const SizedBox(height: 16),

          // Working alternative — recreate the request as your own post.
          GestureDetector(
            onTap: () => context.push('/posts/create/manual', extra: post),
            child: Container(
              height: 50,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.primary, width: 1.5),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.copy_all_outlined,
                      size: 18, color: AppColors.primary),
                  SizedBox(width: 8),
                  Text(
                    'Duplicate this request as mine',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.subtleBorder, width: 1.5),
      ),
      child: child,
    );
  }
}
