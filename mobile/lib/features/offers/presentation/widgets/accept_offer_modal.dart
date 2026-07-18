import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/fee_calculator.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../data/models/offer_model.dart';

class AcceptOfferModal extends StatefulWidget {
  final Offer offer;
  final VoidCallback onConfirm;

  const AcceptOfferModal({
    super.key,
    required this.offer,
    required this.onConfirm,
  });

  @override
  State<AcceptOfferModal> createState() => _AcceptOfferModalState();
}

class _AcceptOfferModalState extends State<AcceptOfferModal> {
  bool _agreedToTerms = false;
  int _selectedPaymentMethod = 0;

  FeeBreakdown get _fees => calculateBuyerFees(
        widget.offer.offerType,
        widget.offer.quoteAmount,
      );

  double get _buyerFee => _fees.buyerFee;
  double get _stripeFee => _fees.stripeFee;
  double get _total => _fees.totalCharged;

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
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
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Accept Offer',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.black,
                        letterSpacing: -0.4,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'Confirm payment to proceed',
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
                      border: Border.all(color: AppColors.border, width: 1.5),
                    ),
                    child: const Icon(Icons.close,
                        size: 16, color: AppColors.grey),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Seller summary
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
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      gradient: AppColors.primaryGradient,
                      image: widget.offer.seller?.profilePhotoUrl != null
                          ? DecorationImage(
                              image: NetworkImage(
                                  widget.offer.seller!.profilePhotoUrl!),
                              fit: BoxFit.cover,
                            )
                          : null,
                    ),
                    child: widget.offer.seller?.profilePhotoUrl == null
                        ? Center(
                            child: Text(
                              widget.offer.sellerName[0].toUpperCase(),
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.offer.sellerName,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.black,
                          ),
                        ),
                        if (widget.offer.sellerRating != null)
                          Row(
                            children: [
                              const Icon(Icons.star,
                                  size: 12, color: Color(0xFFF59E0B)),
                              const SizedBox(width: 3),
                              Text(
                                widget.offer.sellerRating!
                                    .toStringAsFixed(1),
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.grey,
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Cost breakdown
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.subtleBorder),
              ),
              child: Column(
                children: [
                  _CostRow(
                    label: 'Offer price',
                    value: formatCurrency(widget.offer.quoteAmount),
                  ),
                  const SizedBox(height: 10),
                  _CostRow(
                    label: 'Buyer service fee (${_fees.platformFeePercentage.toInt()}%)',
                    value: '+${formatCurrency(_buyerFee)}',
                  ),
                  const SizedBox(height: 10),
                  _CostRow(
                    label: 'Processing fee',
                    value: '+${formatCurrency(_stripeFee)}',
                    isSmall: true,
                  ),
                  const SizedBox(height: 12),
                  const Divider(height: 1, color: AppColors.border),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total charge',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: AppColors.black,
                        ),
                      ),
                      Text(
                        formatCurrency(_total),
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: AppColors.black,
                          letterSpacing: -0.66,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Payment method selector
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Payment Method',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.black,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _PaymentOption(
                    icon: Icons.credit_card,
                    label: 'Credit / Debit Card',
                    sublabel: 'Visa, Mastercard, Amex',
                    isSelected: _selectedPaymentMethod == 0,
                    onTap: () =>
                        setState(() => _selectedPaymentMethod = 0),
                  ),
                  const SizedBox(height: 8),
                  _PaymentOption(
                    icon: Icons.phone_iphone,
                    label: 'Apple Pay',
                    sublabel: 'Touch ID / Face ID',
                    isSelected: _selectedPaymentMethod == 1,
                    onTap: () =>
                        setState(() => _selectedPaymentMethod = 1),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Terms checkbox
            GestureDetector(
              onTap: () =>
                  setState(() => _agreedToTerms = !_agreedToTerms),
              child: Row(
                children: [
                  Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: _agreedToTerms
                            ? AppColors.primary
                            : AppColors.border,
                        width: 1.5,
                      ),
                      color: _agreedToTerms
                          ? AppColors.primary
                          : Colors.transparent,
                    ),
                    child: _agreedToTerms
                        ? const Icon(Icons.check,
                            size: 14, color: Colors.white)
                        : null,
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'I agree to the escrow terms and conditions',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.grey,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Confirm button
            GradientButton(
              text: 'Confirm & Pay ${formatCurrency(_total)}',
              onPressed: _agreedToTerms ? widget.onConfirm : null,
              height: 54,
              borderRadius: 20,
              icon: Icons.lock_outline,
            ),
            const SizedBox(height: 12),

            // Security badges
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.lock_outline,
                    size: 12, color: AppColors.success),
                const SizedBox(width: 5),
                const Text(
                  '256-bit encryption',
                  style: TextStyle(fontSize: 11, color: AppColors.grey),
                ),
                const SizedBox(width: 12),
                Icon(Icons.verified_user_outlined,
                    size: 12, color: AppColors.success),
                const SizedBox(width: 5),
                const Text(
                  'Payments secured',
                  style: TextStyle(fontSize: 11, color: AppColors.grey),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Escrow note
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Icon(Icons.shield_outlined,
                      size: 14, color: AppColors.success),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Funds held securely in escrow until work is completed',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF059669),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CostRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isSmall;

  const _CostRow({
    required this.label,
    required this.value,
    this.isSmall = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isSmall ? 12 : 13,
            color: isSmall ? AppColors.greyMedium : const Color(0xFF4B5563),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isSmall ? 12 : 14,
            fontWeight: FontWeight.w600,
            color: AppColors.black,
          ),
        ),
      ],
    );
  }
}

class _PaymentOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sublabel;
  final bool isSelected;
  final VoidCallback onTap;

  const _PaymentOption({
    required this.icon,
    required this.label,
    required this.sublabel,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 1.5 : 1,
          ),
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.04)
              : Colors.transparent,
        ),
        child: Row(
          children: [
            Icon(icon,
                size: 20,
                color: isSelected ? AppColors.primary : AppColors.grey),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: isSelected ? AppColors.black : AppColors.grey,
                    ),
                  ),
                  Text(
                    sublabel,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.greyMedium,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 18,
              height: 18,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? AppColors.primary : AppColors.border,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? Center(
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primary,
                        ),
                      ),
                    )
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}
