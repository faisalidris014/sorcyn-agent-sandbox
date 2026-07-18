import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/gradient_button.dart';

/// Shows a bottom sheet modal for counter-offering.
Future<Map<String, dynamic>?> showCounterOfferModal(
  BuildContext context, {
  required String sellerName,
  required double originalAmount,
  double? budgetMin,
  double? budgetMax,
}) {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _CounterOfferSheet(
      sellerName: sellerName,
      originalAmount: originalAmount,
      budgetMin: budgetMin,
      budgetMax: budgetMax,
    ),
  );
}

class _CounterOfferSheet extends StatefulWidget {
  final String sellerName;
  final double originalAmount;
  final double? budgetMin;
  final double? budgetMax;

  const _CounterOfferSheet({
    required this.sellerName,
    required this.originalAmount,
    this.budgetMin,
    this.budgetMax,
  });

  @override
  State<_CounterOfferSheet> createState() => _CounterOfferSheetState();
}

class _CounterOfferSheetState extends State<_CounterOfferSheet> {
  final _amountController = TextEditingController();
  final _messageController = TextEditingController();
  bool _amountFocused = false;
  bool _messageFocused = false;
  final bool _isSubmitting = false;

  double? get _counterAmount => double.tryParse(
      _amountController.text.replaceAll(',', ''));

  bool get _isBelowMarket {
    final amount = _counterAmount;
    if (amount == null) return false;
    return amount < widget.originalAmount * 0.5;
  }

  bool get _canSubmit =>
      _counterAmount != null && _counterAmount! > 0 && !_isSubmitting;

  @override
  void dispose() {
    _amountController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(20, 12, 20, 32 + bottomInset),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),

            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'Counter Offer',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.black,
                        letterSpacing: -0.4,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'Propose a different price',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.greyMedium,
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(10),
                      border:
                          Border.all(color: AppColors.border, width: 1.5),
                    ),
                    child: const Icon(Icons.close,
                        size: 16, color: AppColors.grey),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Original offer summary
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.04),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.15),
                  width: 1.5,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      gradient: AppColors.primaryGradient,
                    ),
                    child: Center(
                      child: Text(
                        widget.sellerName[0].toUpperCase(),
                        style: const TextStyle(
                          fontSize: 14,
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
                        Text(
                          widget.sellerName,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.black,
                          ),
                        ),
                        const Text(
                          'Original Offer',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.greyMedium,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '\$${widget.originalAmount.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                      letterSpacing: -0.6,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Counter amount field
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Your Counter Amount',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.black,
                  ),
                ),
                const SizedBox(height: 8),
                Focus(
                  onFocusChange: (f) =>
                      setState(() => _amountFocused = f),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    height: 56,
                    decoration: BoxDecoration(
                      color: _amountFocused
                          ? AppColors.primary.withValues(alpha: 0.03)
                          : AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: _amountFocused
                            ? AppColors.primary
                            : AppColors.border,
                        width: 1.5,
                      ),
                    ),
                    child: Row(
                      children: [
                        const SizedBox(width: 16),
                        Text(
                          '\$',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: _amountFocused
                                ? AppColors.primary
                                : AppColors.greyMedium,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _amountController,
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.allow(
                                  RegExp(r'[\d,.]')),
                            ],
                            onChanged: (_) => setState(() {}),
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: AppColors.black,
                              letterSpacing: -0.44,
                            ),
                            decoration: const InputDecoration(
                              border: InputBorder.none,
                              hintText: '0',
                              hintStyle: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: AppColors.greyMedium,
                              ),
                              contentPadding: EdgeInsets.zero,
                              isDense: true,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            // Below market value warning
            if (_isBelowMarket) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppColors.warning.withValues(alpha: 0.25),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(Icons.warning_amber,
                        size: 16, color: AppColors.warning),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'This offer is significantly below the original quote',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFFD97706),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 16),

            // Message field
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Message (optional)',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.black,
                  ),
                ),
                const SizedBox(height: 8),
                Focus(
                  onFocusChange: (f) =>
                      setState(() => _messageFocused = f),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    decoration: BoxDecoration(
                      color: _messageFocused
                          ? AppColors.primary.withValues(alpha: 0.03)
                          : AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: _messageFocused
                            ? AppColors.primary
                            : AppColors.border,
                        width: 1.5,
                      ),
                    ),
                    child: TextField(
                      controller: _messageController,
                      maxLines: 3,
                      textCapitalization: TextCapitalization.sentences,
                      style: const TextStyle(
                          fontSize: 15, color: AppColors.black),
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        hintText: 'Explain your counter offer...',
                        hintStyle: TextStyle(
                            fontSize: 15, color: AppColors.greyMedium),
                        contentPadding: EdgeInsets.all(16),
                      ),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Submit button
            GradientButton(
              text: 'Send Counter Offer',
              onPressed: _canSubmit
                  ? () {
                      Navigator.pop(context, {
                        'amount': _counterAmount,
                        'message': _messageController.text.trim(),
                      });
                    }
                  : null,
              isLoading: _isSubmitting,
              height: 54,
              borderRadius: 20,
            ),
            const SizedBox(height: 10),

            // Cancel button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: TextButton(
                onPressed: () => Navigator.pop(context),
                style: TextButton.styleFrom(
                  backgroundColor: AppColors.greyLight,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
                child: const Text(
                  'Cancel',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.grey,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
