import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../../messages/providers/conversations_provider.dart';
import '../../../offers/data/models/offer_model.dart';
import '../../../offers/providers/offer_provider.dart';
import '../../../posts/data/models/post_model.dart';
import '../../../posts/presentation/widgets/post_category_card.dart';
import '../../../posts/providers/post_provider.dart';

class SellerPostDetailScreen extends ConsumerWidget {
  final String postId;

  const SellerPostDetailScreen({super.key, required this.postId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final postAsync = ref.watch(postDetailProvider(postId));

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Request Details',
        onBack: () => Navigator.of(context).pop(),
      ),
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
        data: (post) => Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),

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
                    const SizedBox(height: 16),

                    // Post title + status
                    Text(
                      post.title,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.black,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Category + urgency row
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.06),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            post.categoryName.isNotEmpty
                                ? post.categoryName
                                : 'General',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                        if (post.urgency != null) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color:
                                  AppColors.warning.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              formatUrgency(post.urgency),
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppColors.warning,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Budget card
                    _buildBudgetCard(post),
                    const SizedBox(height: 12),

                    // Buyer info card
                    _buildBuyerCard(post),
                    const SizedBox(height: 12),

                    // Description
                    _buildDescriptionCard(post),
                    const SizedBox(height: 12),

                    // Requirements
                    if (post.requirements.isNotEmpty)
                      _buildRequirementsCard(post),

                    // Competition indicator
                    _buildCompetitionCard(post),
                    const SizedBox(height: 12),

                    // Key info grid
                    _buildInfoGrid(post),

                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),

            // Sticky bottom CTA
            _buildBottomBar(context, ref, post),
          ],
        ),
      ),
    );
  }

  Widget _buildBudgetCard(Post post) {
    return SectionCard(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppColors.primary.withValues(alpha: 0.04),
              AppColors.primary.withValues(alpha: 0.01),
            ],
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(13),
              ),
              child: const Icon(Icons.payments_outlined,
                  size: 22, color: AppColors.primary),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Budget',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.greyMedium,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    formatBudget(
                      budgetMin: post.budgetMin,
                      budgetMax: post.budgetMax,
                      budgetType: post.budgetType,
                    ),
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                      letterSpacing: -0.3,
                    ),
                  ),
                ],
              ),
            ),
            if (post.expiresAt != null)
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  formatExpiry(post.expiresAt),
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppColors.warning,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildBuyerCard(Post post) {
    return SectionCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF3B82F6), Color(0xFF6366F1)],
              ),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF3B82F6).withValues(alpha: 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Center(
              child: Text(
                (post.buyer?.firstName ?? 'B')[0].toUpperCase(),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      post.buyer?.firstName ?? 'Buyer',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.black,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.verified,
                        size: 15, color: AppColors.primary),
                  ],
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    const Icon(Icons.star,
                        size: 12, color: AppColors.warning),
                    const SizedBox(width: 3),
                    const Text(
                      '4.8 · ',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.greyMedium,
                      ),
                    ),
                    Text(
                      'Member since ${post.createdAt.year}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.greyMedium,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () {},
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.07),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.2),
                ),
              ),
              child: const Text(
                'Profile',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDescriptionCard(Post post) {
    return SectionCard(
      child: Column(
        children: [
          const SectionHeader(
            icon: Icons.description_outlined,
            title: 'Description',
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
            child: Text(
              post.description,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.grey,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRequirementsCard(Post post) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: SectionCard(
        child: Column(
          children: [
            const SectionHeader(
              icon: Icons.checklist,
              title: 'Seller Requirements',
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _RequirementBadge(
                    icon: Icons.star,
                    label: 'Min Rating: 4.0',
                    color: AppColors.warning,
                  ),
                  _RequirementBadge(
                    icon: Icons.verified,
                    label: 'Verified Sellers',
                    color: AppColors.primary,
                  ),
                  if (post.requirements.containsKey('licensed'))
                    _RequirementBadge(
                      icon: Icons.badge,
                      label: 'Licensed',
                      color: AppColors.success,
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompetitionCard(Post post) {
    return SectionCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          // Stacked avatars
          SizedBox(
            width: 56,
            height: 28,
            child: Stack(
              children: List.generate(3, (i) {
                return Positioned(
                  left: i * 16.0,
                  child: Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary.withValues(alpha: 0.7 - i * 0.2),
                          AppColors.secondaryPurple
                              .withValues(alpha: 0.7 - i * 0.2),
                        ],
                      ),
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: Center(
                      child: Text(
                        '${i + 1}',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${post.offerCount} sellers have offered',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.black,
                  ),
                ),
                const Text(
                  'Competition level: Medium',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.greyMedium,
                  ),
                ),
              ],
            ),
          ),
          // Heat indicator
          Container(
            width: 6,
            height: 32,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(3),
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [
                  AppColors.success,
                  AppColors.warning,
                  if (post.offerCount > 5) AppColors.error,
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoGrid(Post post) {
    return SectionCard(
      child: Column(
        children: [
          const SectionHeader(
            icon: Icons.info_outline,
            title: 'Details',
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _InfoRow(
                  'Budget',
                  formatBudget(
                    budgetMin: post.budgetMin,
                    budgetMax: post.budgetMax,
                    budgetType: post.budgetType,
                  ),
                ),
                if (post.urgency != null)
                  _InfoRow('Timeline', formatUrgency(post.urgency)),
                if (post.locationCity != null)
                  _InfoRow(
                    'Location',
                    '${post.locationCity}, ${post.locationState ?? ''}',
                  ),
                _InfoRow('Posted', formatRelativeDate(post.createdAt)),
                _InfoRow('Views', '${post.viewCount}'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Opens the buyer↔seller chat thread for this post. The thread is created when
  // the seller submits an offer (#305), so if none exists yet we nudge them to
  // submit one first rather than silently no-op (#303).
  Future<void> _openConversation(
    BuildContext context,
    WidgetRef ref,
    Post post,
  ) async {
    try {
      final convo =
          await ref.read(messageRepositoryProvider).getConversationByPost(post.id);
      if (!context.mounted) return;
      if (convo == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Submit an offer first to start a conversation with the buyer.',
            ),
          ),
        );
        return;
      }
      context.push('/chat/${convo.id}');
    } catch (_) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open the conversation. Try again.')),
      );
    }
  }

  Widget _buildBottomBar(BuildContext context, WidgetRef ref, Post post) {
    // The seller's existing offer (if any) on this post determines the CTA:
    // none/withdrawn → Submit Offer, pending → Pending Offer (view only),
    // accepted → Start Work, declined → Resubmit Offer. This stops the seller
    // from re-opening the form on a post they've already bid on. (#2)
    final myOfferAsync = ref.watch(myOfferForPostProvider(post.id));

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 32),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Colors.black.withValues(alpha: 0.06)),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 1,
            child: GestureDetector(
              onTap: () => _openConversation(context, ref, post),
              child: Container(
                height: 52,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.07),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.2),
                    width: 1.5,
                  ),
                ),
                child: const Center(
                  child: Text(
                    'Message',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 2,
            child: myOfferAsync.when(
              loading: () => GradientButton(
                text: 'Submit Offer',
                icon: Icons.local_offer,
                onPressed: null,
                height: 52,
                borderRadius: 16,
              ),
              error: (_, _) => GradientButton(
                text: 'Submit Offer',
                icon: Icons.local_offer,
                onPressed: () =>
                    context.push('/posts/${post.id}/submit-offer'),
                height: 52,
                borderRadius: 16,
              ),
              data: (offer) =>
                  _buildOfferCta(context, ref, post, offer),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOfferCta(
    BuildContext context,
    WidgetRef ref,
    Post post,
    Offer? offer,
  ) {
    // No live offer (or previously withdrawn) → fresh submission.
    if (offer == null) {
      return GradientButton(
        text: 'Submit Offer',
        icon: Icons.local_offer,
        onPressed: () => context.push('/posts/${post.id}/submit-offer'),
        height: 52,
        borderRadius: 16,
      );
    }

    switch (offer.status) {
      case 'accepted':
        return GradientButton(
          text: 'Start Work',
          icon: Icons.play_arrow_rounded,
          onPressed: () => context.push('/offers/${offer.id}'),
          height: 52,
          borderRadius: 16,
        );
      case 'declined':
        return GradientButton(
          text: 'Resubmit Offer',
          icon: Icons.refresh,
          onPressed: () => context.push('/posts/${post.id}/submit-offer'),
          height: 52,
          borderRadius: 16,
        );
      case 'pending':
      default:
        // Pending (or counter/needs-reconfirmation): view-only, no re-submit.
        return GestureDetector(
          onTap: () => context.push('/offers/${offer.id}'),
          child: Container(
            height: 52,
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B).withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: const Color(0xFFF59E0B).withValues(alpha: 0.30),
                width: 1.5,
              ),
            ),
            child: const Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.hourglass_top,
                      size: 16, color: Color(0xFFD97706)),
                  SizedBox(width: 6),
                  Text(
                    'Pending Offer',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFFD97706),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
    }
  }
}

class _RequirementBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _RequirementBadge({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 12, color: AppColors.greyMedium)),
          Text(value,
              style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.black)),
        ],
      ),
    );
  }
}
