import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../data/models/transaction_model.dart';
import '../../providers/transaction_provider.dart';

class TransactionDetailScreen extends ConsumerStatefulWidget {
  final String transactionId;

  const TransactionDetailScreen({super.key, required this.transactionId});

  @override
  ConsumerState<TransactionDetailScreen> createState() =>
      _TransactionDetailScreenState();
}

class _TransactionDetailScreenState
    extends ConsumerState<TransactionDetailScreen> {
  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    final txAsync =
        ref.watch(transactionDetailProvider(widget.transactionId));

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Transaction',
        onBack: () => Navigator.of(context).pop(),
        actions: [
          GestureDetector(
            onTap: () {},
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
      body: txAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Failed to load transaction'),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => ref.invalidate(
                    transactionDetailProvider(widget.transactionId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (tx) => Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),

                    // Status banner
                    _StatusBanner(status: tx.status),
                    const SizedBox(height: 16),

                    // Counterparty card
                    _buildCounterpartyCard(tx),
                    const SizedBox(height: 12),

                    // Post reference
                    _buildPostReference(tx),
                    const SizedBox(height: 12),

                    // Payment breakdown
                    _buildPaymentCard(tx),
                    const SizedBox(height: 12),

                    // Milestone timeline
                    _buildMilestoneTimeline(tx),
                    const SizedBox(height: 12),

                    // Before/After photos
                    if (tx.beforePhotos.isNotEmpty ||
                        tx.afterPhotos.isNotEmpty)
                      _buildPhotosSection(tx),

                    // Activity log
                    if (tx.timelineEvents.isNotEmpty)
                      _buildActivityLog(tx),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),

            // Action buttons
            if (tx.canApprove || tx.status == 'completed' || tx.canCancel)
              _buildActionBar(tx),
          ],
        ),
      ),
    );
  }

  Widget _buildCounterpartyCard(Transaction tx) {
    return SectionCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Center(
              child: Text(
                tx.sellerName[0].toUpperCase(),
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
                      tx.sellerName,
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
                Builder(
                  builder: (context) {
                    final rating = tx.seller?.averageRating;
                    final reviews = tx.seller?.totalReviews ?? 0;
                    // Empty state: no rating yet or zero reviews (#295). Avoids
                    // showing a fabricated placeholder rating to the buyer.
                    if (rating == null || reviews == 0) {
                      return const Text(
                        'No reviews yet',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.greyMedium,
                        ),
                      );
                    }
                    return Row(
                      children: [
                        const Icon(Icons.star,
                            size: 13, color: AppColors.warning),
                        const SizedBox(width: 3),
                        Text(
                          '${rating.toStringAsFixed(1)} · $reviews '
                          '${reviews == 1 ? 'review' : 'reviews'}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.greyMedium,
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () {},
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.07),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.2),
                ),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.chat_bubble_outline,
                      size: 13, color: AppColors.primary),
                  SizedBox(width: 5),
                  Text(
                    'Message',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
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

  Widget _buildPostReference(Transaction tx) {
    return SectionCard(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.push('/posts/${tx.postId}'),
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.article_outlined,
                      size: 18, color: AppColors.primary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tx.postTitle.isNotEmpty
                            ? tx.postTitle
                            : 'Transaction',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.black,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          formatStatus(tx.transactionType),
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right,
                    size: 18, color: AppColors.greyMedium),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentCard(Transaction tx) {
    return SectionCard(
      child: Column(
        children: [
          const SectionHeader(
            icon: Icons.payments_outlined,
            title: 'Payment Breakdown',
          ),
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.03),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.1),
              ),
            ),
            child: Column(
              children: [
                _PaymentRow(
                  label: 'Offer Amount',
                  value: formatCurrency(tx.quoteAmount),
                ),
                if (tx.buyerFee != null) ...[
                  const SizedBox(height: 8),
                  _PaymentRow(
                    label: 'Platform Fee',
                    value: '+${formatCurrency(tx.buyerFee!)}',
                    color: AppColors.greyMedium,
                  ),
                ],
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Divider(height: 1),
                ),
                _PaymentRow(
                  label: 'Total Paid',
                  value: formatCurrency(tx.buyerTotal),
                  isBold: true,
                ),
                const SizedBox(height: 12),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: (tx.escrowStatus == 'held'
                            ? AppColors.primary
                            : AppColors.success)
                        .withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        tx.escrowStatus == 'held'
                            ? Icons.lock
                            : Icons.lock_open,
                        size: 14,
                        color: tx.escrowStatus == 'held'
                            ? AppColors.primary
                            : AppColors.success,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        tx.escrowStatus == 'held'
                            ? 'Funds held in escrow'
                            : 'Funds released',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: tx.escrowStatus == 'held'
                              ? AppColors.primary
                              : AppColors.success,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMilestoneTimeline(Transaction tx) {
    final milestones = [
      ('Payment', 'payment_held', Icons.payment),
      ('Work Started', 'started', Icons.play_circle),
      ('Before Photos', 'before_photos', Icons.camera_alt),
      ('After Photos', 'after_photos', Icons.photo_library),
      ('Approval', 'awaiting_approval', Icons.thumb_up),
      ('Payout', 'completed', Icons.account_balance),
    ];

    final completedEvents =
        tx.timelineEvents.map((e) => e.event).toSet();
    int currentIndex = 0;
    for (int i = 0; i < milestones.length; i++) {
      if (completedEvents.contains(milestones[i].$2)) {
        currentIndex = i + 1;
      }
    }

    return SectionCard(
      child: Column(
        children: [
          const SectionHeader(
            icon: Icons.timeline,
            title: 'Progress',
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: List.generate(milestones.length, (i) {
                final isCompleted = i < currentIndex;
                final isCurrent = i == currentIndex;
                final isPending = i > currentIndex;
                final isLast = i == milestones.length - 1;

                return _MilestoneStep(
                  label: milestones[i].$1,
                  icon: milestones[i].$3,
                  isCompleted: isCompleted,
                  isCurrent: isCurrent,
                  isPending: isPending,
                  isLast: isLast,
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPhotosSection(Transaction tx) {
    return SectionCard(
      child: Column(
        children: [
          const SectionHeader(
            icon: Icons.photo_library_outlined,
            title: 'Before & After Photos',
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                if (tx.beforePhotos.isNotEmpty)
                  Expanded(
                    child: Column(
                      children: [
                        const Text(
                          'Before',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.greyMedium,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          height: 80,
                          decoration: BoxDecoration(
                            color: AppColors.greyLight,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: const Center(
                            child: Icon(Icons.image,
                                color: AppColors.greyMedium),
                          ),
                        ),
                      ],
                    ),
                  ),
                if (tx.beforePhotos.isNotEmpty && tx.afterPhotos.isNotEmpty)
                  const SizedBox(width: 12),
                if (tx.afterPhotos.isNotEmpty)
                  Expanded(
                    child: Column(
                      children: [
                        const Text(
                          'After',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.greyMedium,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          height: 80,
                          decoration: BoxDecoration(
                            color: AppColors.greyLight,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: const Center(
                            child: Icon(Icons.image,
                                color: AppColors.greyMedium),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityLog(Transaction tx) {
    return SectionCard(
      child: Column(
        children: [
          const SectionHeader(
            icon: Icons.history,
            title: 'Activity',
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            child: Column(
              children: tx.timelineEvents
                  .take(5)
                  .map((event) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Row(
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.primary,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                event.displayEvent,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: AppColors.black,
                                ),
                              ),
                            ),
                            if (event.dateTime != null)
                              Text(
                                formatRelativeDate(event.dateTime!),
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.greyMedium,
                                ),
                              ),
                          ],
                        ),
                      ))
                  .toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionBar(Transaction tx) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 32),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Colors.black.withValues(alpha: 0.06)),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (tx.canApprove) ...[
            GradientButton(
              text: 'Approve & Release Payment',
              icon: Icons.check_circle,
              onPressed: _isProcessing ? null : () => _approve(tx),
              isLoading: _isProcessing,
            ),
            const SizedBox(height: 8),
            if (tx.canRequestChanges)
              GestureDetector(
                onTap: _isProcessing ? null : () => _requestChanges(tx),
                child: Container(
                  width: double.infinity,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.2),
                      width: 1.5,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      'Request Changes (${tx.changeRequestCount}/2)',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ),
              ),
          ],
          if (tx.status == 'completed')
            GradientButton(
              text: 'Leave a Review',
              icon: Icons.rate_review,
              onPressed: () => context.push('/transactions/${tx.id}/review'),
            ),
          if (tx.canCancel && tx.canApprove) const SizedBox(height: 8),
          if (tx.canCancel)
            GestureDetector(
              onTap: _isProcessing ? null : () => _cancel(tx),
              child: Container(
                width: double.infinity,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppColors.error.withValues(alpha: 0.2),
                    width: 1.5,
                  ),
                ),
                child: const Center(
                  child: Text(
                    'Open Dispute',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.error,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _approve(Transaction tx) async {
    final noteController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Approve Transaction'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
                'Release ${formatCurrency(tx.buyerTotal)} to ${tx.sellerName}?'),
            const SizedBox(height: 16),
            TextField(
              controller: noteController,
              decoration: const InputDecoration(
                labelText: 'Note (optional)',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.success),
            child: const Text('Approve'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _isProcessing = true);
    try {
      await ref.read(transactionsProvider.notifier).approveTransaction(
            tx.id,
            note: noteController.text.isNotEmpty ? noteController.text : null,
          );
      ref.invalidate(transactionDetailProvider(widget.transactionId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to approve')),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _requestChanges(Transaction tx) async {
    final reasonController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Request Changes'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('${tx.changeRequestCount} of 2 change requests used.'),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(
                labelText: 'What changes do you need?',
                border: OutlineInputBorder(),
              ),
              maxLines: 4,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Submit'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    if (reasonController.text.length < 20) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Please provide at least 20 characters')),
      );
      return;
    }

    setState(() => _isProcessing = true);
    try {
      await ref.read(transactionsProvider.notifier).requestChanges(
            tx.id,
            reasonController.text,
          );
      ref.invalidate(transactionDetailProvider(widget.transactionId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to request changes')),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _cancel(Transaction tx) async {
    final reasonController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Open Dispute'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Describe the issue. Our support team will review and assist with resolution.',
              style: TextStyle(color: AppColors.grey, fontSize: 13),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(
                labelText: 'Describe the issue',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Submit Dispute'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    if (reasonController.text.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Please provide at least 10 characters')),
      );
      return;
    }

    setState(() => _isProcessing = true);
    try {
      await ref.read(transactionsProvider.notifier).cancelTransaction(
            tx.id,
            reasonController.text,
          );
      ref.invalidate(transactionDetailProvider(widget.transactionId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to submit dispute')),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }
}

class _StatusBanner extends StatelessWidget {
  final String status;

  const _StatusBanner({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = statusColor(status);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(_statusIcon(status), color: color, size: 16),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                formatStatus(status),
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
              Text(
                _statusSubtext(status),
                style: TextStyle(
                  fontSize: 11,
                  color: color.withValues(alpha: 0.8),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  IconData _statusIcon(String status) {
    return switch (status) {
      'in_progress' => Icons.autorenew,
      'awaiting_approval' => Icons.hourglass_top,
      'completed' => Icons.check_circle,
      'cancelled' => Icons.cancel,
      'disputed' => Icons.warning,
      _ => Icons.info,
    };
  }

  String _statusSubtext(String status) {
    return switch (status) {
      'in_progress' => 'Seller is working on your request',
      'awaiting_approval' => 'Review the work and approve',
      'completed' => 'Transaction completed successfully',
      'cancelled' => 'This transaction was cancelled',
      'disputed' => 'Under review by support team',
      _ => '',
    };
  }
}

class _MilestoneStep extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isCompleted;
  final bool isCurrent;
  final bool isPending;
  final bool isLast;

  const _MilestoneStep({
    required this.label,
    required this.icon,
    required this.isCompleted,
    required this.isCurrent,
    required this.isPending,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 28,
            child: Column(
              children: [
                Container(
                  width: isCompleted ? 24 : isCurrent ? 24 : 20,
                  height: isCompleted ? 24 : isCurrent ? 24 : 20,
                  margin: EdgeInsets.only(
                    top: isPending ? 2 : 0,
                    left: isPending ? 2 : 0,
                  ),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: isCompleted ? AppColors.primaryGradient : null,
                    color: isCurrent
                        ? AppColors.primary
                        : isPending
                            ? Colors.white
                            : null,
                    border: isPending
                        ? Border.all(color: AppColors.border, width: 2)
                        : null,
                    boxShadow: isCurrent
                        ? [
                            BoxShadow(
                              color:
                                  AppColors.primary.withValues(alpha: 0.35),
                              blurRadius: 8,
                              spreadRadius: 1,
                            ),
                          ]
                        : null,
                  ),
                  child: isCompleted
                      ? const Icon(Icons.check,
                          size: 13, color: Colors.white)
                      : isCurrent
                          ? Container(
                              margin: const EdgeInsets.all(7),
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white,
                              ),
                            )
                          : null,
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      color: isCompleted
                          ? AppColors.primary.withValues(alpha: 0.3)
                          : AppColors.border,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isCurrent
                      ? FontWeight.w700
                      : isCompleted
                          ? FontWeight.w600
                          : FontWeight.w500,
                  color: isPending ? AppColors.greyMedium : AppColors.black,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PaymentRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;
  final Color? color;

  const _PaymentRow({
    required this.label,
    required this.value,
    this.isBold = false,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: color ?? (isBold ? AppColors.black : AppColors.grey),
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isBold ? 16 : 14,
            fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
            color: isBold ? AppColors.primary : AppColors.black,
          ),
        ),
      ],
    );
  }
}
