import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../data/models/transaction_model.dart';
import '../../providers/transaction_provider.dart';

class SellerTransactionDetailScreen extends ConsumerStatefulWidget {
  final String transactionId;

  const SellerTransactionDetailScreen({
    super.key,
    required this.transactionId,
  });

  @override
  ConsumerState<SellerTransactionDetailScreen> createState() =>
      _SellerTransactionDetailScreenState();
}

class _SellerTransactionDetailScreenState
    extends ConsumerState<SellerTransactionDetailScreen> {
  bool _isUpdating = false;
  int _deliveryTab = 0; // 0=service, 1=product, 2=pickup

  Future<void> _updateStatus(
    Transaction txn,
    String newStatus, {
    String? trackingNumber,
    String? carrier,
    String? meetupLocation,
    String? meetupDate,
    String? meetupTime,
    String? scheduledDate,
    String? scheduledTime,
    String? note,
  }) async {
    setState(() => _isUpdating = true);
    try {
      await ref.read(transactionsProvider.notifier).updateTransactionStatus(
        widget.transactionId,
        status: newStatus,
        trackingNumber: trackingNumber,
        carrier: carrier,
        meetupLocation: meetupLocation,
        meetupDate: meetupDate,
        meetupTime: meetupTime,
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        note: note,
      );
      ref.invalidate(transactionDetailProvider(widget.transactionId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Status updated to ${formatStatus(newStatus)}'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isUpdating = false);
    }
  }

  Future<void> _showMarkCompleteDialog(Transaction txn) async {
    final beforePhotoController = TextEditingController();
    final afterPhotoController = TextEditingController();
    final summaryController = TextEditingController();
    final notesController = TextEditingController();

    String? errorText;

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Mark Complete'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Upload at least one before and one after photo to mark this job as complete.',
                  style: TextStyle(fontSize: 13, color: AppColors.grey),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: beforePhotoController,
                  decoration: const InputDecoration(
                    labelText: 'Before Photo URL (required)',
                    hintText: 'Paste photo URL',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: afterPhotoController,
                  decoration: const InputDecoration(
                    labelText: 'After Photo URL (required)',
                    hintText: 'Paste photo URL',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: summaryController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Work Summary (optional)',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notesController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Completion Notes (optional)',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                if (errorText != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    errorText!,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.error,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              // Validate inline and keep the dialog open instead of silently
              // closing when the required photo URLs are missing (#290).
              onPressed: () {
                if (beforePhotoController.text.trim().isEmpty ||
                    afterPhotoController.text.trim().isEmpty) {
                  setDialogState(() =>
                      errorText = 'Before and after photos are required.');
                  return;
                }
                Navigator.pop(ctx, true);
              },
              child: const Text('Mark Complete'),
            ),
          ],
        ),
      ),
    );

    // Both photo fields are guaranteed non-empty here — the dialog only returns
    // true after passing the inline validation above.
    if (result == true && mounted) {
      setState(() => _isUpdating = true);
      try {
        await ref.read(transactionsProvider.notifier).markComplete(
          widget.transactionId,
          beforePhotos: [beforePhotoController.text],
          afterPhotos: [afterPhotoController.text],
          workSummary: summaryController.text.isNotEmpty
              ? summaryController.text
              : null,
          completionNotes: notesController.text.isNotEmpty
              ? notesController.text
              : null,
        );
        // Return to the My Jobs list instead of invalidating this screen's
        // provider in place. markComplete() already advances the list state to
        // awaiting_approval, so the list reflects the change on pop. Popping
        // avoids tearing down the watched transactionDetailProvider while the
        // action bar unmounts in the same frame, which triggered the
        // `_dependents.isEmpty` assertion crash (#290).
        if (mounted) {
          final messenger = ScaffoldMessenger.of(context);
          messenger.showSnackBar(
            const SnackBar(
              content: Text('Marked as complete! Awaiting buyer approval.'),
              backgroundColor: AppColors.success,
            ),
          );
          Navigator.of(context).pop();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(e.toString()),
              backgroundColor: AppColors.error,
            ),
          );
        }
      } finally {
        if (mounted) setState(() => _isUpdating = false);
      }
    }

    beforePhotoController.dispose();
    afterPhotoController.dispose();
    summaryController.dispose();
    notesController.dispose();
  }

  List<({String status, String label, IconData icon})> _getNextStatuses(
      Transaction txn) {
    final type = txn.transactionType;
    final status = txn.status;

    if (type == 'service' || type == 'job_milestone') {
      return switch (status) {
        'in_progress' => [
            (
              status: 'scheduled',
              label: 'Schedule',
              icon: Icons.calendar_today,
            ),
          ],
        'scheduled' => [
            (
              status: 'on_the_way',
              label: 'On the Way',
              icon: Icons.directions_car,
            ),
          ],
        'on_the_way' => [
            (
              status: 'started',
              label: 'Start Work',
              icon: Icons.play_arrow,
            ),
          ],
        'started' || 'changes_requested' => [],
        _ => [],
      };
    }

    if (type == 'product_shipped') {
      return switch (status) {
        'in_progress' => [
            (
              status: 'preparing_shipment',
              label: 'Preparing Shipment',
              icon: Icons.inventory,
            ),
          ],
        'preparing_shipment' => [
            (
              status: 'shipped',
              label: 'Mark Shipped',
              icon: Icons.local_shipping,
            ),
          ],
        'shipped' => [
            (
              status: 'in_transit',
              label: 'In Transit',
              icon: Icons.flight,
            ),
          ],
        _ => [],
      };
    }

    if (type == 'product_local_cash' || type == 'product_local_platform') {
      return switch (status) {
        'in_progress' => [
            (
              status: 'pending_meetup',
              label: 'Set Up Meetup',
              icon: Icons.handshake,
            ),
          ],
        'pending_meetup' => [
            (
              status: 'meetup_scheduled',
              label: 'Schedule Meetup',
              icon: Icons.event,
            ),
          ],
        _ => [],
      };
    }

    return [];
  }

  bool _canMarkComplete(Transaction txn) {
    final completableStatuses = [
      'started',
      'in_transit',
      'meetup_scheduled',
      'changes_requested',
    ];
    return completableStatuses.contains(txn.status);
  }

  @override
  Widget build(BuildContext context) {
    final txnAsync =
        ref.watch(transactionDetailProvider(widget.transactionId));

    // Determine delivery tab from transaction type
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Job Details',
        onBack: () => Navigator.of(context).pop(),
      ),
      body: txnAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Text('Error: $e',
              style: const TextStyle(color: AppColors.error)),
        ),
        data: (txn) {
          final nextStatuses = _getNextStatuses(txn);
          final canComplete = _canMarkComplete(txn);

          // Set delivery tab based on transaction type
          if (txn.transactionType == 'product_shipped') {
            _deliveryTab = 1;
          } else if (txn.transactionType == 'product_local_cash' ||
              txn.transactionType == 'product_local_platform') {
            _deliveryTab = 2;
          }

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      const SizedBox(height: 8),

                      // Green status banner
                      _buildStatusBanner(txn),
                      const SizedBox(height: 16),

                      // Earnings card
                      _buildEarningsCard(txn),
                      const SizedBox(height: 12),

                      // Client info
                      _buildClientCard(txn),
                      const SizedBox(height: 12),

                      // Delivery type tabs
                      _buildDeliverySection(txn),
                      const SizedBox(height: 12),

                      // Photo upload grid
                      _buildPhotoUploadSection(txn),
                      const SizedBox(height: 12),

                      // Timeline
                      if (txn.timelineEvents.isNotEmpty)
                        _buildTimeline(txn),

                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),

              // Bottom action bar
              _buildActionBar(txn, nextStatuses, canComplete),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStatusBanner(Transaction txn) {
    final color = txn.isCompleted
        ? AppColors.success
        : txn.isCancelled
            ? AppColors.error
            : const Color(0xFF059669);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            color.withValues(alpha: 0.08),
            color.withValues(alpha: 0.03),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(
              txn.isCompleted
                  ? Icons.check_circle
                  : txn.isCancelled
                      ? Icons.cancel
                      : Icons.work_outline,
              color: color,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                formatStatus(txn.status),
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
              Text(
                formatStatus(txn.transactionType),
                style: TextStyle(
                  fontSize: 12,
                  color: color.withValues(alpha: 0.7),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEarningsCard(Transaction txn) {
    return SectionCard(
      child: Column(
        children: [
          SectionHeader(
            icon: Icons.account_balance_wallet,
            title: 'Your Earnings',
            iconColor: AppColors.success,
            iconBackground: AppColors.success.withValues(alpha: 0.08),
          ),
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.success.withValues(alpha: 0.05),
                  AppColors.success.withValues(alpha: 0.02),
                ],
              ),
              borderRadius: BorderRadius.circular(14),
              border:
                  Border.all(color: AppColors.success.withValues(alpha: 0.15)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Quote',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.grey,
                      ),
                    ),
                    Text(
                      formatCurrency(txn.quoteAmount),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                if (txn.platformFee != null) ...[
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Platform Fee',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.error,
                        ),
                      ),
                      Text(
                        '-${formatCurrency(txn.platformFee!)}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.error,
                        ),
                      ),
                    ],
                  ),
                ],
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Divider(height: 1),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Your Payout',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.black,
                      ),
                    ),
                    Text(
                      formatCurrency(
                          txn.sellerPayoutAmount ?? txn.quoteAmount),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildClientCard(Transaction txn) {
    return SectionCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF3B82F6), Color(0xFF6366F1)],
              ),
              borderRadius: BorderRadius.circular(13),
            ),
            child: const Center(
              child: Text(
                'B',
                style: TextStyle(
                  fontSize: 16,
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
                const Text(
                  'Buyer',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.greyMedium,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  txn.postTitle.isNotEmpty ? txn.postTitle : 'Client',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.black,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const Row(
            children: [
              Icon(Icons.star, size: 13, color: AppColors.warning),
              SizedBox(width: 3),
              Text(
                '4.9',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.black,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDeliverySection(Transaction txn) {
    return SectionCard(
      child: Column(
        children: [
          const SectionHeader(icon: Icons.local_shipping, title: 'Delivery'),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(
              children: [
                _DeliveryTab(
                  label: 'Service',
                  selected: _deliveryTab == 0,
                  onTap: () => setState(() => _deliveryTab = 0),
                ),
                const SizedBox(width: 8),
                _DeliveryTab(
                  label: 'Product',
                  selected: _deliveryTab == 1,
                  onTap: () => setState(() => _deliveryTab = 1),
                ),
                const SizedBox(width: 8),
                _DeliveryTab(
                  label: 'Pickup',
                  selected: _deliveryTab == 2,
                  onTap: () => setState(() => _deliveryTab = 2),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: _deliveryTab == 0
                ? _buildServiceDelivery(txn)
                : _deliveryTab == 1
                    ? _buildProductDelivery(txn)
                    : _buildPickupDelivery(txn),
          ),
        ],
      ),
    );
  }

  Widget _buildServiceDelivery(Transaction txn) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Complete the service and upload photos as evidence.',
          style: TextStyle(fontSize: 13, color: AppColors.grey, height: 1.4),
        ),
        if (txn.completionNotes != null) ...[
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              txn.completionNotes!,
              style: const TextStyle(fontSize: 13, color: AppColors.grey),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildProductDelivery(Transaction txn) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (txn.trackingNumber != null) ...[
          _DetailRow('Tracking', txn.trackingNumber!),
          if (txn.carrier != null) _DetailRow('Carrier', txn.carrier!),
        ] else
          const Text(
            'Add tracking information when you ship the item.',
            style:
                TextStyle(fontSize: 13, color: AppColors.grey, height: 1.4),
          ),
      ],
    );
  }

  Widget _buildPickupDelivery(Transaction txn) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (txn.meetupLocation != null) ...[
          _DetailRow('Location', txn.meetupLocation!),
          if (txn.meetupDate != null) _DetailRow('Date', txn.meetupDate!),
          if (txn.meetupTime != null) _DetailRow('Time', txn.meetupTime!),
        ] else
          const Text(
            'Arrange a meetup location with the buyer.',
            style:
                TextStyle(fontSize: 13, color: AppColors.grey, height: 1.4),
          ),
      ],
    );
  }

  Widget _buildPhotoUploadSection(Transaction txn) {
    return SectionCard(
      child: Column(
        children: [
          const SectionHeader(
            icon: Icons.camera_alt_outlined,
            title: 'Work Photos',
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Before Photos',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.greyMedium,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    ...List.generate(
                      txn.beforePhotos.length.clamp(0, 2),
                      (i) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: _PhotoCell(filled: true),
                      ),
                    ),
                    if (txn.beforePhotos.length < 3) _PhotoCell(filled: false),
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  'After Photos',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.greyMedium,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    ...List.generate(
                      txn.afterPhotos.length.clamp(0, 2),
                      (i) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: _PhotoCell(filled: true),
                      ),
                    ),
                    if (txn.afterPhotos.length < 3) _PhotoCell(filled: false),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeline(Transaction txn) {
    return SectionCard(
      child: Column(
        children: [
          const SectionHeader(icon: Icons.timeline, title: 'Timeline'),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            child: Column(
              children: txn.timelineEvents
                  .take(5)
                  .map((e) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Row(
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.success,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                e.displayEvent,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                            if (e.dateTime != null)
                              Text(
                                formatRelativeDate(e.dateTime!),
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

  Widget _buildActionBar(
    Transaction txn,
    List<({String status, String label, IconData icon})> nextStatuses,
    bool canComplete,
  ) {
    if (_isUpdating) {
      return Container(
        padding: const EdgeInsets.all(20),
        child: const Center(child: CircularProgressIndicator()),
      );
    }

    if (nextStatuses.isEmpty && !canComplete && !txn.canCancel) {
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
        mainAxisSize: MainAxisSize.min,
        children: [
          if (canComplete)
            GradientButton(
              text: 'Mark Complete',
              icon: Icons.check_circle,
              onPressed: () => _showMarkCompleteDialog(txn),
            )
          else if (nextStatuses.isNotEmpty)
            GradientButton(
              text: nextStatuses.first.label,
              icon: nextStatuses.first.icon,
              onPressed: () => _showStatusUpdateDialog(
                  txn, nextStatuses.first.status),
            ),
          if (txn.canCancel) ...[
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () => _handleCancel(txn),
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
                    'Cancel Transaction',
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
        ],
      ),
    );
  }

  Future<void> _showStatusUpdateDialog(
      Transaction txn, String newStatus) async {
    final noteController = TextEditingController();
    final trackingController = TextEditingController();
    final carrierController = TextEditingController();
    final locationController = TextEditingController();

    final needsTracking = newStatus == 'shipped' || newStatus == 'in_transit';
    final needsMeetup = newStatus == 'meetup_scheduled';

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Update to ${formatStatus(newStatus)}'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (needsTracking) ...[
                TextField(
                  controller: trackingController,
                  decoration: const InputDecoration(
                    labelText: 'Tracking Number',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: carrierController,
                  decoration: const InputDecoration(
                    labelText: 'Carrier (e.g., UPS, FedEx)',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
              ],
              if (needsMeetup) ...[
                TextField(
                  controller: locationController,
                  decoration: const InputDecoration(
                    labelText: 'Meetup Location',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
              ],
              TextField(
                controller: noteController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Note (optional)',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Update'),
          ),
        ],
      ),
    );

    if (result == true && mounted) {
      await _updateStatus(
        txn,
        newStatus,
        trackingNumber: trackingController.text.isNotEmpty
            ? trackingController.text
            : null,
        carrier: carrierController.text.isNotEmpty
            ? carrierController.text
            : null,
        meetupLocation: locationController.text.isNotEmpty
            ? locationController.text
            : null,
        note: noteController.text.isNotEmpty ? noteController.text : null,
      );
    }

    noteController.dispose();
    trackingController.dispose();
    carrierController.dispose();
    locationController.dispose();
  }

  Future<void> _handleCancel(Transaction txn) async {
    final reasonController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Transaction'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Are you sure? This will cancel the transaction.'),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Reason for cancellation',
                border: OutlineInputBorder(),
                isDense: true,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Back'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Cancel Transaction'),
          ),
        ],
      ),
    );
    final reason = reasonController.text;
    reasonController.dispose();
    if (confirmed == true && reason.isNotEmpty && mounted) {
      setState(() => _isUpdating = true);
      try {
        await ref
            .read(transactionsProvider.notifier)
            .cancelTransaction(widget.transactionId, reason);
        ref.invalidate(transactionDetailProvider(widget.transactionId));
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(e.toString()),
              backgroundColor: AppColors.error,
            ),
          );
        }
      } finally {
        if (mounted) setState(() => _isUpdating = false);
      }
    }
  }
}

class _DeliveryTab extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _DeliveryTab({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          height: 34,
          decoration: BoxDecoration(
            gradient: selected ? AppColors.primaryGradient : null,
            color: selected ? null : AppColors.greyLight,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(
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
      ),
    );
  }
}

class _PhotoCell extends StatelessWidget {
  final bool filled;

  const _PhotoCell({required this.filled});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 72,
      height: 72,
      decoration: BoxDecoration(
        color: filled ? AppColors.greyLight : null,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: filled
              ? AppColors.border
              : AppColors.primary.withValues(alpha: 0.3),
          width: filled ? 1 : 1.5,
          strokeAlign: BorderSide.strokeAlignInside,
        ),
      ),
      child: filled
          ? const Icon(Icons.image, size: 24, color: AppColors.greyMedium)
          : Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.add,
                    size: 18,
                    color: AppColors.primary.withValues(alpha: 0.6)),
                const SizedBox(height: 2),
                Text(
                  'Add',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary.withValues(alpha: 0.7),
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
      padding: const EdgeInsets.only(bottom: 8),
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
