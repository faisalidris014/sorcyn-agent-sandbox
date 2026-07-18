import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../../categories/providers/category_provider.dart';
import '../../../notifications/providers/notification_provider.dart';
import '../../../posts/data/models/post_model.dart';
import '../../../posts/presentation/widgets/post_category_card.dart';
import '../../data/models/discover_models.dart';
import '../../providers/discover_provider.dart';

/// Buyer Discover feed (#315) — a 2-column grid of other buyers' posts, styled
/// after a marketplace "For You" page: each card shows the post's photo (or a
/// category-tinted fallback when there's no photo yet), the post's price, a
/// summarized title, and a compact line of the competing seller offers. Tapping
/// a card opens the full read-only post detail with every offer listed. Three
/// tabs scope by the top-level categories (Products / Services / Jobs).
class DiscoverScreen extends ConsumerWidget {
  const DiscoverScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final treeAsync = ref.watch(categoryTreeProvider);
    final ids = ref.watch(topLevelCategoryIdsProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Discover',
        actions: [
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
                    label: Text('$count', style: const TextStyle(fontSize: 9)),
                    child: const Icon(Icons.notifications_outlined,
                        size: 18, color: AppColors.black),
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: treeAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              'Couldn\'t load Discover. Pull to refresh or try again.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.greyMedium),
            ),
          ),
        ),
        data: (_) {
          final tabs = <(String, String?)>[
            ('Products', ids['products']),
            ('Services', ids['services']),
            ('Jobs', ids['jobs']),
          ];
          return DefaultTabController(
            length: tabs.length,
            child: Column(
              children: [
                const DiscoverModeSelector(),
                TabBar(
                  isScrollable: false,
                  labelColor: AppColors.primary,
                  unselectedLabelColor: AppColors.greyMedium,
                  indicatorColor: AppColors.primary,
                  indicatorWeight: 2.5,
                  labelStyle: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w700),
                  unselectedLabelStyle: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w600),
                  tabs: tabs.map((t) => Tab(text: t.$1)).toList(),
                ),
                Expanded(
                  child: TabBarView(
                    children: tabs
                        .map((t) => _DiscoverTabView(categoryId: t.$2))
                        .toList(),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _DiscoverTabView extends ConsumerStatefulWidget {
  final String? categoryId;
  const _DiscoverTabView({required this.categoryId});

  @override
  ConsumerState<_DiscoverTabView> createState() => _DiscoverTabViewState();
}

class _DiscoverTabViewState extends ConsumerState<_DiscoverTabView>
    with AutomaticKeepAliveClientMixin {
  final _scrollController = ScrollController();

  @override
  bool get wantKeepAlive => true;

  DiscoverKey get _key =>
      (categoryId: widget.categoryId, mode: ref.read(discoverModeProvider));

  @override
  void initState() {
    super.initState();
    // No initial fetch here — DiscoverNotifier self-loads on creation.
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(discoverProvider(_key).notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    // Watching the (category, mode) key is all that's needed: switching modes
    // swaps to another family member, which self-loads on creation.
    final mode = ref.watch(discoverModeProvider);
    final key = (categoryId: widget.categoryId, mode: mode);
    final state = ref.watch(discoverProvider(key));

    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (state.items.isEmpty) {
      // EmptyState is already a viewport-filling scrollable (LayoutBuilder +
      // SingleChildScrollView), so hand it straight to RefreshIndicator. Do NOT
      // wrap it in a ListView — a ListView gives children unbounded height,
      // which makes EmptyState's ConstrainedBox(minHeight: maxHeight) force an
      // infinite height and the whole tab fails to lay out.
      return RefreshIndicator(
        onRefresh: () =>
            ref.read(discoverProvider(key).notifier).load(refresh: true),
        child: const EmptyState(
          icon: Icons.explore_off_outlined,
          title: 'Nothing here yet',
          subtitle:
              'New requests with seller offers will show up here. Pull to refresh.',
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () =>
          ref.read(discoverProvider(key).notifier).load(refresh: true),
      child: GridView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          // Taller-than-wide cell: a ~square thumbnail on top + a short text
          // block below. The thumbnail is Expanded so the cell never overflows.
          childAspectRatio: 0.70,
        ),
        itemCount: state.items.length,
        itemBuilder: (context, index) {
          final item = state.items[index];
          return _DiscoverGridCard(
            item: item,
            onTap: () =>
                context.push('/discover/posts/${item.post.id}', extra: item),
          );
        },
      ),
    );
  }
}

/// A marketplace-style grid card: photo-or-category-fallback, price, summarized
/// title, and a compact offers line. The full offer list lives on post detail.
class _DiscoverGridCard extends StatelessWidget {
  final DiscoverItem item;
  final VoidCallback onTap;

  const _DiscoverGridCard({required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final post = item.post;
    final budget = formatBudget(
      budgetMin: post.budgetMin,
      budgetMax: post.budgetMax,
      budgetType: post.budgetType,
    );
    final priceLabel = budget.isNotEmpty ? budget : 'Open budget';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.subtleBorder, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(15),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _DiscoverThumb(post: post)),
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      priceLabel,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      post.title,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.black,
                        height: 1.25,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    _OffersSummary(offers: item.offers),
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

/// Post thumbnail: the first uploaded photo, or — when the post has no photo —
/// a category-tinted fallback card (icon + category name) so every cell still
/// reads as a real listing. Mirrors the #311 category-card fallback intent.
class _DiscoverThumb extends StatelessWidget {
  final Post post;
  const _DiscoverThumb({required this.post});

  @override
  Widget build(BuildContext context) {
    final urls = post.photoUrls;
    if (urls.isEmpty) return post.categoryCard();
    return Image.network(
      urls.first,
      width: double.infinity,
      height: double.infinity,
      fit: BoxFit.cover,
      loadingBuilder: (context, child, progress) => progress == null
          ? child
          : Container(color: AppColors.surfaceVariant),
      errorBuilder: (context, error, stack) => post.categoryCard(),
    );
  }
}

/// Compact summary of the competing seller offers shown on a grid card: the
/// count plus the price span. The full per-seller offer rows are on post detail.
class _OffersSummary extends StatelessWidget {
  final List<DiscoverOffer> offers;
  const _OffersSummary({required this.offers});

  @override
  Widget build(BuildContext context) {
    if (offers.isEmpty) return const SizedBox.shrink();
    final amounts = offers.map((o) => o.quoteAmount).toList()..sort();
    final lo = amounts.first;
    final hi = amounts.last;
    final count = offers.length;
    final priceText = count == 1 || lo == hi
        ? '\$${lo.toStringAsFixed(0)}'
        : '\$${lo.toStringAsFixed(0)}–\$${hi.toStringAsFixed(0)}';

    return Row(
      children: [
        const Icon(Icons.local_offer_outlined,
            size: 12, color: AppColors.primary),
        const SizedBox(width: 4),
        Text(
          count == 1 ? '1 offer' : '$count offers',
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.grey,
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            priceText,
            textAlign: TextAlign.right,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: AppColors.primary,
            ),
          ),
        ),
      ],
    );
  }
}

/// Feed-mode selector (#323) — a compact segmented pill row that scopes all three
/// category tabs at once: For You (proximity + your posted-category affinity),
/// Trending (most competing offers), Nearby (within range of your saved location).
class DiscoverModeSelector extends ConsumerWidget {
  const DiscoverModeSelector({super.key});

  static const _modes = <(String, String, IconData)>[
    ('For You', 'foryou', Icons.auto_awesome_outlined),
    ('Trending', 'trending', Icons.trending_up),
    ('Nearby', 'nearby', Icons.near_me_outlined),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(discoverModeProvider);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Row(
        children: [
          for (final (label, value, icon) in _modes) ...[
            Expanded(
              child: GestureDetector(
                onTap: () =>
                    ref.read(discoverModeProvider.notifier).state = value,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: selected == value
                        ? AppColors.primary
                        : AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: selected == value
                          ? AppColors.primary
                          : AppColors.border,
                      width: 1.5,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(icon,
                          size: 14,
                          color: selected == value
                              ? Colors.white
                              : AppColors.greyMedium),
                      const SizedBox(width: 5),
                      Flexible(
                        child: Text(
                          label,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                            color: selected == value
                                ? Colors.white
                                : AppColors.greyMedium,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (value != _modes.last.$2) const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}

