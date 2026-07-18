import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../../categories/providers/category_provider.dart';
import '../../providers/seller_provider.dart';

class SellerProfileScreen extends ConsumerStatefulWidget {
  const SellerProfileScreen({super.key});

  @override
  ConsumerState<SellerProfileScreen> createState() =>
      _SellerProfileScreenState();
}

class _SellerProfileScreenState extends ConsumerState<SellerProfileScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final notifier = ref.read(sellerProfileProvider.notifier);
      notifier.loadProfile();
      notifier.loadStripeStatus();
      notifier.loadVerificationRequests();
      notifier.loadCategoryRequests();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(sellerProfileProvider);
    final profile = state.profile;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Seller Profile',
        onBack: () => Navigator.of(context).pop(),
        actions: [
          if (profile != null)
            GestureDetector(
              onTap: () => context.push('/seller/profile/edit'),
              child: Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border, width: 1.5),
                ),
                child:
                    const Icon(Icons.edit, size: 16, color: AppColors.black),
              ),
            ),
        ],
      ),
      body: state.isLoading && profile == null
          ? const Center(child: CircularProgressIndicator())
          : profile == null
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: () async {
                    final notifier =
                        ref.read(sellerProfileProvider.notifier);
                    await notifier.loadProfile();
                    await notifier.loadCategoryRequests();
                  },
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      children: [
                        const SizedBox(height: 8),

                        // Profile hero
                        _buildProfileHero(profile),
                        const SizedBox(height: 16),

                        // Profile strength
                        _buildProfileStrength(profile),
                        const SizedBox(height: 12),

                        // Stats row
                        _buildStatsRow(profile),
                        const SizedBox(height: 12),

                        // Verification badges
                        _buildVerification(profile),
                        const SizedBox(height: 12),

                        // Category access (#338)
                        _buildCategoryAccess(state),
                        const SizedBox(height: 12),

                        // Stripe status
                        _buildPaymentStatus(profile, state),
                        const SizedBox(height: 12),

                        // Details
                        _buildDetails(profile),
                        const SizedBox(height: 12),

                        // Manage verification (dedicated action)
                        _buildManageVerification(),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
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
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.primaryGradient,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.35),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child:
                  const Icon(Icons.storefront, size: 36, color: Colors.white),
            ),
            const SizedBox(height: 24),
            const Text(
              'No seller profile yet',
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.black),
            ),
            const SizedBox(height: 8),
            const Text(
              'Set up your profile to start selling',
              style: TextStyle(color: AppColors.grey, fontSize: 14),
            ),
            const SizedBox(height: 24),
            GradientButton(
              text: 'Set Up Profile',
              onPressed: () => context.push('/seller/profile/setup'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHero(dynamic profile) {
    return Column(
      children: [
        // Avatar
        Container(
          width: 96,
          height: 96,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppColors.primaryGradient,
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.35),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
            image: profile.profilePhotoUrl != null
                ? DecorationImage(
                    image: NetworkImage(profile.profilePhotoUrl!),
                    fit: BoxFit.cover,
                  )
                : null,
          ),
          child: profile.profilePhotoUrl == null
              ? const Icon(Icons.storefront, size: 40, color: Colors.white)
              : null,
        ),
        const SizedBox(height: 14),

        Text(
          profile.businessName ?? 'My Business',
          style: const TextStyle(
            fontSize: 21,
            fontWeight: FontWeight.w700,
            color: AppColors.black,
            letterSpacing: -0.21,
          ),
        ),

        if (profile.bio != null) ...[
          const SizedBox(height: 6),
          Text(
            profile.bio!,
            style: const TextStyle(fontSize: 13, color: AppColors.grey),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],

        if (profile.formattedBadge.isNotEmpty) ...[
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              profile.formattedBadge,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildProfileStrength(dynamic profile) {
    final int strength = profile.profileStrength;
    final double fraction = (strength.clamp(0, 100)) / 100;
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(icon: Icons.bar_chart, title: 'Profile Strength'),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LayoutBuilder(
                  builder: (context, constraints) => Container(
                    height: 6,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(3),
                    ),
                    alignment: Alignment.centerLeft,
                    child: Container(
                      height: 6,
                      width: constraints.maxWidth * fraction,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppColors.primary, AppColors.secondaryPurple],
                        ),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '$strength% Complete',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow(dynamic profile) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            icon: Icons.star,
            iconColor: AppColors.warning,
            value: profile.ratingDisplay,
            label: 'Rating',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatCard(
            icon: Icons.check_circle,
            iconColor: AppColors.success,
            value: '${profile.totalCompleted}',
            label: 'Completed',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatCard(
            icon: Icons.rate_review,
            iconColor: AppColors.info,
            value: '${profile.totalReviews}',
            label: 'Reviews',
          ),
        ),
      ],
    );
  }

  Widget _buildVerification(dynamic profile) {
    final badges = <({String label, bool verified})>[
      (label: 'Email', verified: profile.emailVerified),
      (label: 'ID', verified: profile.idVerified),
      (label: 'License', verified: profile.licenseVerified),
      (label: 'Insurance', verified: profile.insuranceVerified),
      (label: 'Background', verified: profile.backgroundCheckVerified),
    ];
    return SectionCard(
      child: Column(
        children: [
          const SectionHeader(
            icon: Icons.verified_user,
            title: 'Verification',
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: _verificationGrid(badges),
          ),
        ],
      ),
    );
  }

  /// Lays the verification badges out in a 3-column grid of circular icon
  /// tiles (matches the Figma seller-profile design; replaces the old pill
  /// chips). Rows short of 3 are padded with empty cells to keep alignment.
  Widget _verificationGrid(List<({String label, bool verified})> badges) {
    final rows = <Widget>[];
    for (var i = 0; i < badges.length; i += 3) {
      final end = (i + 3 <= badges.length) ? i + 3 : badges.length;
      final chunk = badges.sublist(i, end);
      final cells = <Widget>[];
      for (var j = 0; j < 3; j++) {
        cells.add(Expanded(
          child: j < chunk.length
              ? _VerTile(label: chunk[j].label, verified: chunk[j].verified)
              : const SizedBox(),
        ));
        if (j < 2) cells.add(const SizedBox(width: 10));
      }
      rows.add(Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: cells,
      ));
      if (end < badges.length) rows.add(const SizedBox(height: 10));
    }
    return Column(children: rows);
  }

  Widget _buildManageVerification() {
    return GestureDetector(
      onTap: () => context.push('/seller/verification'),
      child: Container(
        width: double.infinity,
        height: 52,
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.primary, width: 2),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.verified_user, size: 16, color: AppColors.primary),
            SizedBox(width: 8),
            Text(
              'Manage Verification',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryAccess(SellerProfileState state) {
    final treeAsync = ref.watch(categoryTreeProvider);
    final tree = treeAsync.asData?.value;

    String majorName(String id) {
      if (tree == null) return 'Category';
      for (final n in tree) {
        if (n.id == id) return n.name;
      }
      return 'Category';
    }

    // Resolve subcategory UUIDs to their names (e.g. "Plumbing, Electrical")
    // so the row names what was selected instead of a bare count. Falls back to
    // a count string while the tree is still loading or a name can't resolve.
    String? subLabel(List<String> ids) {
      if (ids.isEmpty) return null;
      if (tree != null) {
        final names = <String>[];
        for (final id in ids) {
          for (final major in tree) {
            final match = major.children.where((c) => c.id == id);
            if (match.isNotEmpty) {
              names.add(match.first.name);
              break;
            }
          }
        }
        if (names.isNotEmpty) return names.join(', ');
      }
      return '${ids.length} subcategor${ids.length == 1 ? 'y' : 'ies'}';
    }

    final requests = state.categoryRequests;

    return SectionCard(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: const Icon(Icons.category,
                      size: 15, color: AppColors.primary),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    'Seller categories',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: AppColors.black,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () => context.push('/seller/profile/add-category'),
                  child: const Text(
                    '+ Add',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                const _CategoryAccessRow(
                  label: 'Products',
                  state: _CatAccessState.active,
                ),
                for (final r in requests)
                  _CategoryAccessRow(
                    label: majorName(r.majorCategoryId),
                    state: r.isApproved
                        ? _CatAccessState.active
                        : r.isRejected
                            ? _CatAccessState.rejected
                            : _CatAccessState.pending,
                    subtitle: subLabel(r.subcategoryIds),
                    reason: r.isRejected ? r.decisionReason : null,
                    onResubmit: r.canResubmit
                        ? () =>
                            context.push('/seller/profile/add-category')
                        : null,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentStatus(dynamic profile, dynamic state) {
    final isConnected = profile.canAcceptPaidOffers;

    return SectionCard(
      child: Column(
        children: [
          SectionHeader(
            icon: Icons.credit_card,
            title: 'Payment',
            accent: isConnected ? 'Connected' : 'Setup Required',
            iconColor: isConnected ? AppColors.success : AppColors.primary,
            iconBackground: isConnected
                ? AppColors.success.withValues(alpha: 0.08)
                : null,
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            child: isConnected
                ? Row(
                    children: [
                      Container(
                        width: 20,
                        height: 20,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.success,
                        ),
                        child: const Icon(Icons.check,
                            size: 12, color: Colors.white),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Payment account connected',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.success,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  )
                : GestureDetector(
                    onTap: () => context.push('/seller/payouts/setup'),
                    child: Container(
                      width: double.infinity,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.06),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.primary.withValues(alpha: 0.2),
                        ),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.open_in_new,
                              size: 14, color: AppColors.primary),
                          SizedBox(width: 6),
                          Text(
                            'Set Up Payments',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
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

  Widget _buildDetails(dynamic profile) {
    return SectionCard(
      child: Column(
        children: [
          const SectionHeader(icon: Icons.info_outline, title: 'Details'),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _DetailRow(
                    'Service Radius', '${profile.serviceRadiusMiles} miles'),
                if (profile.yearsExperience != null)
                  _DetailRow(
                      'Experience', '${profile.yearsExperience} years'),
                if (profile.businessWebsite != null)
                  _DetailRow('Website', profile.businessWebsite!),
                _DetailRow(
                    'Active Offers', '${profile.totalActiveOffers}'),
                if (profile.acceptanceRate != null)
                  _DetailRow('Acceptance Rate',
                      '${profile.acceptanceRate!.toStringAsFixed(0)}%'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String value;
  final String label;

  const _StatCard({
    required this.icon,
    required this.iconColor,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(icon, size: 14, color: iconColor),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppColors.black,
            ),
          ),
          Text(
            label,
            style:
                const TextStyle(fontSize: 11, color: AppColors.greyMedium),
          ),
        ],
      ),
    );
  }
}

/// A single verification badge rendered as a circular icon tile with the label
/// beneath it (Figma seller-profile design). Verified = green check in a green
/// tint; unverified = grey dash in a neutral tint.
class _VerTile extends StatelessWidget {
  final String label;
  final bool verified;

  const _VerTile({required this.label, required this.verified});

  static const Color _verifiedGreen = Color(0xFF059669);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: verified
                  ? AppColors.success.withValues(alpha: 0.1)
                  : AppColors.greyLight,
            ),
            child: Icon(
              verified ? Icons.check : Icons.remove,
              size: 18,
              color: verified ? _verifiedGreen : AppColors.greyMedium,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: verified ? _verifiedGreen : AppColors.greyMedium,
            ),
          ),
        ],
      ),
    );
  }
}

enum _CatAccessState { active, pending, rejected }

class _CategoryAccessRow extends StatelessWidget {
  final String label;
  final _CatAccessState state;
  final String? subtitle;
  final String? reason;
  final VoidCallback? onResubmit;

  const _CategoryAccessRow({
    required this.label,
    required this.state,
    this.subtitle,
    this.reason,
    this.onResubmit,
  });

  @override
  Widget build(BuildContext context) {
    final (chipText, chipColor) = switch (state) {
      _CatAccessState.active => ('Active', AppColors.success),
      _CatAccessState.pending => ('Pending review', AppColors.warning),
      _CatAccessState.rejected => ('Rejected', AppColors.error),
    };

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.black,
                      ),
                    ),
                    if (subtitle != null && subtitle!.isNotEmpty)
                      Text(
                        subtitle!,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.greyMedium,
                        ),
                      ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: chipColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border:
                      Border.all(color: chipColor.withValues(alpha: 0.25)),
                ),
                child: Text(
                  chipText,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: chipColor,
                  ),
                ),
              ),
            ],
          ),
          if (reason != null && reason!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                reason!,
                style: const TextStyle(fontSize: 12, color: AppColors.error),
              ),
            ),
          if (onResubmit != null)
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton(
                onPressed: onResubmit,
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: const Size(0, 32),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text(
                  'Resubmit',
                  style: TextStyle(
                    fontSize: 12,
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
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow(this.label, this.value);

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
                  fontWeight: FontWeight.w500,
                  color: AppColors.black)),
        ],
      ),
    );
  }
}
