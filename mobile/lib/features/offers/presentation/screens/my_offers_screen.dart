import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../widgets/offer_card.dart';
import '../../providers/offer_provider.dart';

class MyOffersScreen extends ConsumerStatefulWidget {
  const MyOffersScreen({super.key});

  @override
  ConsumerState<MyOffersScreen> createState() => _MyOffersScreenState();
}

class _MyOffersScreenState extends ConsumerState<MyOffersScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(myOffersProvider.notifier).loadMyOffers();
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
      ref.read(myOffersProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(myOffersProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'My Offers',
        actions: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border, width: 1.5),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.bar_chart, size: 14, color: AppColors.black),
                const SizedBox(width: 4),
                Text(
                  '${state.offers.length}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.black,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Stats row (only visible when All tab)
          if (state.statusFilter == null) _buildStatsRow(state),

          // Filter tabs
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _GradientFilterChip(
                  label: 'All',
                  selected: state.statusFilter == null,
                  onTap: () => ref
                      .read(myOffersProvider.notifier)
                      .setStatusFilter(null),
                ),
                _GradientFilterChip(
                  label: 'Pending',
                  selected: state.statusFilter == 'pending',
                  onTap: () => ref
                      .read(myOffersProvider.notifier)
                      .setStatusFilter('pending'),
                ),
                _GradientFilterChip(
                  label: 'Accepted',
                  selected: state.statusFilter == 'accepted',
                  onTap: () => ref
                      .read(myOffersProvider.notifier)
                      .setStatusFilter('accepted'),
                ),
                _GradientFilterChip(
                  label: 'Declined',
                  selected: state.statusFilter == 'declined',
                  onTap: () => ref
                      .read(myOffersProvider.notifier)
                      .setStatusFilter('declined'),
                ),
                _GradientFilterChip(
                  label: 'Countered',
                  selected: state.statusFilter == 'counter_offered',
                  onTap: () => ref
                      .read(myOffersProvider.notifier)
                      .setStatusFilter('counter_offered'),
                ),
              ],
            ),
          ),

          // Sort + active-filter row (StatusBadge surfaces the live filter)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (state.statusFilter != null)
                  StatusBadge(status: state.statusFilter as String)
                else
                  const SizedBox.shrink(),
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
                          value: 'oldest', child: Text('Oldest')),
                      DropdownMenuItem(
                          value: 'price_low', child: Text('Price: Low')),
                      DropdownMenuItem(
                          value: 'price_high', child: Text('Price: High')),
                    ],
                    onChanged: (v) {
                      if (v != null) {
                        ref.read(myOffersProvider.notifier).setSortBy(v);
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
                : state.offers.isEmpty
                    ? Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Expanded(
                            child: EmptyState(
                              icon: Icons.local_offer_outlined,
                              title: 'No offers yet',
                              subtitle:
                                  'Browse buyer requests and submit your first offer!',
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
                            child: GradientButton(
                              text: 'Browse Requests',
                              icon: Icons.search,
                              onPressed: () => context.go('/'),
                            ),
                          ),
                        ],
                      )
                    : RefreshIndicator(
                        onRefresh: () => ref
                            .read(myOffersProvider.notifier)
                            .loadMyOffers(refresh: true),
                        child: ListView.builder(
                          controller: _scrollController,
                          // Shell uses extendBody:true, so the list renders
                          // behind the bottom nav. Clear the nav height + the
                          // device safe-area inset so the last card stays
                          // visible above it (#370).
                          padding: EdgeInsets.fromLTRB(
                            16,
                            0,
                            16,
                            16 +
                                kBottomNavigationBarHeight +
                                MediaQuery.of(context).viewPadding.bottom,
                          ),
                          itemCount: state.offers.length +
                              (state.isLoadingMore ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == state.offers.length) {
                              return const Center(
                                child: Padding(
                                  padding: EdgeInsets.all(16),
                                  child: CircularProgressIndicator(),
                                ),
                              );
                            }
                            final offer = state.offers[index];
                            return OfferCard(
                              offer: offer,
                              onTap: () =>
                                  context.push('/offers/${offer.id}'),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow(dynamic state) {
    final offers = state.offers as List;
    final pending =
        offers.where((o) => o.status == 'pending').length;
    // "Countered" surfaces the in-between states that need seller/buyer action.
    // Before, counter_offered/needs_reconfirmation offers were counted nowhere
    // and showed no banner, so they looked like silent pending offers (#1).
    final countered = offers
        .where((o) =>
            o.status == 'counter_offered' ||
            o.status == 'needs_reconfirmation')
        .length;
    final accepted =
        offers.where((o) => o.status == 'accepted').length;
    final declined =
        offers.where((o) => o.status == 'declined').length;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Row(
        children: [
          Expanded(
            child: _StatPill(
              label: 'Pending',
              value: '$pending',
              color: AppColors.warning,
              icon: Icons.hourglass_top,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _StatPill(
              label: 'Countered',
              value: '$countered',
              color: const Color(0xFF2563EB),
              icon: Icons.swap_horiz,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _StatPill(
              label: 'Accepted',
              value: '$accepted',
              color: AppColors.success,
              icon: Icons.check_circle,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _StatPill(
              label: 'Declined',
              value: '$declined',
              color: AppColors.error,
              icon: Icons.cancel,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData icon;

  const _StatPill({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          Text(
            label,
            style: const TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w500,
              color: AppColors.greyMedium,
            ),
          ),
        ],
      ),
    );
  }
}

class _GradientFilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _GradientFilterChip({
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
