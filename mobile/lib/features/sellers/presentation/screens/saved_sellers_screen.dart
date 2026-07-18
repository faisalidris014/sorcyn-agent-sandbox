import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../data/models/saved_seller_model.dart';
import '../../providers/saved_sellers_provider.dart';

class SavedSellersScreen extends ConsumerStatefulWidget {
  const SavedSellersScreen({super.key});

  @override
  ConsumerState<SavedSellersScreen> createState() => _SavedSellersScreenState();
}

class _SavedSellersScreenState extends ConsumerState<SavedSellersScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(savedSellersProvider.notifier).load());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(savedSellersProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Saved Sellers',
        onBack: () => Navigator.of(context).pop(),
      ),
      body: state.isLoading && state.sellers.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : state.sellers.isEmpty
              ? _buildEmpty()
              : RefreshIndicator(
                  onRefresh: () => ref.read(savedSellersProvider.notifier).load(),
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    itemCount: state.sellers.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (context, i) =>
                        _SavedSellerCard(entry: state.sellers[i]),
                  ),
                ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.bookmark_outline,
                  size: 34, color: AppColors.primary),
            ),
            const SizedBox(height: 20),
            Text(
              'No saved sellers yet',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.black,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Tap the Save button on any seller profile to bookmark them here.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.grey,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SavedSellerCard extends ConsumerWidget {
  final SavedSellerEntry entry;

  const _SavedSellerCard({required this.entry});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final seller = entry.seller;
    final notifier = ref.read(savedSellersProvider.notifier);

    return GestureDetector(
      onTap: () => context.push('/users/${seller.user.id}'),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.border, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Avatar
            _Avatar(
              initials: seller.user.initials,
              photoUrl: seller.profilePhotoUrl ?? seller.user.profilePhotoUrl,
            ),
            const SizedBox(width: 14),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    seller.displayName,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.black,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (seller.user.locationLabel != null) ...[
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            size: 12, color: AppColors.greyMedium),
                        const SizedBox(width: 2),
                        Text(
                          seller.user.locationLabel!,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppColors.greyMedium,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      if (seller.rating != null) ...[
                        const Icon(Icons.star,
                            size: 13, color: AppColors.warning),
                        const SizedBox(width: 3),
                        Text(
                          seller.rating!.toStringAsFixed(1),
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.black,
                          ),
                        ),
                        Text(
                          ' · ${seller.totalReviews} reviews',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppColors.greyMedium,
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        '${seller.totalCompleted} done',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppColors.greyMedium,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Unsave button
            GestureDetector(
              onTap: () => notifier.toggleSave(seller.id),
              child: Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.07),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.bookmark,
                    size: 18, color: AppColors.primary),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  final String initials;
  final String? photoUrl;

  const _Avatar({required this.initials, this.photoUrl});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: AppColors.primaryGradient,
        image: photoUrl != null
            ? DecorationImage(
                image: NetworkImage(photoUrl!),
                fit: BoxFit.cover,
              )
            : null,
      ),
      child: photoUrl == null
          ? Center(
              child: Text(
                initials,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            )
          : null,
    );
  }
}
