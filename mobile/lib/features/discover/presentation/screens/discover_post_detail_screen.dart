import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../posts/presentation/widgets/post_category_card.dart';
import '../../data/models/discover_models.dart';

/// Read-only detail for ANOTHER buyer's post, opened from the Discover feed
/// (#315). Shows the request plus all pending seller offers (oldest-first), each
/// tappable into the Seller Offer screen, and a "Duplicate this post as mine"
/// action that pre-fills a new post (minus the original's images).
class DiscoverPostDetailScreen extends StatelessWidget {
  final DiscoverItem? item;
  final String postId;

  const DiscoverPostDetailScreen({
    super.key,
    required this.postId,
    this.item,
  });

  @override
  Widget build(BuildContext context) {
    final data = item;
    if (data == null) {
      // Reached without the feed-provided item (e.g. a cold deep link). The
      // Discover feed always passes it via `extra`, so this is a rare fallback.
      return Scaffold(
        appBar: AppBar(title: const Text('Request')),
        body: const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              'Open this request from the Discover feed to see its offers.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.greyMedium),
            ),
          ),
        ),
      );
    }

    final post = data.post;
    final offers = data.offers; // already oldest-first from the server

    return Scaffold(
      backgroundColor: AppColors.surfaceVariant,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: AppColors.black,
        title: const Text('Request',
            style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          // Photo or category-card hero.
          ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: SizedBox(
              height: 180,
              width: double.infinity,
              child: post.photoUrls.isEmpty
                  ? post.categoryCard(iconSize: 56)
                  : Image.network(
                      post.photoUrls.first,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) =>
                          post.categoryCard(iconSize: 56),
                    ),
            ),
          ),
          const SizedBox(height: 14),
          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  post.title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.black,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    _Chip(
                      label: post.categoryName.isNotEmpty
                          ? post.categoryName
                          : 'General',
                      color: AppColors.primary,
                    ),
                    if (post.urgency != null)
                      _Chip(
                        label: formatUrgency(post.urgency),
                        color: AppColors.warning,
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  formatBudget(
                    budgetMin: post.budgetMin,
                    budgetMax: post.budgetMax,
                    budgetType: post.budgetType,
                  ),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Text(
                      formatRelativeDate(post.createdAt),
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.greyMedium),
                    ),
                    if (post.locationCity != null) ...[
                      const SizedBox(width: 10),
                      const Icon(Icons.location_on_outlined,
                          size: 13, color: AppColors.greyMedium),
                      const SizedBox(width: 2),
                      Text(
                        post.locationCity!,
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.greyMedium),
                      ),
                    ],
                  ],
                ),
                if (post.description.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  const Text(
                    'Details',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.black,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    post.description,
                    style: const TextStyle(
                        fontSize: 14, color: AppColors.grey, height: 1.4),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              '${offers.length} seller offer${offers.length == 1 ? '' : 's'}',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: AppColors.black,
              ),
            ),
          ),
          const SizedBox(height: 8),
          ...offers.map(
            (o) => _OfferTile(
              offer: o,
              onTap: () => context.push(
                '/discover/offer',
                extra: SellerOfferArgs(item: data, offer: o),
              ),
            ),
          ),
          const SizedBox(height: 20),
          _DuplicateButton(
            onTap: () => context.push('/posts/create/manual', extra: post),
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

class _Chip extends StatelessWidget {
  final String label;
  final Color color;
  const _Chip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
            fontSize: 11, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }
}

class _OfferTile extends StatelessWidget {
  final DiscoverOffer offer;
  final VoidCallback onTap;
  const _OfferTile({required this.offer, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.subtleBorder, width: 1.5),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.storefront_outlined,
                  size: 18, color: AppColors.primary),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    offer.seller.displayName,
                    style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.black),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(Icons.star, size: 12, color: AppColors.warning),
                      const SizedBox(width: 2),
                      Text(
                        offer.seller.rating != null
                            ? offer.seller.rating!.toStringAsFixed(1)
                            : 'New seller',
                        style: const TextStyle(
                            fontSize: 11, color: AppColors.greyMedium),
                      ),
                      if (offer.seller.totalCompleted > 0) ...[
                        const SizedBox(width: 6),
                        Text(
                          '${offer.seller.totalCompleted} jobs',
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.greyMedium),
                        ),
                      ],
                    ],
                  ),
                  if (offer.message != null && offer.message!.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      offer.message!,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.grey, height: 1.3),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '\$${offer.quoteAmount.toStringAsFixed(0)}',
                  style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary),
                ),
                const SizedBox(height: 2),
                const Icon(Icons.chevron_right,
                    size: 18, color: AppColors.greyMedium),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DuplicateButton extends StatelessWidget {
  final VoidCallback onTap;
  const _DuplicateButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
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
            Icon(Icons.copy_all_outlined, size: 18, color: AppColors.primary),
            SizedBox(width: 8),
            Text(
              'Duplicate this post as mine',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
