import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/confirmation_dialog.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../../../shared/widgets/payment_processor_banner.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../payments/data/repositories/payment_repository.dart';
import '../../../payments/providers/payment_provider.dart';
import '../../providers/offer_provider.dart';
import '../widgets/accept_offer_modal.dart';
import '../widgets/counter_offer_modal.dart';

class OfferDetailScreen extends ConsumerStatefulWidget {
  final String offerId;

  const OfferDetailScreen({super.key, required this.offerId});

  @override
  ConsumerState<OfferDetailScreen> createState() =>
      _OfferDetailScreenState();
}

class _OfferDetailScreenState extends ConsumerState<OfferDetailScreen> {
  bool _isAccepting = false;

  @override
  Widget build(BuildContext context) {
    final offerAsync = ref.watch(offerDetailProvider(widget.offerId));

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Offer Details',
        onBack: () => Navigator.of(context).pop(),
      ),
      body: offerAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.error.withValues(alpha: 0.1),
                ),
                child: const Icon(Icons.error_outline,
                    size: 24, color: AppColors.error),
              ),
              const SizedBox(height: 16),
              const Text('Failed to load offer',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.black)),
              const SizedBox(height: 12),
              GestureDetector(
                onTap: () =>
                    ref.invalidate(offerDetailProvider(widget.offerId)),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 20, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('Retry',
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary)),
                ),
              ),
            ],
          ),
        ),
        data: (offer) {
          // Whose view is this? The offer owner (seller) sees a seller-oriented
          // screen (earnings, withdraw); the post buyer sees accept/counter/
          // decline. seller.userId is the offer owner's User id (#296).
          final currentUserId = ref.watch(authProvider).user?.id;
          final isSeller = currentUserId != null &&
              offer.seller?.userId == currentUserId;

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      const SizedBox(height: 8),

                      // Status banner
                      _buildStatusBanner(offer.status),
                      const SizedBox(height: 16),

                      // Seller hero section
                      _buildSellerHero(offer),
                      const SizedBox(height: 16),

                      // Quote card (buyer: total to pay; seller: net earnings)
                      _buildQuoteCard(offer, isSeller),
                      const SizedBox(height: 16),

                      // Timeline
                      if (offer.completionTime != null)
                        _buildInfoCard(
                          icon: Icons.schedule,
                          title: 'Timeline',
                          content: offer.completionTime!,
                        ),
                      if (offer.completionTime != null)
                        const SizedBox(height: 16),

                      // Offer message
                      if (offer.message.isNotEmpty)
                        _buildMessageSection(offer.message, isSeller),

                      // Offer photos
                      if (offer.photoUrls.isNotEmpty) ...[
                        if (offer.message.isNotEmpty)
                          const SizedBox(height: 16),
                        _buildPhotosSection(offer.photoUrls, isSeller),
                      ],

                      // Escrow notice
                      if (offer.isPending) ...[
                        const SizedBox(height: 16),
                        _buildEscrowNotice(),
                      ],

                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),

              // Action buttons — buyer gets accept/counter/decline on a pending
              // offer; seller gets withdraw (pending) or start-work (accepted).
              if (isSeller)
                _buildSellerActionBar(offer)
              else if (offer.isPending)
                _buildActionBar(offer),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStatusBanner(String status) {
    if (status == 'pending') {
      return _StatusPill(
        dotColor: AppColors.warning,
        label: 'Pending Review',
        bgColor: AppColors.warning.withValues(alpha: 0.08),
        borderColor: AppColors.warning.withValues(alpha: 0.25),
        textColor: AppColors.warning,
      );
    } else if (status == 'accepted') {
      return _StatusPill(
        dotColor: AppColors.success,
        label: 'Accepted',
        bgColor: AppColors.success.withValues(alpha: 0.08),
        borderColor: AppColors.success.withValues(alpha: 0.25),
        textColor: AppColors.success,
      );
    } else if (status == 'declined' || status == 'withdrawn') {
      return _StatusPill(
        dotColor: AppColors.error,
        label: 'Declined',
        bgColor: AppColors.error.withValues(alpha: 0.08),
        borderColor: AppColors.error.withValues(alpha: 0.25),
        textColor: AppColors.error,
      );
    } else if (status == 'counter_offered') {
      return _StatusPill(
        dotColor: AppColors.info,
        label: 'Counter Sent',
        bgColor: AppColors.info.withValues(alpha: 0.08),
        borderColor: AppColors.info.withValues(alpha: 0.25),
        textColor: AppColors.info,
      );
    } else if (status == 'needs_reconfirmation') {
      return _StatusPill(
        dotColor: AppColors.warning,
        label: 'Action Needed',
        bgColor: AppColors.warning.withValues(alpha: 0.08),
        borderColor: AppColors.warning.withValues(alpha: 0.25),
        textColor: AppColors.warning,
      );
    } else if (status == 'expired') {
      return _StatusPill(
        dotColor: AppColors.greyMedium,
        label: 'Expired',
        bgColor: AppColors.greyMedium.withValues(alpha: 0.08),
        borderColor: AppColors.greyMedium.withValues(alpha: 0.25),
        textColor: AppColors.greyMedium,
      );
    }
    return const SizedBox.shrink();
  }

  Widget _buildSellerHero(dynamic offer) {
    return Container(
      width: double.infinity,
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
      child: Column(
        children: [
          // Avatar + name
          Row(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  gradient: AppColors.primaryGradient,
                  image: offer.seller?.profilePhotoUrl != null
                      ? DecorationImage(
                          image: NetworkImage(offer.seller!.profilePhotoUrl!),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: offer.seller?.profilePhotoUrl == null
                    ? Center(
                        child: Text(
                          offer.sellerName[0].toUpperCase(),
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            offer.sellerName,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppColors.black,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          width: 18,
                          height: 18,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              colors: [Color(0xFF7C3AED), Color(0xFFA855F7)],
                            ),
                          ),
                          child: const Icon(Icons.check,
                              size: 10, color: Colors.white),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    if (offer.sellerRating != null)
                      Row(
                        children: [
                          ...List.generate(5, (i) {
                            return Icon(
                              i < offer.sellerRating!.round()
                                  ? Icons.star
                                  : Icons.star_border,
                              size: 14,
                              color: const Color(0xFFF59E0B),
                            );
                          }),
                          const SizedBox(width: 5),
                          Text(
                            offer.sellerRating!.toStringAsFixed(1),
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.black,
                            ),
                          ),
                          Text(
                            ' (${offer.sellerReviewCount} reviews)',
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
            ],
          ),
          const SizedBox(height: 14),

          // Stats row
          Row(
            children: [
              _StatItem(
                label: 'Jobs Done',
                value: '${offer.seller?.totalCompleted ?? 0}',
              ),
              _StatDivider(),
              _StatItem(
                label: 'Reviews',
                value: '${offer.sellerReviewCount}',
              ),
              _StatDivider(),
              _StatItem(
                label: 'Rating',
                value: offer.sellerRating?.toStringAsFixed(1) ?? 'N/A',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuoteCard(dynamic offer, bool isSeller) {
    // Seller sees their net earnings (quote − 8% commission); buyer sees the
    // total they pay (quote + 5% service fee).
    // Buyer pays a 5% service fee on top of the quote. NOTE: offer.platformFee
    // is the platform's *total* take (buyer fee + seller commission), not the
    // buyer's 5% — using it here over-charged the displayed total.
    final commission = offer.quoteAmount * 0.08;
    final earnings = offer.quoteAmount - commission;
    final buyerFee = offer.quoteAmount * 0.05;
    final total = offer.quoteAmount + buyerFee;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary.withValues(alpha: 0.06),
            AppColors.secondaryPurple.withValues(alpha: 0.04),
          ],
        ),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.15),
          width: 1.5,
        ),
      ),
      child: Column(
        children: [
          // Amount
          Text(
            formatCurrency(offer.quoteAmount),
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: AppColors.primary,
              letterSpacing: -0.84,
            ),
          ),
          const SizedBox(height: 8),

          // Fee breakdown
          _QuoteRow(
            label: isSeller ? 'Your quote' : 'Offer price',
            value: formatCurrency(offer.quoteAmount),
            dotColor: AppColors.primary,
          ),
          const SizedBox(height: 8),
          _QuoteRow(
            label: isSeller ? 'Platform fee (8%)' : 'Buyer service fee (5%)',
            value: isSeller
                ? '-${formatCurrency(commission)}'
                : '+${formatCurrency(buyerFee)}',
            dotColor: AppColors.secondaryPurple,
          ),
          const SizedBox(height: 10),
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                isSeller ? 'You earn' : 'Total you pay',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.black,
                ),
              ),
              Text(
                formatCurrency(isSeller ? earnings : total),
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: AppColors.black,
                  letterSpacing: -0.6,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required String title,
    required String content,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.greyMedium,
                  ),
                ),
                Text(
                  content,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.black,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageSection(String message, bool isSeller) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.subtleBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.chat_bubble_outline,
                  size: 14, color: AppColors.grey),
              const SizedBox(width: 6),
              Text(
                isSeller ? 'Your Message' : 'Seller Message',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.grey,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            message,
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.black,
              height: 1.55,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPhotosSection(List<String> urls, bool isSeller) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.subtleBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.photo_library_outlined,
                  size: 14, color: AppColors.grey),
              const SizedBox(width: 6),
              Text(
                isSeller ? 'Your Photos' : 'Seller Photos',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.grey,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 96,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: urls.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final url = urls[index];
                return GestureDetector(
                  onTap: () => _openPhotoViewer(url),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      url,
                      width: 96,
                      height: 96,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => Container(
                        width: 96,
                        height: 96,
                        color: AppColors.greyLight,
                        child: const Icon(Icons.broken_image,
                            size: 28, color: AppColors.greyMedium),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _openPhotoViewer(String url) {
    showDialog<void>(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.9),
      builder: (ctx) => GestureDetector(
        onTap: () => Navigator.pop(ctx),
        child: InteractiveViewer(
          child: Center(
            child: Image.network(
              url,
              fit: BoxFit.contain,
              errorBuilder: (_, _, _) => const Icon(Icons.broken_image,
                  size: 64, color: Colors.white54),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEscrowNotice() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.lock_outline, size: 13, color: AppColors.success),
        const SizedBox(width: 6),
        const Text(
          'Funds held in escrow \u2014 released when work is complete',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: Color(0xFF059669),
          ),
        ),
      ],
    );
  }

  Widget _buildActionBar(dynamic offer) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 32),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Colors.black.withValues(alpha: 0.06)),
        ),
      ),
      child: Column(
        children: [
          GradientButton(
            text: 'Accept Offer',
            onPressed: _isAccepting ? null : _acceptOffer,
            isLoading: _isAccepting,
            height: 54,
            borderRadius: 20,
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _SecondaryButton(
                  label: 'Counter',
                  color: AppColors.primary,
                  icon: Icons.swap_horiz,
                  onTap: () => _showCounterModal(offer),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _SecondaryButton(
                  label: 'Decline',
                  color: AppColors.error,
                  icon: Icons.close,
                  onTap: () => _declineOffer(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () {
              // Navigate to chat with seller
            },
            child: const Text(
              'Message Seller',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSellerActionBar(dynamic offer) {
    // Terminal states (declined/withdrawn/expired) need no seller actions here —
    // a declined offer is resubmitted from the post detail screen.
    if (!offer.isPending && !offer.isAccepted) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 32),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Colors.black.withValues(alpha: 0.06)),
        ),
      ),
      child: Column(
        children: [
          if (offer.isAccepted)
            GradientButton(
              text: 'Start Work',
              icon: Icons.play_arrow_rounded,
              onPressed: () => context.go('/transactions'),
              height: 54,
              borderRadius: 20,
            )
          else
            _SecondaryButton(
              label: 'Withdraw Offer',
              color: AppColors.error,
              icon: Icons.close,
              onTap: _withdrawOffer,
            ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () {
              // Messaging the buyer is wired with the messaging thread (#303).
            },
            child: const Text(
              'Message Buyer',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _withdrawOffer() async {
    final confirmed = await showConfirmationDialog(
      context,
      title: 'Withdraw Offer',
      message: 'Are you sure you want to withdraw this offer?',
      confirmLabel: 'Withdraw',
      isDestructive: true,
    );
    if (!confirmed || !mounted) return;

    try {
      await ref
          .read(myOffersProvider.notifier)
          .withdrawOffer(widget.offerId);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to withdraw offer')),
        );
      }
    }
  }

  Future<void> _acceptOffer() async {
    // Get the current offer data for the confirmation modal
    final offerState = ref.read(offerDetailProvider(widget.offerId));
    final offer = offerState.valueOrNull;
    if (offer == null) return;

    // Show the accept offer modal with fee breakdown
    bool confirmed = false;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AcceptOfferModal(
        offer: offer,
        onConfirm: () {
          confirmed = true;
          Navigator.pop(context);
        },
      ),
    );
    if (!confirmed || !mounted) return;

    setState(() => _isAccepting = true);
    // Hoisted so the degrade-exception handler can navigate to the (already
    // created) transaction even though Step 2 failed.
    String? acceptedTransactionId;
    try {
      // Step 1: Accept offer on backend (creates transaction)
      final result = await ref
          .read(offersProvider.notifier)
          .acceptOffer(widget.offerId);
      acceptedTransactionId = result.transactionId;

      final transactionType =
          result.transaction['transactionType'] as String? ?? '';

      // Step 2: Create payment intent and show the payment sheet (skip for cash)
      if (transactionType != 'product_local_cash') {
        final paymentRepo = ref.read(paymentRepositoryProvider);
        final paymentResult =
            await paymentRepo.createPaymentIntent(result.transactionId);

        await Stripe.instance.initPaymentSheet(
          paymentSheetParameters: SetupPaymentSheetParameters(
            paymentIntentClientSecret: paymentResult.clientSecret,
            merchantDisplayName: 'Sorcyn',
          ),
        );
        await Stripe.instance.presentPaymentSheet();
      }

      // Step 3: Navigate to transaction
      if (mounted) {
        context.go('/transactions/${result.transactionId}');
      }
    } on PaymentProcessorUnavailableException catch (e) {
      // Payment-processor outage (RUNBOOK_OPS.md §2). The offer is already saved
      // on the backend. queued → payment deferred, show the transaction.
      // blocked (high-value) → payment paused, stay put and tell the user to retry.
      if (mounted) {
        setState(() => _isAccepting = false);
        showPaymentProcessorBanner(context, e.message, queued: e.queued);
        if (e.queued && acceptedTransactionId != null) {
          context.go('/transactions/$acceptedTransactionId');
        }
      }
    } on StripeException catch (e) {
      // User cancelled the payment sheet
      if (mounted) {
        setState(() => _isAccepting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              e.error.localizedMessage ?? 'Payment cancelled',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isAccepting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to accept offer')),
        );
      }
    }
  }

  Future<void> _declineOffer() async {
    final confirmed = await showConfirmationDialog(
      context,
      title: 'Decline Offer',
      message: 'Are you sure you want to decline this offer?',
      confirmLabel: 'Decline',
      isDestructive: true,
    );
    if (!confirmed || !mounted) return;

    try {
      await ref.read(offersProvider.notifier).declineOffer(widget.offerId);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to decline offer')),
        );
      }
    }
  }

  void _showCounterModal(dynamic offer) async {
    final result = await showCounterOfferModal(
      context,
      sellerName: offer.sellerName,
      originalAmount: offer.quoteAmount,
    );
    if (result == null || !mounted) return;

    try {
      await ref.read(offersProvider.notifier).counterOffer(
        widget.offerId,
        counterAmount: result['amount'] as double,
        counterMessage: result['message'] as String?,
      );
      if (mounted) {
        ref.invalidate(offerDetailProvider(widget.offerId));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Counter offer sent')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to send counter offer')),
        );
      }
    }
  }
}

class _StatusPill extends StatelessWidget {
  final Color dotColor;
  final String label;
  final Color bgColor;
  final Color borderColor;
  final Color textColor;

  const _StatusPill({
    required this.dotColor,
    required this.label,
    required this.bgColor,
    required this.borderColor,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: dotColor,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;

  const _StatItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppColors.black,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.greyMedium,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 28,
      color: AppColors.border,
    );
  }
}

class _QuoteRow extends StatelessWidget {
  final String label;
  final String value;
  final Color dotColor;

  const _QuoteRow({
    required this.label,
    required this.value,
    required this.dotColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 7,
          height: 7,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: dotColor,
          ),
        ),
        const SizedBox(width: 10),
        Text(
          label,
          style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563)),
        ),
        const Spacer(),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.black,
          ),
        ),
      ],
    );
  }
}

class _SecondaryButton extends StatelessWidget {
  final String label;
  final Color color;
  final IconData icon;
  final VoidCallback onTap;

  const _SecondaryButton({
    required this.label,
    required this.color,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.07),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: color.withValues(alpha: 0.2),
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
