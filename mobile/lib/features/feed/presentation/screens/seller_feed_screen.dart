import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../../../shared/widgets/marketplace_context_selector.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../../notifications/providers/notification_provider.dart';
import '../../../offers/providers/offer_provider.dart';
import '../../../posts/data/models/post_model.dart';
import '../../../posts/presentation/widgets/post_category_card.dart';
import '../../providers/feed_provider.dart';

class SellerFeedScreen extends ConsumerStatefulWidget {
  const SellerFeedScreen({super.key});

  @override
  ConsumerState<SellerFeedScreen> createState() => _SellerFeedScreenState();
}

class _SellerFeedScreenState extends ConsumerState<SellerFeedScreen> {
  final _scrollController = ScrollController();
  final _searchController = TextEditingController();
  bool _showSearch = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(feedProvider.notifier).loadFeed();
      // Load the seller's own offers so feed cards can show per-post offer state.
      ref.read(myOffersProvider.notifier).loadMyOffers();
    });
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(feedProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(feedProvider);
    // Map of postId → the seller's current (non-withdrawn) offer status, used to
    // make each feed card's button state-aware (Submit / Pending / Resubmit).
    final myOffers = ref.watch(myOffersProvider).offers;
    final offerStatusByPost = <String, String>{};
    for (final o in myOffers) {
      if (o.status != 'withdrawn') offerStatusByPost[o.postId] = o.status;
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Find Work',
        actions: [
          GestureDetector(
            onTap: () => setState(() => _showSearch = !_showSearch),
            child: Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border, width: 1.5),
              ),
              child: const Icon(Icons.search, size: 18, color: AppColors.black),
            ),
          ),
          const SizedBox(width: 8),
          Consumer(
            builder: (context, ref, _) {
              final unreadAsync = ref.watch(notificationUnreadCountProvider);
              final count = unreadAsync.valueOrNull ?? 0;
              return GestureDetector(
                onTap: () => context.push('/notifications'),
                child: Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border, width: 1.5),
                  ),
                  child: Badge(
                    isLabelVisible: count > 0,
                    label:
                        Text('$count', style: const TextStyle(fontSize: 9)),
                    child: const Icon(Icons.notifications_outlined,
                        size: 18, color: AppColors.black),
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar (animated)
          AnimatedCrossFade(
            firstChild: const SizedBox(width: double.infinity),
            secondChild: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              child: Container(
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border, width: 1.5),
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 14),
                    const Icon(Icons.search, size: 18, color: AppColors.grey),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        style: const TextStyle(fontSize: 14),
                        decoration: const InputDecoration(
                          hintText: 'Search requests...',
                          hintStyle: TextStyle(
                              fontSize: 14, color: AppColors.greyMedium),
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.zero,
                        ),
                        onSubmitted: (value) {
                          ref.read(feedProvider.notifier).setSearch(value);
                        },
                      ),
                    ),
                    if (_searchController.text.isNotEmpty)
                      IconButton(
                        icon: const Icon(Icons.clear, size: 16),
                        onPressed: () {
                          _searchController.clear();
                          ref.read(feedProvider.notifier).setSearch(null);
                        },
                      ),
                  ],
                ),
              ),
            ),
            crossFadeState: _showSearch
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 200),
          ),

          // Marketplace context selector (B2C / B2B / C2C)
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 10, 20, 0),
            child: MarketplaceContextSelector(),
          ),

          // Category / Urgency filter chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                _GradientChip(
                  label: 'All',
                  selected: state.urgency == null,
                  onTap: () =>
                      ref.read(feedProvider.notifier).setUrgencyFilter(null),
                ),
                _GradientChip(
                  label: 'ASAP',
                  selected: state.urgency == 'asap',
                  onTap: () => ref
                      .read(feedProvider.notifier)
                      .setUrgencyFilter('asap'),
                ),
                _GradientChip(
                  label: 'Within 24h',
                  selected: state.urgency == 'within_24_hours',
                  onTap: () => ref
                      .read(feedProvider.notifier)
                      .setUrgencyFilter('within_24_hours'),
                ),
                _GradientChip(
                  label: 'Within a Week',
                  selected: state.urgency == 'within_1_week',
                  onTap: () => ref
                      .read(feedProvider.notifier)
                      .setUrgencyFilter('within_1_week'),
                ),
                _GradientChip(
                  label: 'Flexible',
                  selected: state.urgency == 'flexible',
                  onTap: () => ref
                      .read(feedProvider.notifier)
                      .setUrgencyFilter('flexible'),
                ),
              ],
            ),
          ),

          // Sort + count row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${state.meta?.total ?? state.posts.length} requests',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.greyMedium,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      width: 1.5,
                    ),
                  ),
                  child: DropdownButton<String>(
                    value: state.sortBy,
                    underline: const SizedBox(),
                    isDense: true,
                    icon: const Icon(Icons.expand_more,
                        size: 14, color: AppColors.primary),
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                    items: const [
                      DropdownMenuItem(
                          value: 'newest', child: Text('Newest')),
                      DropdownMenuItem(
                          value: 'expiring_soon',
                          child: Text('Expiring Soon')),
                      DropdownMenuItem(
                          value: 'budget_high',
                          child: Text('Budget: High')),
                      DropdownMenuItem(
                          value: 'budget_low',
                          child: Text('Budget: Low')),
                      DropdownMenuItem(
                          value: 'closest', child: Text('Closest')),
                    ],
                    onChanged: (v) {
                      if (v != null) {
                        ref.read(feedProvider.notifier).setSortBy(v);
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 6),

          // List
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.posts.isEmpty
                    ? const EmptyState(
                        icon: Icons.search_off,
                        title: 'No matching requests',
                        subtitle:
                            'Try adjusting your filters or check back later for new buyer requests.',
                      )
                    : RefreshIndicator(
                        onRefresh: () => ref
                            .read(feedProvider.notifier)
                            .loadFeed(refresh: true),
                        child: ListView.builder(
                          controller: _scrollController,
                          // Shell uses extendBody:true, so the list renders
                          // behind the bottom nav. Clear the nav height + the
                          // device safe-area inset so the last card's CTA stays
                          // tappable above it (#370).
                          padding: EdgeInsets.fromLTRB(
                            16,
                            0,
                            16,
                            16 +
                                kBottomNavigationBarHeight +
                                MediaQuery.of(context).viewPadding.bottom,
                          ),
                          itemCount: state.posts.length +
                              (state.isLoadingMore ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == state.posts.length) {
                              return const Center(
                                child: Padding(
                                  padding: EdgeInsets.all(16),
                                  child: CircularProgressIndicator(),
                                ),
                              );
                            }
                            final post = state.posts[index];
                            return _BuyerRequestCard(
                              post: post,
                              existingOfferStatus: offerStatusByPost[post.id],
                              onTap: () =>
                                  context.push('/seller/posts/${post.id}'),
                              onMakeOffer: () =>
                                  context.push('/posts/${post.id}/submit-offer'),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _GradientChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _GradientChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
          decoration: BoxDecoration(
            gradient: selected ? AppColors.primaryGradient : null,
            color: selected ? null : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: selected
                ? null
                : Border.all(color: AppColors.border, width: 1.5),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: selected ? Colors.white : AppColors.grey,
            ),
          ),
        ),
      ),
    );
  }
}

class _BuyerRequestCard extends StatelessWidget {
  final Post post;
  final VoidCallback? onTap;
  final VoidCallback? onMakeOffer;
  // The seller's current offer status on this post (null = none/withdrawn).
  final String? existingOfferStatus;

  const _BuyerRequestCard({
    required this.post,
    this.onTap,
    this.onMakeOffer,
    this.existingOfferStatus,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.subtleBorder, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Thumbnail (photo or category-card fallback) + title
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: SizedBox(
                      width: 56,
                      height: 56,
                      child: post.photoUrls.isEmpty
                          ? post.categoryCard(iconSize: 24, showLabel: false)
                          : Image.network(
                              post.photoUrls.first,
                              fit: BoxFit.cover,
                              errorBuilder: (_, _, _) => post.categoryCard(
                                  iconSize: 24, showLabel: false),
                            ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      post.title,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.black,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Category + urgency chips
              Row(
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      post.categoryName.isNotEmpty
                          ? post.categoryName
                          : 'General',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  if (post.urgency != null) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withValues(alpha: 0.06),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        formatUrgency(post.urgency),
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: AppColors.warning,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              if (post.distanceMiles != null) ...[
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined,
                        size: 12, color: AppColors.greyMedium),
                    const SizedBox(width: 3),
                    Text(
                      '${post.distanceMiles!.toStringAsFixed(1)} mi away',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.greyMedium,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 10),

              // Budget + buyer info row
              Row(
                children: [
                  // Budget
                  Text(
                    formatBudget(
                      budgetMin: post.budgetMin,
                      budgetMax: post.budgetMax,
                      budgetType: post.budgetType,
                    ),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                    ),
                  ),
                  const Spacer(),
                  // Buyer rating
                  const Row(
                    children: [
                      Icon(Icons.star, size: 12, color: AppColors.warning),
                      SizedBox(width: 3),
                      Text(
                        '4.8',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppColors.black,
                        ),
                      ),
                      SizedBox(width: 8),
                    ],
                  ),
                  // Offers count
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.greyLight,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.people_outline,
                            size: 11, color: AppColors.grey),
                        const SizedBox(width: 3),
                        Text(
                          '${post.offerCount}',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: AppColors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Bottom row: time + offer button
              Row(
                children: [
                  Text(
                    formatRelativeDate(post.createdAt),
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.greyMedium,
                    ),
                  ),
                  if (post.locationCity != null) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFF3B82F6).withValues(alpha: 0.06),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.location_on,
                              size: 10, color: Color(0xFF3B82F6)),
                          const SizedBox(width: 3),
                          Text(
                            post.locationCity!,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF3B82F6),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const Spacer(),
                  _buildOfferButton(),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOfferButton() {
    final status = existingOfferStatus;

    // Live offer states → read-only status pill that opens the post detail.
    if (status == 'pending' ||
        status == 'counter_offered' ||
        status == 'needs_reconfirmation') {
      return _statusPill('Pending', AppColors.warning, onTap);
    }
    if (status == 'accepted') {
      return _statusPill('Accepted', AppColors.success, onTap);
    }

    // None or declined → actionable submit/resubmit.
    return GestureDetector(
      onTap: onMakeOffer,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          gradient: AppColors.primaryGradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Text(
          status == 'declined' ? 'Resubmit' : 'Submit Offer',
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  Widget _statusPill(String label, Color color, VoidCallback? onTap) {
    final icon =
        label == 'Accepted' ? Icons.check_circle_outline : Icons.hourglass_top;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.30), width: 1.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
