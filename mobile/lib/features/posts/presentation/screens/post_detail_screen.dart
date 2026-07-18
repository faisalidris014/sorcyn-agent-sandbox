import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:video_player/video_player.dart';

import '../../../../core/network/api_error_extractor.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/confirmation_dialog.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../data/models/post_model.dart';
import '../../providers/post_provider.dart';
import '../widgets/post_category_card.dart';

class PostDetailScreen extends ConsumerWidget {
  final String postId;

  const PostDetailScreen({super.key, required this.postId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final postAsync = ref.watch(postDetailProvider(postId));

    return Scaffold(
      backgroundColor: Colors.white,
      body: postAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Failed to load post'),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => ref.invalidate(postDetailProvider(postId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (post) => _PostDetailContent(post: post, postId: postId),
      ),
    );
  }
}

class _PostDetailContent extends ConsumerWidget {
  final Post post;
  final String postId;

  const _PostDetailContent({required this.post, required this.postId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Owner-only screen: gate the overflow menu and CTA by ownership so a
    // non-owner (e.g. a seller who reached this route) never gets edit/delete
    // controls or the owner CTA on someone else's post (#300).
    final currentUserId = ref.watch(authProvider).user?.id;
    final isOwner = currentUserId != null && post.buyerId == currentUserId;

    return Column(
      children: [
        Expanded(
          child: CustomScrollView(
            slivers: [
              // App bar
              SliverToBoxAdapter(
                child: SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                    child: Row(
                      children: [
                        GestureDetector(
                          onTap: () => context.canPop() ? context.pop() : context.go('/dashboard'),
                          child: Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: AppColors.surfaceVariant,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: const Icon(Icons.chevron_left,
                                size: 20, color: AppColors.black),
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Text(
                            'Post Details',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppColors.black,
                            ),
                          ),
                        ),
                        if (isOwner)
                          _OverflowMenu(post: post, postId: postId)
                        else
                          const SizedBox(width: 38),
                      ],
                    ),
                  ),
                ),
              ),

              // Media carousel (photos + videos), or a category-card fallback
              // when the buyer uploaded no media.
              if (post.photoUrls.isNotEmpty || post.videoUrls.isNotEmpty)
                SliverToBoxAdapter(
                  child: _MediaCarousel(
                    items: [...post.photoUrls, ...post.videoUrls],
                  ),
                )
              else
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: SizedBox(
                        height: 180,
                        child: post.categoryCard(iconSize: 56),
                      ),
                    ),
                  ),
                ),

              // Content
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title + Status
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              post.title,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: AppColors.black,
                                letterSpacing: -0.02,
                                height: 1.3,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          StatusBadge(status: post.status),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Category tags
                      Wrap(
                        spacing: 8,
                        children: [
                          if (post.categoryName.isNotEmpty)
                            _CategoryPill(
                              label: post.categoryName,
                              isPrimary: true,
                            ),
                          if (post.subcategoryName.isNotEmpty)
                            _CategoryPill(
                              label: post.subcategoryName,
                              isPrimary: false,
                            ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Key info grid
                      _InfoGrid(post: post),
                      const SizedBox(height: 20),

                      // Description
                      const Text(
                        'Description',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.black,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        post.description,
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.grey,
                          height: 1.6,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Activity strip
                      _ActivityStrip(post: post),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        // Bottom CTA — owner-only ("Waiting for Offers" / "View Offers").
        if (isOwner && (post.hasOffers || post.isActive))
          _BottomCTA(post: post),
      ],
    );
  }
}

// ─── Media Carousel (photos + videos) ───────────────────────────────

bool _isVideoUrl(String url) {
  final path = url.toLowerCase().split('?').first;
  return path.endsWith('.mp4') ||
      path.endsWith('.mov') ||
      path.endsWith('.webm') ||
      path.endsWith('.m4v');
}

class _MediaCarousel extends StatefulWidget {
  final List<String> items;

  const _MediaCarousel({required this.items});

  @override
  State<_MediaCarousel> createState() => _MediaCarouselState();
}

class _MediaCarouselState extends State<_MediaCarousel> {
  int _currentPage = 0;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 220,
      child: Stack(
        children: [
          PageView.builder(
            itemCount: widget.items.length,
            onPageChanged: (i) => setState(() => _currentPage = i),
            itemBuilder: (context, index) {
              final url = widget.items[index];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: _isVideoUrl(url)
                      ? _VideoItem(url: url)
                      : Image.network(
                          url,
                          fit: BoxFit.cover,
                          width: double.infinity,
                          errorBuilder: (_, _, _) => Container(
                            color: AppColors.greyLight,
                            child: const Icon(Icons.broken_image,
                                size: 48, color: AppColors.greyMedium),
                          ),
                        ),
                ),
              );
            },
          ),
          // Dot indicators
          if (widget.items.length > 1)
            Positioned(
              bottom: 12,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(widget.items.length, (i) {
                  final isActive = i == _currentPage;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: isActive ? 20 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: isActive
                          ? AppColors.primary
                          : Colors.white.withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  );
                }),
              ),
            ),
          // Media count badge
          Positioned(
            top: 12,
            right: 36,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '${_currentPage + 1}/${widget.items.length}',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Video Item ──────────────────────────────────────────────────────

class _VideoItem extends StatefulWidget {
  final String url;

  const _VideoItem({required this.url});

  @override
  State<_VideoItem> createState() => _VideoItemState();
}

class _VideoItemState extends State<_VideoItem> {
  late VideoPlayerController _controller;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.url))
      ..initialize().then((_) {
        if (mounted) setState(() => _initialized = true);
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_initialized) {
      return const ColoredBox(
        color: Colors.black,
        child: Center(
          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
        ),
      );
    }

    return ValueListenableBuilder<VideoPlayerValue>(
      valueListenable: _controller,
      builder: (context, value, _) {
        return GestureDetector(
          onTap: () =>
              value.isPlaying ? _controller.pause() : _controller.play(),
          child: Stack(
            fit: StackFit.expand,
            children: [
              FittedBox(
                fit: BoxFit.cover,
                clipBehavior: Clip.hardEdge,
                child: SizedBox(
                  width: value.size.width,
                  height: value.size.height,
                  child: VideoPlayer(_controller),
                ),
              ),
              if (!value.isPlaying)
                Center(
                  child: Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.5),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.play_arrow_rounded,
                      color: Colors.white,
                      size: 32,
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

// ─── Category Pill ───────────────────────────────────────────────────

class _CategoryPill extends StatelessWidget {
  final String label;
  final bool isPrimary;

  const _CategoryPill({required this.label, required this.isPrimary});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isPrimary
            ? AppColors.primary.withValues(alpha: 0.08)
            : AppColors.secondaryPurple.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isPrimary
              ? AppColors.primary.withValues(alpha: 0.25)
              : AppColors.secondaryPurple.withValues(alpha: 0.25),
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: isPrimary ? AppColors.primary : AppColors.secondaryPurple,
        ),
      ),
    );
  }
}

// ─── Info Grid ───────────────────────────────────────────────────────

class _InfoGrid extends StatelessWidget {
  final Post post;

  const _InfoGrid({required this.post});

  @override
  Widget build(BuildContext context) {
    final items = <_InfoItem>[
      _InfoItem(
        icon: Icons.attach_money,
        label: 'Budget',
        value: formatBudget(
          budgetMin: post.budgetMin,
          budgetMax: post.budgetMax,
          budgetType: post.budgetType,
        ),
      ),
      if (post.locationAddress != null)
        _InfoItem(
          icon: Icons.location_on_outlined,
          label: 'Location',
          value: post.locationAddress!,
        )
      else if (post.locationCity != null && post.locationState != null)
        _InfoItem(
          icon: Icons.lock_outline,
          label: 'Location',
          value: '${post.locationCity!}, ${post.locationState!}'
              '${post.locationZip != null ? " ${post.locationZip!}" : ""}',
          subtext: 'Full address shared after payment',
        ),
      _InfoItem(
        icon: Icons.schedule,
        label: 'Urgency',
        value: formatUrgency(post.urgency),
      ),
      if (post.categoryName.isNotEmpty)
        _InfoItem(
          icon: Icons.category_outlined,
          label: 'Category',
          value: post.subcategoryName.isNotEmpty
              ? '${post.categoryName} > ${post.subcategoryName}'
              : post.categoryName,
        ),
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFAFAFF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFF0EBFF)),
      ),
      child: Column(
        children: items.asMap().entries.map((entry) {
          final i = entry.key;
          final item = entry.value;
          return Column(
            children: [
              if (i > 0)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Container(
                    height: 1,
                    color: const Color(0xFFF0EBFF),
                  ),
                ),
              Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(item.icon, size: 16, color: AppColors.primary),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.label,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.greyMedium,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item.value,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.black,
                        ),
                      ),
                      if (item.subtext != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          item.subtext!,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: AppColors.greyMedium,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _InfoItem {
  final IconData icon;
  final String label;
  final String value;
  final String? subtext;

  const _InfoItem({
    required this.icon,
    required this.label,
    required this.value,
    this.subtext,
  });
}

// ─── Activity Strip ──────────────────────────────────────────────────

class _ActivityStrip extends StatelessWidget {
  final Post post;

  const _ActivityStrip({required this.post});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: IntrinsicHeight(
        child: Row(
          children: [
            _ActivityCol(
              icon: Icons.calendar_today_outlined,
              label: 'Posted',
              value: formatRelativeDate(post.createdAt),
            ),
            VerticalDivider(
              width: 1,
              thickness: 1,
              color: AppColors.border,
            ),
            _ActivityCol(
              icon: Icons.visibility_outlined,
              label: 'Views',
              value: '${post.viewCount}',
            ),
            VerticalDivider(
              width: 1,
              thickness: 1,
              color: AppColors.border,
            ),
            _ActivityCol(
              icon: Icons.local_offer_outlined,
              label: 'Offers',
              value: '${post.offerCount}',
              valueColor: post.offerCount > 0 ? AppColors.primary : null,
            ),
          ],
        ),
      ),
    );
  }
}

class _ActivityCol extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  const _ActivityCol({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 16, color: AppColors.greyMedium),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: valueColor ?? AppColors.black,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              color: AppColors.greyMedium,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Bottom CTA ──────────────────────────────────────────────────────

class _BottomCTA extends StatelessWidget {
  final Post post;

  const _BottomCTA({required this.post});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: GradientButton(
          text: post.hasOffers
              ? 'View Offers (${post.offerCount})'
              : 'Waiting for Offers...',
          height: 52,
          borderRadius: 20,
          icon: post.hasOffers ? Icons.local_offer : null,
          onPressed: post.hasOffers
              ? () => context.push('/posts/${post.id}/offers')
              : null,
        ),
      ),
    );
  }
}

// ─── Overflow Menu ───────────────────────────────────────────────────

class _OverflowMenu extends ConsumerWidget {
  final Post post;
  final String postId;

  const _OverflowMenu({required this.post, required this.postId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PopupMenuButton<String>(
      onSelected: (action) => _handleAction(context, ref, action),
      offset: const Offset(0, 40),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      icon: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: AppColors.surfaceVariant,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: const Icon(Icons.more_horiz, size: 18, color: AppColors.black),
      ),
      itemBuilder: (context) => [
        if (post.canEdit)
          const PopupMenuItem(
            value: 'edit',
            child: _MenuRow(icon: Icons.edit_outlined, label: 'Edit'),
          ),
        if (post.canExtend)
          const PopupMenuItem(
            value: 'extend',
            child: _MenuRow(icon: Icons.timer_outlined, label: 'Extend'),
          ),
        if (post.isActive)
          const PopupMenuItem(
            value: 'filled',
            child:
                _MenuRow(icon: Icons.check_circle_outline, label: 'Mark Filled'),
          ),
        if (post.canRepost)
          const PopupMenuItem(
            value: 'repost',
            child: _MenuRow(icon: Icons.refresh, label: 'Repost'),
          ),
        if (post.canDelete)
          const PopupMenuItem(
            value: 'delete',
            child: _MenuRow(
              icon: Icons.delete_outline,
              label: 'Delete',
              isDestructive: true,
            ),
          ),
      ],
    );
  }

  Future<void> _handleAction(
      BuildContext context, WidgetRef ref, String action) async {
    final messenger = ScaffoldMessenger.of(context);
    void showError(Object e) {
      messenger.showSnackBar(SnackBar(
        backgroundColor: AppColors.error,
        content: Text(extractApiErrorMessage(e)),
      ));
    }

    void showSuccess(String message) {
      messenger.showSnackBar(SnackBar(
        backgroundColor: AppColors.success,
        content: Text(message),
      ));
    }

    try {
      switch (action) {
        case 'edit':
          context.push('/posts/$postId/edit');
        case 'extend':
          final result =
              await ref.read(postsProvider.notifier).extendPost(postId);
          ref.invalidate(postDetailProvider(postId));
          showSuccess(
              'Post extended. ${result.extensionsRemaining} extension(s) remaining.');
        case 'filled':
          await ref.read(postsProvider.notifier).markFilled(postId);
          ref.invalidate(postDetailProvider(postId));
          showSuccess('Post marked as filled.');
        case 'repost':
          final newPost = await ref.read(postsProvider.notifier).repost(postId);
          if (context.mounted) {
            showSuccess('New post created from this one.');
            context.push('/posts/${newPost.id}');
          }
        case 'delete':
          final confirmed = await showConfirmationDialog(
            context,
            title: 'Delete Post',
            message:
                'Are you sure you want to delete this post? This cannot be undone.',
            confirmLabel: 'Delete',
            isDestructive: true,
          );
          if (confirmed && context.mounted) {
            await ref.read(postsProvider.notifier).deletePost(postId);
            // My Posts is now a pushed screen (the tab slot became Discover, #315);
            // route home so the user lands on a shell tab, not a dead-end stack.
            if (context.mounted) context.go('/dashboard');
          }
      }
    } catch (e) {
      showError(e);
    }
  }
}

class _MenuRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isDestructive;

  const _MenuRow({
    required this.icon,
    required this.label,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = isDestructive ? AppColors.error : AppColors.black;
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 10),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: color,
          ),
        ),
      ],
    );
  }
}
