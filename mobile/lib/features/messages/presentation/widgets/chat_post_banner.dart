import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../posts/data/models/post_model.dart';
import '../../../posts/presentation/widgets/post_category_card.dart';
import '../../../posts/providers/post_provider.dart';
import '../../data/models/message_model.dart';

/// The conversation's linked-post banner, redesigned as a hero "deal card"
/// (#402): the listing photo (or #311 category-card fallback) under a strong
/// scrim, the title, a neon progress edge + lifecycle labels, and two actions —
/// **See Details** (always → Post Details) and **More Choices** (a role/stage
/// aware action sheet).
///
/// Data comes from the full [Post] via [postDetailProvider]; the conversation
/// itself only carries the post id + title. While the post loads (or if it
/// fails) we fall back to a slim title strip so the header never flashes empty.
class ChatPostBanner extends ConsumerWidget {
  final ConversationDetail conversation;
  final String currentUserId;

  const ChatPostBanner({
    super.key,
    required this.conversation,
    required this.currentUserId,
  });

  // Deal lifecycle labels shown under the photo.
  static const _stages = ['Posted', 'Offer', 'Accepted', 'Escrow', 'Done'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final postId = conversation.postId;
    if (postId == null) return const SizedBox.shrink();

    final postAsync = ref.watch(postDetailProvider(postId));
    return postAsync.when(
      data: (post) => _HeroBanner(
        post: post,
        conversation: conversation,
        currentUserId: currentUserId,
        reachedStage: _reachedStage(post),
      ),
      loading: () => _SlimBanner(title: conversation.post?.title ?? ''),
      error: (_, _) => _SlimBanner(title: conversation.post?.title ?? ''),
    );
  }

  /// Best-effort mapping of the deal's furthest-reached lifecycle stage from the
  /// data the chat already has — no extra fetch. Accepted/Escrow granularity is
  /// intentionally coarse (a `filled` post means an offer was accepted and the
  /// deal is in/near escrow); it can be refined later from offer/transaction
  /// status without changing this widget's shape.
  int _reachedStage(Post post) {
    if (conversation.isLocked || post.status == 'completed') return 4; // Done
    if (post.isFilled) return 3; // Accepted → Escrow
    if (conversation.offerId != null) return 1; // Offer on the table
    return 0; // Posted
  }
}

/// Graceful placeholder while the full post loads or if it fails: the original
/// slim purple title strip.
class _SlimBanner extends StatelessWidget {
  final String title;
  const _SlimBanner({required this.title});

  @override
  Widget build(BuildContext context) {
    if (title.isEmpty) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.04),
        border: Border(
          bottom: BorderSide(color: AppColors.primary.withValues(alpha: 0.1)),
        ),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.article_outlined,
            size: 14,
            color: AppColors.primary,
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroBanner extends ConsumerWidget {
  final Post post;
  final ConversationDetail conversation;
  final String currentUserId;
  final int reachedStage;

  const _HeroBanner({
    required this.post,
    required this.conversation,
    required this.currentUserId,
    required this.reachedStage,
  });

  bool get _isBuyer => post.buyerId == currentUserId;

  MessageSender get _other => conversation.participant1.id == currentUserId
      ? conversation.participant2
      : conversation.participant1;

  void _openDetails(BuildContext context) {
    // Sellers get the read-only seller view (#300); the owner gets the full
    // owner detail.
    context.push(_isBuyer ? '/posts/${post.id}' : '/seller/posts/${post.id}');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.primary.withValues(alpha: 0.12)),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [_photo(context), _stageLabels(), _actions(context)],
      ),
    );
  }

  /// Adaptive "blurred fill": the whole photo is shown un-cropped (contain)
  /// over a blurred, slightly-zoomed copy of itself that fills the box — so any
  /// aspect ratio looks good with no crop and no blank bars. Both layers fall
  /// back to the category card if the image fails/loads.
  Widget _heroImage(String url) {
    final fallback = post.categoryCard(showLabel: false, iconSize: 52);
    Widget layer(BoxFit fit, {required bool isFallbackVisible}) {
      return Image.network(
        url,
        fit: fit,
        errorBuilder: (_, _, _) =>
            isFallbackVisible ? fallback : const SizedBox.shrink(),
        loadingBuilder: (context, child, progress) => progress == null
            ? child
            : (isFallbackVisible ? fallback : const SizedBox.shrink()),
      );
    }

    // ClipRect keeps the scaled + blurred backdrop from bleeding outside the
    // photo box (into the stage labels below).
    return ClipRect(
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Blurred backdrop fills the gaps left by the contained foreground.
          Transform.scale(
            scale: 1.15,
            child: ImageFiltered(
              imageFilter: ui.ImageFilter.blur(sigmaX: 18, sigmaY: 18),
              child: layer(BoxFit.cover, isFallbackVisible: false),
            ),
          ),
          // Full photo, un-cropped.
          layer(BoxFit.contain, isFallbackVisible: true),
        ],
      ),
    );
  }

  Widget _photo(BuildContext context) {
    final hasPhoto = post.photoUrls.isNotEmpty;
    return SizedBox(
      height: 185,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Hero image, or the category-card fallback when there's no photo.
          if (hasPhoto)
            _heroImage(post.photoUrls.first)
          else
            post.categoryCard(showLabel: false, iconSize: 52),

          // Strong scrim so the white title reads over any photo (bright/dark).
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                stops: [0.04, 0.55, 1.0],
                colors: [
                  Color(0x00080510),
                  Color(0x80080510),
                  Color(0xE6080510),
                ],
              ),
            ),
          ),

          // Title.
          Positioned(
            left: 16,
            right: 16,
            bottom: 14,
            child: Text(
              post.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.1,
                height: 1.25,
                shadows: [
                  Shadow(
                    color: Color(0x66000000),
                    blurRadius: 8,
                    offset: Offset(0, 1),
                  ),
                ],
              ),
            ),
          ),

          // Neon progress edge, filling to the reached stage.
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _ProgressEdge(
              fraction: reachedStage / (_HeroBannerLabels.count - 1),
            ),
          ),
        ],
      ),
    );
  }

  Widget _stageLabels() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 2),
      child: Row(
        children: [
          for (var i = 0; i < _HeroBannerLabels.labels.length; i++)
            Expanded(
              child: Text(
                _HeroBannerLabels.labels[i],
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: i == reachedStage
                      ? FontWeight.w700
                      : FontWeight.w600,
                  color: i == reachedStage
                      ? AppColors.primaryDark
                      : AppColors.grey,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _actions(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
      child: Row(
        children: [
          Expanded(
            child: _BannerButton(
              label: 'See Details',
              filled: false,
              onTap: () => _openDetails(context),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _BannerButton(
              label: 'More Choices',
              filled: true,
              trailing: Icons.keyboard_arrow_down_rounded,
              onTap: () => _showMoreChoices(context),
            ),
          ),
        ],
      ),
    );
  }

  void _showMoreChoices(BuildContext context) {
    final offerId = conversation.offerId;
    final isServices = (post.category?['slug'] as String?) == 'services';
    final otherName = _other.firstName.isNotEmpty ? _other.firstName : 'user';

    final items = <_ChoiceItem>[
      if (offerId != null)
        _ChoiceItem(
          icon: Icons.receipt_long_outlined,
          label: 'View Offer',
          onTap: () => context.push('/offers/$offerId'),
        ),
      // Offer negotiation happens on the offer screen, where the role-correct
      // Counter / Decline / Withdraw controls live.
      if (offerId != null)
        _ChoiceItem(
          icon: Icons.swap_horiz_rounded,
          label: 'Counter Offer',
          onTap: () => context.push('/offers/$offerId'),
        ),
      if (offerId != null)
        _ChoiceItem(
          icon: _isBuyer ? Icons.cancel_outlined : Icons.undo_rounded,
          label: _isBuyer ? 'Decline Offer' : 'Withdraw Offer',
          onTap: () => context.push('/offers/$offerId'),
        ),
      // Profile access, symmetric with the seller's "View Buyer Profile".
      if (_isBuyer)
        _ChoiceItem(
          icon: Icons.person_outline_rounded,
          label: 'View Seller Profile',
          onTap: () => context.push('/users/${_other.id}'),
        ),
      // Buyer→seller relationship action, Services only. The seller's mirror is
      // viewing the buyer's profile.
      if (_isBuyer && isServices)
        _ChoiceItem(
          icon: Icons.bookmark_outline_rounded,
          label: 'Save Seller',
          onTap: () => context.push('/users/${_other.id}'),
        ),
      if (!_isBuyer)
        _ChoiceItem(
          icon: Icons.person_outline_rounded,
          label: 'View Buyer Profile',
          onTap: () => context.push('/users/${_other.id}'),
        ),
      _ChoiceItem(
        icon: Icons.flag_outlined,
        label: 'Report ${_isBuyer ? 'Seller' : 'Buyer'}',
        danger: true,
        onTap: () => context.push('/users/${_other.id}'),
      ),
    ];

    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetContext) => _MoreChoicesSheet(
        title: post.title,
        subtitle: otherName,
        items: items,
      ),
    );
  }
}

/// Shared label constants (kept out of the widget so both the labels row and the
/// progress fraction agree on the stage count).
class _HeroBannerLabels {
  static const labels = ChatPostBanner._stages;
  static int get count => labels.length;
}

class _ProgressEdge extends StatelessWidget {
  final double fraction;
  const _ProgressEdge({required this.fraction});

  @override
  Widget build(BuildContext context) {
    final noAnim = MediaQuery.maybeOf(context)?.disableAnimations ?? false;
    return Container(
      height: 5,
      color: Colors.white.withValues(alpha: 0.28),
      alignment: Alignment.centerLeft,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: noAnim ? fraction : 0, end: fraction),
        duration: const Duration(milliseconds: 900),
        curve: Curves.easeOutCubic,
        builder: (context, value, _) => FractionallySizedBox(
          widthFactor: value.clamp(0.0, 1.0),
          child: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFFC084FC), AppColors.primary],
              ),
              boxShadow: [BoxShadow(color: Color(0xCCA855F7), blurRadius: 12)],
            ),
          ),
        ),
      ),
    );
  }
}

class _BannerButton extends StatelessWidget {
  final String label;
  final bool filled;
  final IconData? trailing;
  final VoidCallback onTap;

  const _BannerButton({
    required this.label,
    required this.filled,
    required this.onTap,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(13),
        child: Ink(
          padding: const EdgeInsets.symmetric(vertical: 11),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(13),
            gradient: filled ? AppColors.primaryGradient : null,
            color: filled ? null : AppColors.primary.withValues(alpha: 0.09),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: filled ? Colors.white : AppColors.primary,
                ),
              ),
              if (trailing != null)
                Icon(trailing, size: 16, color: Colors.white),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChoiceItem {
  final IconData icon;
  final String label;
  final bool danger;
  final VoidCallback onTap;

  _ChoiceItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.danger = false,
  });
}

class _MoreChoicesSheet extends StatelessWidget {
  final String title;
  final String subtitle;
  final List<_ChoiceItem> items;

  const _MoreChoicesSheet({
    required this.title,
    required this.subtitle,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(10, 10, 10, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
                      child: Column(
                        children: [
                          Text(
                            title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.black,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Choose an action',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                    for (final item in items)
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Divider(
                            height: 1,
                            color: AppColors.border.withValues(alpha: 0.6),
                          ),
                          InkWell(
                            onTap: () {
                              Navigator.of(context).pop();
                              item.onTap();
                            },
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 15,
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    item.icon,
                                    size: 22,
                                    color: item.danger
                                        ? AppColors.error
                                        : AppColors.primary,
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    item.label,
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: item.danger
                                          ? AppColors.error
                                          : AppColors.black,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: Material(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () => Navigator.of(context).pop(),
                    child: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 15),
                      child: Text(
                        'Cancel',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
