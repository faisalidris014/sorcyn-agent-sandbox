import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../providers/post_provider.dart';
import '../widgets/post_card.dart';

const _filterTabs = ['All', 'Active', 'Filled', 'Expired', 'Cancelled'];

const _sortOptions = [
  ('newest', 'Newest First'),
  ('oldest', 'Oldest First'),
  ('most_offers', 'Most Offers'),
  ('expiring_soon', 'Expiring Soon'),
  ('budget_high', 'Budget: High→Low'),
  ('budget_low', 'Budget: Low→High'),
];

class MyPostsScreen extends ConsumerStatefulWidget {
  const MyPostsScreen({super.key});

  @override
  ConsumerState<MyPostsScreen> createState() => _MyPostsScreenState();
}

class _MyPostsScreenState extends ConsumerState<MyPostsScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final state = ref.read(postsProvider);
      if (state.posts.isEmpty && !state.isLoading) {
        ref.read(postsProvider.notifier).loadMyPosts();
      }
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
      ref.read(postsProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(postsProvider);

    return Scaffold(
      backgroundColor: AppColors.surfaceVariant,
      body: Column(
        children: [
          // App bar section (white)
          Container(
            color: Colors.white,
            child: SafeArea(
              bottom: false,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title + sort + create button
                  Padding(
                    padding: const EdgeInsets.fromLTRB(8, 6, 18, 14),
                    child: Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
                          color: AppColors.black,
                          onPressed: () => context.pop(),
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'My Posts',
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.black,
                                  letterSpacing: -0.03,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${state.posts.length} post${state.posts.length != 1 ? 's' : ''} total',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.greyMedium,
                                ),
                              ),
                            ],
                          ),
                        ),
                        _SortButton(
                          value: state.sortBy,
                          onChanged: (v) =>
                              ref.read(postsProvider.notifier).setSortBy(v),
                        ),
                        const SizedBox(width: 8),
                        _CreateButton(
                          onTap: () => context.push('/posts/create'),
                        ),
                      ],
                    ),
                  ),

                  // Filter tabs
                  SizedBox(
                    height: 38,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                      itemCount: _filterTabs.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 7),
                      itemBuilder: (context, index) {
                        final tab = _filterTabs[index];
                        final filterValue =
                            tab == 'All' ? null : tab.toLowerCase();
                        final isActive =
                            state.statusFilter == filterValue;
                        final count = _countForFilter(state, tab);

                        return _FilterTab(
                          label: tab,
                          count: count,
                          isActive: isActive,
                          onTap: () => ref
                              .read(postsProvider.notifier)
                              .setStatusFilter(filterValue),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 14),
                ],
              ),
            ),
          ),

          // Stats row (only when "All" filter)
          if (state.statusFilter == null && state.posts.isNotEmpty)
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(18, 0, 18, 16),
              child: _StatsRow(posts: state.posts),
            ),

          // Post list
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.posts.isEmpty
                    ? _EmptyState(
                        filter: state.statusFilter,
                        onCreatePost: () => context.push('/posts/create'),
                      )
                    : RefreshIndicator(
                        onRefresh: () => ref
                            .read(postsProvider.notifier)
                            .loadMyPosts(refresh: true),
                        child: ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.fromLTRB(
                              16, 14, 16, 100),
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
                            return PostCard(
                              post: post,
                              onTap: () =>
                                  context.push('/posts/${post.id}'),
                              actionButtons:
                                  _buildActions(context, post),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  int _countForFilter(PostsState state, String tab) {
    if (tab == 'All') return state.posts.length;
    final status = tab.toLowerCase();
    return state.posts.where((p) => p.status == status).length;
  }

  List<Widget>? _buildActions(BuildContext context, dynamic post) {
    if (post.isDraft) {
      return [
        Expanded(
          child: _ActionBtn(
            label: 'Edit Draft',
            icon: Icons.edit_outlined,
            onTap: () => context.push('/posts/${post.id}'),
          ),
        ),
        Expanded(
          flex: 2,
          child: _GradientActionBtn(
            label: 'Publish',
            icon: Icons.arrow_forward,
            onTap: () => context.push('/posts/${post.id}'),
          ),
        ),
      ];
    }
    if (post.isActive) {
      return [
        Expanded(
          child: _ActionBtn(
            label: 'View',
            icon: Icons.info_outline,
            onTap: () => context.push('/posts/${post.id}'),
          ),
        ),
        Expanded(
          flex: 2,
          child: _GradientActionBtn(
            label: 'View Offers',
            icon: Icons.chat_bubble_outline,
            badge: post.offerCount > 0 ? post.offerCount : null,
            onTap: () => context.push('/posts/${post.id}/offers'),
          ),
        ),
      ];
    }
    if (post.isFilled) {
      return [
        Expanded(
          child: _ActionBtn(
            label: 'View Details',
            onTap: () => context.push('/posts/${post.id}'),
          ),
        ),
      ];
    }
    if (post.isExpired || post.isCancelled) {
      return [
        Expanded(
          child: _ActionBtn(
            label: 'View',
            icon: Icons.info_outline,
            onTap: () => context.push('/posts/${post.id}'),
          ),
        ),
        Expanded(
          child: _OutlineActionBtn(
            label: 'Repost',
            icon: Icons.refresh,
            onTap: () => context.push('/posts/create'),
          ),
        ),
      ];
    }
    return null;
  }
}

// ─── Filter Tab ──────────────────────────────────────────────────────

class _FilterTab extends StatelessWidget {
  final String label;
  final int count;
  final bool isActive;
  final VoidCallback onTap;

  const _FilterTab({
    required this.label,
    required this.count,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 32,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          gradient: isActive ? AppColors.primaryGradient : null,
          color: isActive ? null : Colors.white,
          borderRadius: BorderRadius.circular(100),
          border: isActive ? null : Border.all(color: AppColors.border),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isActive ? Colors.white : AppColors.grey,
              ),
            ),
            if (count > 0) ...[
              const SizedBox(width: 5),
              Container(
                constraints: const BoxConstraints(minWidth: 17),
                height: 17,
                padding: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: isActive
                      ? Colors.white.withValues(alpha: 0.28)
                      : AppColors.grey.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Center(
                  child: Text(
                    '$count',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: isActive ? Colors.white : AppColors.grey,
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ─── Sort Button ─────────────────────────────────────────────────────

class _SortButton extends StatelessWidget {
  final String value;
  final ValueChanged<String> onChanged;

  const _SortButton({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final currentLabel =
        _sortOptions.firstWhere((o) => o.$1 == value, orElse: () => _sortOptions.first).$2;

    return PopupMenuButton<String>(
      onSelected: onChanged,
      offset: const Offset(0, 40),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      itemBuilder: (context) => _sortOptions
          .map((o) => PopupMenuItem(
                value: o.$1,
                child: Text(
                  o.$2,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: o.$1 == value ? FontWeight.w700 : FontWeight.w500,
                    color: o.$1 == value ? AppColors.primary : AppColors.black,
                  ),
                ),
              ))
          .toList(),
      child: Container(
        height: 34,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: AppColors.primary.withValues(alpha: 0.3),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.sort, size: 13, color: AppColors.primary),
            const SizedBox(width: 5),
            Text(
              currentLabel,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(width: 3),
            const Icon(Icons.keyboard_arrow_down,
                size: 14, color: AppColors.primary),
          ],
        ),
      ),
    );
  }
}

// ─── Create Button ───────────────────────────────────────────────────

class _CreateButton extends StatelessWidget {
  final VoidCallback onTap;

  const _CreateButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          gradient: AppColors.primaryGradient,
          borderRadius: BorderRadius.circular(13),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.38),
              blurRadius: 14,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Icon(Icons.add, color: Colors.white, size: 17),
      ),
    );
  }
}

// ─── Stats Row ───────────────────────────────────────────────────────

class _StatsRow extends StatelessWidget {
  final List<dynamic> posts;

  const _StatsRow({required this.posts});

  @override
  Widget build(BuildContext context) {
    final active = posts.where((p) => p.isActive).length;
    final totalOffers = posts.fold<int>(0, (s, p) => s + (p.offerCount as int));
    final filled = posts.where((p) => p.isFilled).length;
    final drafts = posts.where((p) => p.isDraft).length;

    final stats = [
      ('Active', active, const Color(0xFF059669), const Color(0x1410B981)),
      ('Total Offers', totalOffers, AppColors.primary, AppColors.primary.withValues(alpha: 0.08)),
      ('Filled', filled, AppColors.secondaryPurple, AppColors.secondaryPurple.withValues(alpha: 0.08)),
      ('Drafts', drafts, AppColors.grey, AppColors.grey.withValues(alpha: 0.07)),
    ];

    return Row(
      children: stats.map((s) {
        return Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 4),
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
            decoration: BoxDecoration(
              color: s.$4,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              children: [
                Text(
                  '${s.$2}',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: s.$3,
                    letterSpacing: -0.02,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  s.$1.toUpperCase(),
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: s.$3.withValues(alpha: 0.75),
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ─── Action Buttons ──────────────────────────────────────────────────

class _ActionBtn extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback onTap;

  const _ActionBtn({required this.label, this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 38,
        decoration: BoxDecoration(
          color: AppColors.surfaceVariant,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 13, color: AppColors.grey),
              const SizedBox(width: 5),
            ],
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.black,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GradientActionBtn extends StatelessWidget {
  final String label;
  final IconData? icon;
  final int? badge;
  final VoidCallback onTap;

  const _GradientActionBtn({
    required this.label,
    this.icon,
    this.badge,
    required this.onTap,
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
            if (icon != null) ...[
              Icon(icon, size: 13, color: Colors.white),
              const SizedBox(width: 5),
            ],
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
            if (badge != null) ...[
              const SizedBox(width: 5),
              Container(
                constraints: const BoxConstraints(minWidth: 18),
                height: 18,
                padding: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.28),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Center(
                  child: Text(
                    '$badge',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _OutlineActionBtn extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback onTap;

  const _OutlineActionBtn({
    required this.label,
    this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 38,
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppColors.primary.withValues(alpha: 0.28),
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 13, color: AppColors.primary),
              const SizedBox(width: 5),
            ],
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
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

// ─── Empty State ─────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final String? filter;
  final VoidCallback onCreatePost;

  const _EmptyState({this.filter, required this.onCreatePost});

  @override
  Widget build(BuildContext context) {
    final isFiltered = filter != null;

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.post_add_rounded,
              size: 64,
              color: AppColors.primary.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 20),
            Text(
              isFiltered ? 'No ${filter!} posts' : 'No posts yet',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: AppColors.black,
                letterSpacing: -0.02,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              isFiltered
                  ? "You don't have any ${filter!} posts at the moment."
                  : 'Post what you need and let sellers compete to win your business.',
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.grey,
                height: 1.65,
              ),
              textAlign: TextAlign.center,
            ),
            if (!isFiltered) ...[
              const SizedBox(height: 28),
              GradientButton(
                text: 'Create Your First Post',
                icon: Icons.add,
                height: 52,
                borderRadius: 20,
                onPressed: onCreatePost,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
