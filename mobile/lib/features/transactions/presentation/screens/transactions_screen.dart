import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../data/models/transaction_model.dart';
import '../../providers/transaction_provider.dart';

class TransactionsScreen extends ConsumerStatefulWidget {
  /// When true this screen is the seller-side "My Jobs" view (loads the
  /// seller's jobs and taps through to the seller transaction-detail screen).
  /// When false it is the buyer-side "Transactions" view. This is an explicit
  /// route choice, NOT derived from the active app mode, so the two entry
  /// points stay independent (#290).
  final bool isSeller;

  const TransactionsScreen({super.key, this.isSeller = false});

  @override
  ConsumerState<TransactionsScreen> createState() =>
      _TransactionsScreenState();
}

class _TransactionsScreenState extends ConsumerState<TransactionsScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      // Load the side this screen was opened for, not the active app mode, so
      // "Transactions" and "My Jobs" stay independent entry points (#290).
      final role = widget.isSeller ? 'seller' : 'buyer';
      ref.read(transactionsProvider.notifier).loadMyTransactions(role: role);
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
      ref.read(transactionsProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(transactionsProvider);
    final isSeller = widget.isSeller;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: isSeller ? 'My Jobs' : 'Transactions',
        onBack: () => context.pop(),
        actions: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.swap_horiz, size: 12, color: Colors.white),
                const SizedBox(width: 4),
                Text(
                  isSeller ? 'Seller' : 'Buyer',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Stats summary row
          _buildStatsSummary(state),

          // Filter tabs
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _GradientFilterChip(
                  label: 'All',
                  selected: state.statusFilter == null,
                  onTap: () => ref
                      .read(transactionsProvider.notifier)
                      .setStatusFilter(null),
                ),
                _GradientFilterChip(
                  label: 'In Progress',
                  selected: state.statusFilter == 'in_progress',
                  onTap: () => ref
                      .read(transactionsProvider.notifier)
                      .setStatusFilter('in_progress'),
                ),
                _GradientFilterChip(
                  label: 'Awaiting Approval',
                  selected: state.statusFilter == 'awaiting_approval',
                  onTap: () => ref
                      .read(transactionsProvider.notifier)
                      .setStatusFilter('awaiting_approval'),
                ),
                _GradientFilterChip(
                  label: 'Completed',
                  selected: state.statusFilter == 'completed',
                  onTap: () => ref
                      .read(transactionsProvider.notifier)
                      .setStatusFilter('completed'),
                ),
                _GradientFilterChip(
                  label: 'Cancelled',
                  selected: state.statusFilter == 'cancelled',
                  onTap: () => ref
                      .read(transactionsProvider.notifier)
                      .setStatusFilter('cancelled'),
                ),
              ],
            ),
          ),

          // Sort row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${state.transactions.length} transactions',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.greyMedium,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      width: 1.5,
                    ),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.sort, size: 13, color: AppColors.primary),
                      SizedBox(width: 4),
                      Text(
                        'Newest',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // List
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.transactions.isEmpty
                    ? const EmptyState(
                        icon: Icons.receipt_long_outlined,
                        title: 'No transactions yet',
                        subtitle:
                            'Transactions will appear here once you accept an offer.',
                      )
                    : RefreshIndicator(
                        onRefresh: () => ref
                            .read(transactionsProvider.notifier)
                            .loadMyTransactions(refresh: true),
                        child: ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: state.transactions.length +
                              (state.isLoadingMore ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == state.transactions.length) {
                              return const Center(
                                child: Padding(
                                  padding: EdgeInsets.all(16),
                                  child: CircularProgressIndicator(),
                                ),
                              );
                            }
                            final tx = state.transactions[index];
                            return _TransactionCard(
                              transaction: tx,
                              isSeller: isSeller,
                              onTap: () => context.push(
                                isSeller
                                    ? '/transactions/${tx.id}/seller'
                                    : '/transactions/${tx.id}',
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsSummary(dynamic state) {
    final transactions = state.transactions as List<Transaction>;
    // "Active" = any in-flight work status, not just the literal `in_progress`.
    // A job moves in_progress → scheduled → on_the_way → started (and the
    // shipped/meetup variants) before it's completable, so count the whole
    // working set as active rather than only `in_progress`. Terminal/handoff
    // statuses (awaiting_approval, completed, cancelled, disputed) are excluded. (#290)
    const inactiveStatuses = {
      'awaiting_approval',
      'completed',
      'cancelled',
      'disputed',
    };
    final active = transactions
        .where((t) => !inactiveStatuses.contains(t.status))
        .length;
    final pending =
        transactions.where((t) => t.status == 'awaiting_approval').length;
    final completed =
        transactions.where((t) => t.status == 'completed').length;
    final totalValue = transactions.fold<double>(
      0,
      (sum, t) => sum + t.buyerTotal,
    );

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Row(
        children: [
          _StatPill(
            label: 'Active',
            value: '$active',
            color: AppColors.info,
          ),
          const SizedBox(width: 8),
          _StatPill(
            label: 'Pending',
            value: '$pending',
            color: AppColors.warning,
          ),
          const SizedBox(width: 8),
          _StatPill(
            label: 'Done',
            value: '$completed',
            color: AppColors.success,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _StatPill(
              label: 'Value',
              value: formatCurrency(totalValue),
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatPill({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: color,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: AppColors.greyMedium,
            ),
          ),
        ],
      ),
    );
  }
}

class _GradientFilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _GradientFilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
          decoration: BoxDecoration(
            gradient: selected ? AppColors.primaryGradient : null,
            color: selected ? null : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: selected
                ? null
                : Border.all(color: AppColors.border, width: 1.5),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: selected ? Colors.white : AppColors.grey,
            ),
          ),
        ),
      ),
    );
  }
}

class _TransactionCard extends StatelessWidget {
  final Transaction transaction;
  final bool isSeller;
  final VoidCallback? onTap;

  const _TransactionCard({
    required this.transaction,
    this.isSeller = false,
    this.onTap,
  });

  Color get _statusAccentColor {
    return switch (transaction.status) {
      'in_progress' => AppColors.info,
      'awaiting_approval' => AppColors.warning,
      'completed' => AppColors.success,
      'cancelled' => AppColors.error,
      _ => AppColors.greyMedium,
    };
  }

  // The seller's transaction model has no buyer summary, so seller cards are
  // keyed off the job (post) title rather than the counterparty name (#290).
  String get _title {
    if (isSeller) {
      return transaction.postTitle.isNotEmpty ? transaction.postTitle : 'Job';
    }
    return transaction.sellerName;
  }

  String get _subtitle =>
      isSeller ? 'Tap to manage job' : transaction.postTitle;

  String get _nextAction {
    if (isSeller) {
      // A job is only completable once it reaches a "doing the work" status
      // (started / in_transit / meetup_scheduled / changes_requested) — see
      // _canMarkComplete in SellerTransactionDetailScreen. Earlier statuses
      // (in_progress, scheduled, on_the_way, preparing_shipment, shipped,
      // pending_meetup) still need an update, so map them rather than blank. (#290)
      return switch (transaction.status) {
        'started' ||
        'in_transit' ||
        'meetup_scheduled' ||
        'changes_requested' =>
          'Update / Mark Complete',
        'awaiting_approval' => 'Awaiting buyer approval',
        'completed' => 'Completed',
        'cancelled' => 'Cancelled',
        _ => 'Update status',
      };
    }
    return switch (transaction.status) {
      'in_progress' => 'Track Progress',
      'awaiting_approval' => 'Review & Approve',
      'completed' => 'Leave Review',
      _ => '',
    };
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
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
            // Left accent bar via top colored strip
            Container(
              height: 3,
              decoration: BoxDecoration(
                color: _statusAccentColor,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(18),
                  topRight: Radius.circular(18),
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Counterparty + status
                  Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(
                            _title[0].toUpperCase(),
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
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
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    _title,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.black,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                // Verified badge applies to the seller; only
                                // shown on the buyer's view of the counterparty.
                                if (!isSeller) ...[
                                  const SizedBox(width: 4),
                                  const Icon(Icons.verified,
                                      size: 14, color: AppColors.primary),
                                ],
                              ],
                            ),
                            Text(
                              _subtitle.isNotEmpty ? _subtitle : 'Transaction',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: AppColors.grey,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      StatusBadge(status: transaction.status),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Amount + escrow
                  Row(
                    children: [
                      Text(
                        formatCurrency(transaction.buyerTotal),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const Spacer(),
                      if (transaction.escrowStatus == 'held')
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.06),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.lock,
                                  size: 11, color: AppColors.primary),
                              SizedBox(width: 4),
                              Text(
                                'In Escrow',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Progress bar
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${transaction.milestonesDone} / ${transaction.milestonesTotal} milestones',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppColors.greyMedium,
                            ),
                          ),
                          Text(
                            formatRelativeDate(transaction.createdAt),
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.greyMedium,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(3),
                        child: SizedBox(
                          height: 6,
                          child: LinearProgressIndicator(
                            value: transaction.milestoneProgress,
                            backgroundColor: const Color(0xFFE5E7EB),
                            valueColor: AlwaysStoppedAnimation(
                              _statusAccentColor,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Next action button
                  if (_nextAction.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: _statusAccentColor.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _nextAction,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: _statusAccentColor,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Icon(Icons.arrow_forward_ios,
                                  size: 10, color: _statusAccentColor),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
