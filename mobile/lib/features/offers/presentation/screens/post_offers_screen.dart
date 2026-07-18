import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../data/models/offer_model.dart';
import '../../providers/offer_provider.dart';
import '../widgets/compare_offers_modal.dart';
import '../widgets/accept_offer_modal.dart';
import '../widgets/offer_card.dart';

class PostOffersScreen extends ConsumerStatefulWidget {
  final String postId;
  final String? postTitle;
  final double? budgetMax;

  const PostOffersScreen({
    super.key,
    required this.postId,
    this.postTitle,
    this.budgetMax,
  });

  @override
  ConsumerState<PostOffersScreen> createState() => _PostOffersScreenState();
}

class _PostOffersScreenState extends ConsumerState<PostOffersScreen> {
  final _scrollController = ScrollController();
  String _sortBy = 'highest_rated';
  String _filterBy = 'all';
  final Set<String> _comparing = {};

  static const _sortOptions = [
    ('lowest_price', 'Lowest Price'),
    ('highest_rated', 'Highest Rated'),
    ('fastest', 'Fastest'),
    ('most_reviews', 'Most Reviews'),
    ('newest', 'Newest First'),
  ];

  static const _filterOptions = [
    ('all', 'All', Icons.apps),
    ('verified', 'Verified', Icons.verified_outlined),
    ('top_seller', 'Top Seller', Icons.star_outline),
    ('pro', 'Pro', Icons.work_outline),
    ('local', 'Nearby', Icons.location_on_outlined),
  ];

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(offersProvider.notifier).loadPostOffers(widget.postId);
    });
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
      ref.read(offersProvider.notifier).loadMore();
    }
  }

  List<Offer> _sortedFiltered(List<Offer> offers) {
    var filtered = offers.toList();

    // Filter
    switch (_filterBy) {
      case 'verified':
        filtered = filtered.where((o) =>
            o.seller?.badges.contains('verified') ?? false).toList();
        break;
      case 'top_seller':
        filtered = filtered.where((o) =>
            (o.seller?.totalCompleted ?? 0) > 50).toList();
        break;
      case 'pro':
        filtered = filtered.where((o) =>
            o.seller?.badges.contains('licensed') ?? false).toList();
        break;
      case 'local':
        // Non-remote offers only
        filtered = filtered.where((o) => o.seller != null).toList();
        break;
    }

    // Sort
    switch (_sortBy) {
      case 'lowest_price':
        filtered.sort((a, b) => a.quoteAmount.compareTo(b.quoteAmount));
        break;
      case 'highest_rated':
        filtered.sort((a, b) =>
            (b.sellerRating ?? 0).compareTo(a.sellerRating ?? 0));
        break;
      case 'fastest':
        filtered.sort((a, b) =>
            (a.completionTime ?? 'z').compareTo(b.completionTime ?? 'z'));
        break;
      case 'most_reviews':
        filtered.sort((a, b) =>
            b.sellerReviewCount.compareTo(a.sellerReviewCount));
        break;
      case 'newest':
        filtered.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        break;
    }

    return filtered;
  }

  void _toggleCompare(String id) {
    setState(() {
      if (_comparing.contains(id)) {
        _comparing.remove(id);
      } else if (_comparing.length < 3) {
        _comparing.add(id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(offersProvider);
    final offers = _sortedFiltered(state.offers);
    final pendingCount = state.offers.where((o) => o.isPending).length;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: '',
        onBack: () => Navigator.of(context).pop(),
        titleWidget: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Offers on',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.greyMedium,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    widget.postTitle ?? 'Your Post',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.black,
                      letterSpacing: -0.32,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (state.offers.isNotEmpty)
              Container(
                constraints: const BoxConstraints(minWidth: 36),
                height: 36,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(11),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    '${state.offers.length}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
      body: Column(
        children: [
          if (state.offers.isNotEmpty) ...[
            // Sort & count row
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 10),
              child: Row(
                children: [
                  Text.rich(
                    TextSpan(children: [
                      TextSpan(
                        text: '${offers.length}',
                        style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            color: AppColors.black),
                      ),
                      TextSpan(
                        text:
                            ' offer${offers.length != 1 ? 's' : ''}',
                        style: const TextStyle(color: AppColors.greyMedium),
                      ),
                      if (pendingCount < state.offers.length)
                        TextSpan(
                          text: ' \u00B7 $pendingCount pending',
                          style: const TextStyle(color: AppColors.greyMedium),
                        ),
                    ]),
                    style: const TextStyle(fontSize: 13),
                  ),
                  const Spacer(),
                  _SortDropdown(
                    value: _sortBy,
                    onChanged: (v) => setState(() => _sortBy = v),
                  ),
                ],
              ),
            ),

            // Filter chips
            SizedBox(
              height: 36,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 18),
                itemCount: _filterOptions.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final (key, label, icon) = _filterOptions[index];
                  final active = _filterBy == key;
                  return GestureDetector(
                    onTap: () => setState(() => _filterBy = key),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 160),
                      padding: const EdgeInsets.symmetric(horizontal: 11),
                      decoration: BoxDecoration(
                        gradient: active ? AppColors.primaryGradient : null,
                        color: active ? null : Colors.white,
                        border: active
                            ? null
                            : Border.all(
                                color: AppColors.border, width: 1.5),
                        borderRadius: BorderRadius.circular(100),
                        boxShadow: active
                            ? [
                                BoxShadow(
                                  color: AppColors.primary
                                      .withValues(alpha: 0.28),
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                ),
                              ]
                            : null,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            icon,
                            size: 13,
                            color:
                                active ? Colors.white : AppColors.grey,
                          ),
                          const SizedBox(width: 5),
                          Text(
                            label,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: active
                                  ? Colors.white
                                  : AppColors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 14),
            const Divider(height: 1, color: AppColors.greyLight),
          ],

          // Offer list
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.offers.isEmpty
                    ? _buildEmptyState()
                    : offers.isEmpty
                        ? _buildNoFilterMatch()
                        : RefreshIndicator(
                            onRefresh: () => ref
                                .read(offersProvider.notifier)
                                .loadPostOffers(widget.postId,
                                    refresh: true),
                            child: ListView.separated(
                              controller: _scrollController,
                              padding: EdgeInsets.fromLTRB(
                                18,
                                14,
                                18,
                                _comparing.isNotEmpty ? 110 : 20,
                              ),
                              itemCount: state.offers.length ==
                                      offers.length
                                  ? offers.length +
                                      (state.isLoadingMore ? 1 : 0)
                                  : offers.length,
                              separatorBuilder: (_, _) =>
                                  const SizedBox(height: 14),
                              itemBuilder: (context, index) {
                                if (index == offers.length) {
                                  return const Center(
                                    child: Padding(
                                      padding: EdgeInsets.all(16),
                                      child: CircularProgressIndicator(),
                                    ),
                                  );
                                }
                                final offer = offers[index];
                                return OfferCard(
                                  offer: offer,
                                  budgetMax: widget.budgetMax,
                                  isComparing:
                                      _comparing.contains(offer.id),
                                  onToggleCompare: () =>
                                      _toggleCompare(offer.id),
                                  onTap: () => context
                                      .push('/offers/${offer.id}'),
                                  onAccept: () =>
                                      _showAcceptModal(offer),
                                  onDecline: () =>
                                      _declineOffer(offer.id),
                                  onMessage: () {
                                    // Navigate to messaging
                                  },
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),

      // Compare floating banner
      bottomSheet: _comparing.length >= 2
          ? _CompareBanner(
              count: _comparing.length,
              onClear: () => setState(() => _comparing.clear()),
              onCompare: () => _showCompareModal(state.offers),
            )
          : null,
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
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.primaryGradient,
              ),
              child: const Icon(Icons.notifications_outlined,
                  size: 22, color: Colors.white),
            ),
            const SizedBox(height: 20),
            const Text(
              'No offers yet',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppColors.black,
                letterSpacing: -0.36,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Sellers are reviewing your post. Offers will appear here as they come in.',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.grey,
                height: 1.6,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            Text(
              "We'll notify you when offers arrive",
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.secondaryPurple,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoFilterMatch() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'No matches',
              style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.black),
            ),
            const SizedBox(height: 6),
            const Text(
              'Try removing the filter',
              style: TextStyle(fontSize: 13, color: AppColors.greyMedium),
            ),
            const SizedBox(height: 14),
            GestureDetector(
              onTap: () => setState(() => _filterBy = 'all'),
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 18, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primary, width: 1.5),
                ),
                child: const Text(
                  'Clear filter',
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
      ),
    );
  }

  void _showAcceptModal(Offer offer) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AcceptOfferModal(
        offer: offer,
        onConfirm: () async {
          Navigator.pop(context);
          try {
            final result = await ref
                .read(offersProvider.notifier)
                .acceptOffer(offer.id);
            if (mounted) {
              context.go('/transactions/${result.transactionId}');
            }
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Failed to accept offer')),
              );
            }
          }
        },
      ),
    );
  }

  Future<void> _declineOffer(String offerId) async {
    try {
      await ref.read(offersProvider.notifier).declineOffer(offerId);
      // Refresh the offers list
      ref.read(offersProvider.notifier).loadPostOffers(widget.postId, refresh: true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to decline offer')),
        );
      }
    }
  }

  void _showCompareModal(List<Offer> allOffers) {
    final selectedOffers =
        allOffers.where((o) => _comparing.contains(o.id)).toList();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CompareOffersModal(
        offers: selectedOffers,
        budgetMax: widget.budgetMax,
        onAccept: (offer) {
          Navigator.pop(context);
          _showAcceptModal(offer);
        },
        onClose: () => Navigator.pop(context),
      ),
    );
  }
}

// Sort dropdown
class _SortDropdown extends StatelessWidget {
  final String value;
  final ValueChanged<String> onChanged;

  const _SortDropdown({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final currentLabel = _PostOffersScreenState._sortOptions
        .firstWhere((o) => o.$1 == value,
            orElse: () => ('highest_rated', 'Highest Rated'))
        .$2;

    return PopupMenuButton<String>(
      onSelected: onChanged,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      offset: const Offset(0, 42),
      itemBuilder: (context) => _PostOffersScreenState._sortOptions
          .map((o) => PopupMenuItem(
                value: o.$1,
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        o.$2,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight:
                              o.$1 == value ? FontWeight.w700 : FontWeight.w500,
                          color: o.$1 == value
                              ? AppColors.primary
                              : const Color(0xFF374151),
                        ),
                      ),
                    ),
                    if (o.$1 == value)
                      const Icon(Icons.check,
                          size: 14, color: AppColors.primary),
                  ],
                ),
              ))
          .toList(),
      child: Container(
        height: 36,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.primary, width: 1.5),
          color: AppColors.primary.withValues(alpha: 0.06),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.sort, size: 13, color: AppColors.primary),
            const SizedBox(width: 6),
            Text(
              currentLabel,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.keyboard_arrow_down,
                size: 14, color: AppColors.primary),
          ],
        ),
      ),
    );
  }
}

// Compare banner at bottom
class _CompareBanner extends StatelessWidget {
  final int count;
  final VoidCallback onClear;
  final VoidCallback onCompare;

  const _CompareBanner({
    required this.count,
    required this.onClear,
    required this.onCompare,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.97),
        border: Border(
          top: BorderSide(
            color: AppColors.primary.withValues(alpha: 0.15),
          ),
        ),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: onClear,
            child: Container(
              height: 46,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border, width: 1.5),
                color: AppColors.surfaceVariant,
              ),
              child: Center(
                child: Text(
                  'Clear ($count)',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.grey,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: GestureDetector(
              onTap: onCompare,
              child: Container(
                height: 46,
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.35),
                      blurRadius: 22,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.compare_arrows,
                        size: 15, color: Colors.white),
                    const SizedBox(width: 8),
                    Text(
                      'Compare $count Offers',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
