import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_logo.dart';
import '../../../../shared/widgets/welcome_card.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../notifications/providers/notification_provider.dart';
import '../../providers/post_provider.dart';
import '../widgets/post_card.dart';

class BuyerDashboardScreen extends ConsumerStatefulWidget {
  const BuyerDashboardScreen({super.key});

  @override
  ConsumerState<BuyerDashboardScreen> createState() =>
      _BuyerDashboardScreenState();
}

class _BuyerDashboardScreenState extends ConsumerState<BuyerDashboardScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final state = ref.read(postsProvider);
      if (state.posts.isEmpty && !state.isLoading) {
        ref.read(postsProvider.notifier).loadMyPosts();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final postsState = ref.watch(postsProvider);
    final user = authState.user;
    final userName = user?.firstName ?? 'there';

    final activePosts = postsState.posts.where((p) => p.isActive).length;
    final totalOffers =
        postsState.posts.fold<int>(0, (sum, p) => sum + p.offerCount);
    final completedCount =
        postsState.posts.where((p) => p.isFilled).length;

    return Scaffold(
      backgroundColor: Colors.white,
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(postsProvider.notifier).loadMyPosts(refresh: true),
        child: CustomScrollView(
          slivers: [
            // Header row
            SliverToBoxAdapter(
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: Row(
                    children: [
                      const AppLogo(size: 34),
                      const SizedBox(width: 10),
                      const Text(
                        'Sorcyn',
                        style: TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.w700,
                          color: AppColors.black,
                          letterSpacing: -0.02,
                        ),
                      ),
                      const Spacer(),
                      // Notification bell
                      Consumer(
                        builder: (context, ref, _) {
                          final unreadAsync =
                              ref.watch(notificationUnreadCountProvider);
                          final count = unreadAsync.valueOrNull ?? 0;
                          return GestureDetector(
                            onTap: () => context.push('/notifications'),
                            child: Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: AppColors.surfaceVariant,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Stack(
                                alignment: Alignment.center,
                                children: [
                                  const Icon(
                                    Icons.notifications_outlined,
                                    size: 20,
                                    color: AppColors.black,
                                  ),
                                  if (count > 0)
                                    Positioned(
                                      top: 8,
                                      right: 8,
                                      child: Container(
                                        width: 9,
                                        height: 9,
                                        decoration: BoxDecoration(
                                          color: AppColors.error,
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: Colors.white,
                                            width: 1.5,
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Welcome Card
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: WelcomeCard(
                  userName: userName,
                  activePosts: activePosts,
                  totalOffers: totalOffers,
                  completed: completedCount,
                  onCreatePost: () => context.push('/posts/create'),
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 24)),

            // Section header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Row(
                  children: [
                    const Text(
                      'My Posts',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: AppColors.black,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          '${postsState.posts.length}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => context.push('/my-posts'),
                      child: const Text(
                        'See all',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 12)),

            // Post list or states
            if (postsState.isLoading)
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: Center(child: CircularProgressIndicator()),
                ),
              )
            else if (postsState.posts.isEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: _EmptyState(
                    onCreatePost: () => context.push('/posts/create'),
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                sliver: SliverList.builder(
                  itemCount: postsState.posts.length > 5
                      ? 5
                      : postsState.posts.length,
                  itemBuilder: (context, index) {
                    final post = postsState.posts[index];
                    return PostCard(
                      post: post,
                      onTap: () => context.push('/posts/${post.id}'),
                    );
                  },
                ),
              ),

            // Bottom padding for nav bar
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final VoidCallback onCreatePost;

  const _EmptyState({required this.onCreatePost});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.post_add,
              size: 32,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'No posts yet',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: AppColors.black,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Create your first post and let sellers come to you!',
            style: TextStyle(
              fontSize: 13,
              color: AppColors.grey,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          GestureDetector(
            onTap: onCreatePost,
            child: Container(
              height: 44,
              padding: const EdgeInsets.symmetric(horizontal: 24),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add, color: Colors.white, size: 18),
                  SizedBox(width: 6),
                  Text(
                    'Create Post',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
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
