import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../../sellers/data/repositories/saved_sellers_repository.dart';
import '../../../sellers/providers/saved_sellers_provider.dart';

class PublicProfileScreen extends ConsumerStatefulWidget {
  final String userId;

  const PublicProfileScreen({super.key, required this.userId});

  @override
  ConsumerState<PublicProfileScreen> createState() =>
      _PublicProfileScreenState();
}

class _PublicProfileScreenState extends ConsumerState<PublicProfileScreen> {
  String? _sellerProfileId;
  PublicSellerVerification? _verification;
  bool _resolving = true;

  final _repo = SavedSellersRepository();

  @override
  void initState() {
    super.initState();
    Future.microtask(_resolve);
  }

  Future<void> _resolve() async {
    // Load saved sellers list so isSaved is up-to-date
    ref.read(savedSellersProvider.notifier).load();
    final v = await _repo.getPublicSellerVerification(widget.userId);
    if (mounted) {
      setState(() {
        _verification = v;
        _sellerProfileId = v?.sellerProfileId;
        _resolving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final savedState = ref.watch(savedSellersProvider);
    final isSaved = _sellerProfileId != null && savedState.isSaved(_sellerProfileId!);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Priya Sharma',
        centerTitle: false,
        onBack: () => Navigator.of(context).pop(),
        actions: [
          GestureDetector(
            onTap: _showOverflowMenu,
            child: Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border, width: 1.5),
              ),
              child: const Icon(Icons.more_horiz,
                  size: 18, color: AppColors.black),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  const SizedBox(height: 20),

                  // Avatar
                  Container(
                    width: 96,
                    height: 96,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFFEC4899), Color(0xFFF43F5E)],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color:
                              const Color(0xFFEC4899).withValues(alpha: 0.35),
                          blurRadius: 24,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Text(
                        'PS',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Name
                  const Text(
                    'Priya Sharma',
                    style: TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w700,
                      color: AppColors.black,
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Rating row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ...List.generate(
                        5,
                        (i) => const Padding(
                          padding: EdgeInsets.only(right: 1),
                          child: Icon(Icons.star,
                              size: 14, color: AppColors.warning),
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        '4.8',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.black,
                        ),
                      ),
                      const Text(
                        ' \u00b7 61 reviews',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.greyMedium,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Member since
                  const Text(
                    'Member since January 2023',
                    style: TextStyle(fontSize: 12, color: AppColors.greyMedium),
                  ),
                  const SizedBox(height: 4),

                  // Location
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.location_on_outlined,
                          size: 13, color: AppColors.greyMedium),
                      SizedBox(width: 3),
                      Text(
                        'Dallas, TX',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.greyMedium,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Verification badges — driven by the seller's real
                  // verification state (#381/#245). Each badge shows earned
                  // (green) vs. not-yet (grey); "Insured" reflects a genuine
                  // approved insurance certificate.
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    alignment: WrapAlignment.center,
                    children: [
                      _VerBadge(
                          'ID Verified', _verification?.idVerified ?? false),
                      _VerBadge(
                          'Licensed', _verification?.licenseVerified ?? false),
                      _VerBadge('Background',
                          _verification?.backgroundCheckVerified ?? false),
                      _VerBadge('Insured',
                          _verification?.insuranceVerified ?? false),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Stats row
                  Row(
                    children: const [
                      _StatCard(
                        icon: Icons.star,
                        value: '4.8',
                        label: 'Rating',
                      ),
                      SizedBox(width: 10),
                      _StatCard(
                        icon: Icons.check_circle,
                        value: '124',
                        label: 'Completed',
                      ),
                      SizedBox(width: 10),
                      _StatCard(
                        icon: Icons.schedule,
                        value: '< 1hr',
                        label: 'Response Time',
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // About section
                  SectionCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SectionHeader(
                          icon: Icons.person_outline,
                          title: 'About',
                          iconBackground:
                              AppColors.primary.withValues(alpha: 0.08),
                          iconColor: AppColors.primary,
                        ),
                        const Padding(
                          padding: EdgeInsets.fromLTRB(16, 12, 16, 16),
                          child: Text(
                            'Professional graphic designer with 8+ years of experience in brand identity, logo design, and marketing materials. I specialize in creating polished, modern designs for startups and small businesses.',
                            style: TextStyle(
                              fontSize: 13,
                              color: Color(0xFF374151),
                              height: 1.65,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Reviews section
                  SectionCard(
                    child: Column(
                      children: [
                        const SectionHeader(
                          icon: Icons.star_outline,
                          title: 'Reviews',
                          accent: '61 total',
                        ),
                        const SizedBox(height: 4),
                        _ReviewItem(
                          name: 'Alex J.',
                          initials: 'AJ',
                          gradient: AppColors.primaryGradient,
                          rating: 5,
                          text:
                              'Incredible work! Priya delivered exactly what I envisioned. Very professional.',
                          date: 'Apr 10, 2026',
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16),
                          child: Divider(
                            height: 1,
                            thickness: 1,
                            color: Color(0xFFF6F6F6),
                          ),
                        ),
                        _ReviewItem(
                          name: 'Sarah M.',
                          initials: 'SM',
                          gradient: const LinearGradient(
                            colors: [Color(0xFF2563EB), Color(0xFF3B82F6)],
                          ),
                          rating: 5,
                          text:
                              'Fast turnaround and beautiful results. Would definitely hire again!',
                          date: 'Mar 28, 2026',
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16),
                          child: Divider(
                            height: 1,
                            thickness: 1,
                            color: Color(0xFFF6F6F6),
                          ),
                        ),
                        _ReviewItem(
                          name: 'David K.',
                          initials: 'DK',
                          gradient: const LinearGradient(
                            colors: [Color(0xFF10B981), Color(0xFF34D399)],
                          ),
                          rating: 4,
                          text:
                              'Good communication and quality work. Minor revisions needed but overall great experience.',
                          date: 'Mar 15, 2026',
                        ),
                        const SizedBox(height: 8),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),

          // Sticky bottom actions
          Container(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 34),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(
                top: BorderSide(
                  color: Colors.black.withValues(alpha: 0.06),
                ),
              ),
            ),
            child: Row(
              children: [
                // Message button (flex-2)
                Expanded(
                  flex: 2,
                  child: GradientButton(
                    text: 'Message',
                    icon: Icons.chat_bubble_outline,
                    onPressed: () {},
                    height: 56,
                    borderRadius: 24,
                  ),
                ),
                const SizedBox(width: 10),
                // Save button (flex-1)
                Expanded(
                  flex: 1,
                  child: GestureDetector(
                    onTap: _sellerProfileId == null || _resolving
                        ? null
                        : () => ref
                            .read(savedSellersProvider.notifier)
                            .toggleSave(_sellerProfileId!),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      height: 56,
                      decoration: BoxDecoration(
                        color: isSaved
                            ? AppColors.primary.withValues(alpha: 0.07)
                            : Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: isSaved
                              ? AppColors.primary
                              : AppColors.border,
                          width: 1.5,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            isSaved
                                ? Icons.bookmark
                                : Icons.bookmark_outline,
                            size: 20,
                            color: AppColors.primary,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            isSaved ? 'Saved' : 'Save',
                            style: const TextStyle(
                              fontSize: 14,
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
          ),
        ],
      ),
    );
  }

  void _showOverflowMenu() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.flag_outlined, color: AppColors.grey),
                title: const Text('Report'),
                onTap: () => Navigator.pop(context),
              ),
              ListTile(
                leading: const Icon(Icons.block, color: AppColors.grey),
                title: const Text('Block'),
                onTap: () => Navigator.pop(context),
              ),
              ListTile(
                leading: const Icon(Icons.share_outlined, color: AppColors.grey),
                title: const Text('Share Profile'),
                onTap: () => Navigator.pop(context),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _VerBadge extends StatelessWidget {
  final String label;
  final bool verified;

  const _VerBadge(this.label, this.verified);

  @override
  Widget build(BuildContext context) {
    final bgColor = verified
        ? AppColors.success.withValues(alpha: 0.08)
        : const Color(0xFFF3F4F6);
    final borderColor = verified
        ? AppColors.success.withValues(alpha: 0.25)
        : const Color(0xFFE5E7EB);
    final iconColor = verified ? const Color(0xFF059669) : AppColors.greyMedium;
    final textColor = verified ? const Color(0xFF059669) : AppColors.greyMedium;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            verified ? Icons.check_circle : Icons.circle_outlined,
            size: 12,
            color: iconColor,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;

  const _StatCard({
    required this.icon,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.subtleBorder, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(9),
              ),
              child: Icon(icon, size: 14, color: AppColors.primary),
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppColors.black,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.greyMedium,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _ReviewItem extends StatelessWidget {
  final String name;
  final String initials;
  final Gradient gradient;
  final int rating;
  final String text;
  final String date;

  const _ReviewItem({
    required this.name,
    required this.initials,
    required this.gradient,
    required this.rating,
    required this.text,
    required this.date,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Avatar
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: gradient,
                ),
                child: Center(
                  child: Text(
                    initials,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.black,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        ...List.generate(
                          5,
                          (i) => Icon(
                            i < rating ? Icons.star : Icons.star_border,
                            size: 11,
                            color: AppColors.warning,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          date,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.greyMedium,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Verified Transaction badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.verified, size: 9, color: Color(0xFF059669)),
                    SizedBox(width: 3),
                    Text(
                      'Verified',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF059669),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            text,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.grey,
              height: 1.5,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
