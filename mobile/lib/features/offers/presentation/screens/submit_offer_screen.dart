import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/photo_picker_grid.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../../posts/providers/post_provider.dart';
import '../../data/models/offer_model.dart';
import '../../providers/offer_provider.dart';

class SubmitOfferScreen extends ConsumerStatefulWidget {
  final String postId;
  final String? postTitle;
  final String? postCategory;
  final double? budgetMin;
  final double? budgetMax;

  const SubmitOfferScreen({
    super.key,
    required this.postId,
    this.postTitle,
    this.postCategory,
    this.budgetMin,
    this.budgetMax,
  });

  @override
  ConsumerState<SubmitOfferScreen> createState() => _SubmitOfferScreenState();
}

class _SubmitOfferScreenState extends ConsumerState<SubmitOfferScreen> {
  final _formKey = GlobalKey<FormState>();
  final _quoteController = TextEditingController();
  final _hoursController = TextEditingController();
  final _messageController = TextEditingController();
  // Per-item pricing inputs
  final _unitPriceController = TextEditingController();
  final _quantityController = TextEditingController();
  // Custom pricing detail
  final _customPricingController = TextEditingController();

  String _pricingType = 'flat_rate';
  String? _canStart; // selected preset (or 'Pick a date')
  DateTime? _specificDate;
  String? _completionTime; // selected timeline preset
  List<String> _photoUrls = [];
  bool _photosPending = false; // any photo still uploading/failed (gates submit)
  bool _isSubmitting = false;
  String? _error;
  bool _showSuccess = false;

  static const _pricingTypes = [
    ('flat_rate', 'Flat Rate', Icons.payments_outlined),
    ('hourly', 'Hourly', Icons.schedule),
    ('per_item', 'Per Item', Icons.inventory_2_outlined),
    ('custom', 'Custom', Icons.tune),
  ];

  static const _canStartPresets = [
    'Within 2 hours',
    'Today',
    'Tomorrow',
    'This week',
  ];

  static const _completionPresets = [
    'Same day',
    '1-3 days',
    '3-5 days',
    '1-2 weeks',
  ];

  @override
  void dispose() {
    _quoteController.dispose();
    _hoursController.dispose();
    _messageController.dispose();
    _unitPriceController.dispose();
    _quantityController.dispose();
    _customPricingController.dispose();
    super.dispose();
  }

  /// For per-item pricing the quote is derived from unit price × quantity;
  /// otherwise it comes straight from the quote field.
  double? get _quoteAmount {
    if (_pricingType == 'per_item') {
      final unit = double.tryParse(_unitPriceController.text.replaceAll(',', ''));
      final qty = double.tryParse(_quantityController.text.replaceAll(',', ''));
      if (unit == null || qty == null) return null;
      return unit * qty;
    }
    return double.tryParse(_quoteController.text.replaceAll(',', ''));
  }

  Map<String, double> get _feePreview {
    final quote = _quoteAmount;
    if (quote == null || quote <= 0) return {};
    final platformFee = quote * 0.08;
    final estimatedPayout = quote - platformFee;
    return {
      'quote': quote,
      'platformFee': platformFee,
      'estimatedPayout': estimatedPayout,
    };
  }

  String? get _budgetHint {
    final quote = _quoteAmount;
    if (quote == null) return null;
    if (widget.budgetMin != null && quote < widget.budgetMin!) {
      return 'Below buyer\'s minimum budget';
    }
    if (widget.budgetMax != null && quote > widget.budgetMax!) {
      return 'Above buyer\'s maximum budget';
    }
    return 'Within buyer\'s budget range';
  }

  Color? get _budgetHintColor {
    final quote = _quoteAmount;
    if (quote == null) return null;
    if (widget.budgetMin != null && quote < widget.budgetMin!) {
      return const Color(0xFFD97706);
    }
    if (widget.budgetMax != null && quote > widget.budgetMax!) {
      return AppColors.error;
    }
    return const Color(0xFF059669);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final quote = _quoteAmount;
    if (quote == null || quote < 10) {
      setState(() => _error = _pricingType == 'per_item'
          ? 'Enter a unit price and quantity (minimum total \$10)'
          : 'Enter a quote of at least \$10');
      return;
    }

    if (_photosPending) {
      setState(() => _error =
          'Some photos are still uploading or failed. Retry or remove them before submitting.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final categorySpecific = <String, dynamic>{};
      if (_pricingType == 'per_item') {
        categorySpecific['unitPrice'] =
            double.tryParse(_unitPriceController.text.replaceAll(',', ''));
        categorySpecific['quantity'] =
            double.tryParse(_quantityController.text.replaceAll(',', ''));
      } else if (_pricingType == 'custom' &&
          _customPricingController.text.trim().isNotEmpty) {
        categorySpecific['customPricing'] = _customPricingController.text.trim();
      }

      final specificDateStr = _specificDate != null
          ? '${_specificDate!.year.toString().padLeft(4, '0')}-'
              '${_specificDate!.month.toString().padLeft(2, '0')}-'
              '${_specificDate!.day.toString().padLeft(2, '0')}'
          : null;

      final input = CreateOfferInput(
        postId: widget.postId,
        offerType: 'service',
        quoteAmount: _quoteAmount!,
        pricingType: _pricingType,
        estimatedHours: _pricingType == 'hourly'
            ? double.tryParse(_hoursController.text)
            : null,
        canStart: _canStart,
        specificDate: specificDateStr,
        completionTime: _completionTime,
        message: _messageController.text.trim().isNotEmpty
            ? _messageController.text.trim()
            : null,
        photos: _photoUrls,
        categorySpecific: categorySpecific,
      );

      await ref.read(myOffersProvider.notifier).submitOffer(input);

      // Refresh cached views so the post detail + feed reflect the new offer
      // (state-aware CTA + offer count) instead of showing "Submit Offer" again.
      ref.invalidate(myOfferForPostProvider(widget.postId));
      ref.invalidate(postDetailProvider(widget.postId));
      ref.read(myOffersProvider.notifier).loadMyOffers(refresh: true);

      if (mounted) {
        setState(() => _showSuccess = true);
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) context.pop();
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fees = _feePreview;

    if (_showSuccess) {
      return _SuccessOverlay();
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Submit Offer',
        onBack: () => Navigator.of(context).pop(),
      ),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),

                    // Post summary card
                    if (widget.postTitle != null) _buildPostSummary(),
                    const SizedBox(height: 20),

                    // Pricing type selector
                    const Text(
                      'Pricing Type',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.black,
                      ),
                    ),
                    const SizedBox(height: 10),
                    _buildPricingSelector(),
                    const SizedBox(height: 20),

                    // Quote amount — per-item shows unit×qty, others a single field
                    Text(
                      _pricingType == 'per_item' ? 'Line Item' : 'Your Quote',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.black,
                      ),
                    ),
                    const SizedBox(height: 10),
                    if (_pricingType == 'per_item')
                      _buildPerItemInputs()
                    else
                      _buildQuoteInput(),
                    if (_pricingType == 'custom') ...[
                      const SizedBox(height: 12),
                      _buildTextField(
                        controller: _customPricingController,
                        label: 'Pricing details',
                        icon: Icons.tune,
                        hint: 'e.g., \$50 base + \$10 per room',
                      ),
                    ],
                    const SizedBox(height: 6),

                    // Budget hint
                    if (_budgetHint != null)
                      Row(
                        children: [
                          Icon(
                            _budgetHintColor == const Color(0xFF059669)
                                ? Icons.check_circle_outline
                                : Icons.warning_amber,
                            size: 13,
                            color: _budgetHintColor,
                          ),
                          const SizedBox(width: 5),
                          Text(
                            _budgetHint!,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: _budgetHintColor,
                            ),
                          ),
                        ],
                      ),
                    const SizedBox(height: 16),

                    // Fee preview
                    if (fees.isNotEmpty) _buildFeePreview(fees),
                    if (fees.isNotEmpty) const SizedBox(height: 20),

                    // Estimated hours (hourly only)
                    if (_pricingType == 'hourly') ...[
                      _buildTextField(
                        controller: _hoursController,
                        label: 'Estimated Hours',
                        icon: Icons.schedule,
                        keyboardType: TextInputType.number,
                        hint: 'e.g., 20',
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Can Start — preset chips + optional specific date
                    const Text(
                      'Can Start',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.black,
                      ),
                    ),
                    const SizedBox(height: 10),
                    _buildCanStartChips(),
                    const SizedBox(height: 20),

                    // Timeline — preset chips
                    const Text(
                      'Timeline',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.black,
                      ),
                    ),
                    const SizedBox(height: 10),
                    _buildTimelineChips(),
                    const SizedBox(height: 20),

                    // Message (optional)
                    const Text(
                      'Message to Buyer (optional)',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.black,
                      ),
                    ),
                    const SizedBox(height: 10),
                    _buildMessageField(),
                    const SizedBox(height: 4),
                    Align(
                      alignment: Alignment.centerRight,
                      child: Text(
                        '${_messageController.text.length}/1000',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.greyMedium,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Photos (optional) — e.g. an "after" photo of finished work
                    const Text(
                      'Photos (optional)',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.black,
                      ),
                    ),
                    const SizedBox(height: 10),
                    PhotoPickerGrid(
                      photoCategory: 'offer-photos',
                      maxVideos: 0,
                      onUrlsChanged: (urls) =>
                          setState(() => _photoUrls = urls),
                      onPendingChanged: (pending) =>
                          setState(() => _photosPending = pending),
                    ),

                    // Error
                    if (_error != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.error.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppColors.error.withValues(alpha: 0.2),
                          ),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline,
                                size: 16, color: AppColors.error),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _error!,
                                style: const TextStyle(
                                    color: AppColors.error, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),

            // Bottom bar
            Container(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 32),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(
                  top: BorderSide(
                      color: Colors.black.withValues(alpha: 0.06)),
                ),
              ),
              child: GradientButton(
                text: 'Submit Offer',
                onPressed: _isSubmitting ? null : _submit,
                isLoading: _isSubmitting,
                height: 54,
                borderRadius: 20,
                icon: Icons.send,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPostSummary() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.12),
          width: 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.postTitle!,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.black,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              if (widget.postCategory != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    widget.postCategory!,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              if (widget.budgetMin != null && widget.budgetMax != null)
                Text(
                  'Budget: ${formatCurrency(widget.budgetMin!)} - ${formatCurrency(widget.budgetMax!)}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.grey,
                    fontWeight: FontWeight.w500,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPricingSelector() {
    return Row(
      children: _pricingTypes.map((type) {
        final (key, label, icon) = type;
        final isSelected = _pricingType == key;
        return Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _pricingType = key),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              margin: const EdgeInsets.only(right: 6),
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isSelected ? AppColors.primary : AppColors.border,
                  width: 1.5,
                ),
                color: isSelected
                    ? AppColors.primary.withValues(alpha: 0.06)
                    : Colors.transparent,
              ),
              child: Column(
                children: [
                  Icon(
                    icon,
                    size: 18,
                    color: isSelected ? AppColors.primary : AppColors.grey,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: isSelected
                          ? AppColors.primary
                          : AppColors.grey,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildQuoteInput() {
    return TextFormField(
      controller: _quoteController,
      keyboardType: TextInputType.number,
      inputFormatters: [
        FilteringTextInputFormatter.allow(RegExp(r'[\d,.]')),
      ],
      onChanged: (_) => setState(() {}),
      validator: (v) {
        if (v == null || v.isEmpty) return 'Required';
        final amount = double.tryParse(v.replaceAll(',', ''));
        if (amount == null || amount < 10) return 'Minimum \$10';
        return null;
      },
      style: const TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.w800,
        color: AppColors.black,
        letterSpacing: -0.84,
      ),
      decoration: InputDecoration(
        prefixIcon: const Padding(
          padding: EdgeInsets.only(left: 16, right: 4),
          child: Text(
            '\$',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: AppColors.primary,
            ),
          ),
        ),
        prefixIconConstraints:
            const BoxConstraints(minWidth: 0, minHeight: 0),
        hintText: '0',
        hintStyle: const TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w800,
          color: AppColors.greyMedium,
        ),
        filled: true,
        fillColor: AppColors.surfaceVariant,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: AppColors.border, width: 1.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: AppColors.border, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: AppColors.error, width: 1.5),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }

  Widget _buildPerItemInputs() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: _buildTextField(
            controller: _unitPriceController,
            label: 'Unit price (\$)',
            icon: Icons.attach_money,
            keyboardType: TextInputType.number,
            hint: 'e.g., 25',
            onChanged: (_) => setState(() {}),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildTextField(
            controller: _quantityController,
            label: 'Quantity',
            icon: Icons.numbers,
            keyboardType: TextInputType.number,
            hint: 'e.g., 4',
            onChanged: (_) => setState(() {}),
          ),
        ),
      ],
    );
  }

  Widget _buildCanStartChips() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final preset in _canStartPresets)
          _SelectChip(
            label: preset,
            selected: _canStart == preset && _specificDate == null,
            onTap: () => setState(() {
              _canStart = preset;
              _specificDate = null;
            }),
          ),
        _SelectChip(
          label: _specificDate != null
              ? '${_specificDate!.month}/${_specificDate!.day}/${_specificDate!.year}'
              : 'Pick a date',
          icon: Icons.calendar_today,
          selected: _specificDate != null,
          onTap: _pickSpecificDate,
        ),
      ],
    );
  }

  Widget _buildTimelineChips() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final preset in _completionPresets)
          _SelectChip(
            label: preset,
            selected: _completionTime == preset,
            onTap: () => setState(() => _completionTime = preset),
          ),
      ],
    );
  }

  Future<void> _pickSpecificDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _specificDate ?? now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        _specificDate = picked;
        _canStart = 'Pick a date';
      });
    }
  }

  Widget _buildFeePreview(Map<String, double> fees) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: AppColors.surfaceVariant,
        border: Border.all(color: AppColors.subtleBorder),
      ),
      child: Column(
        children: [
          _FeeRow(
            label: 'Your quote',
            value: formatCurrency(fees['quote']!),
            color: AppColors.black,
          ),
          const SizedBox(height: 6),
          _FeeRow(
            label: 'Platform fee (8%)',
            value: '-${formatCurrency(fees['platformFee']!)}',
            color: AppColors.error,
          ),
          const SizedBox(height: 8),
          const Divider(height: 1),
          const SizedBox(height: 8),
          _FeeRow(
            label: 'You earn',
            value: formatCurrency(fees['estimatedPayout']!),
            color: const Color(0xFF059669),
            isBold: true,
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? hint,
    TextInputType? keyboardType,
    ValueChanged<String>? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.grey,
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          onChanged: onChanged,
          style: const TextStyle(fontSize: 14, color: AppColors.black),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, size: 18, color: AppColors.greyMedium),
            hintText: hint,
            hintStyle: const TextStyle(
                fontSize: 14, color: AppColors.greyMedium),
            filled: true,
            fillColor: AppColors.surfaceVariant,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide:
                  const BorderSide(color: AppColors.primary, width: 1.5),
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            isDense: true,
          ),
        ),
      ],
    );
  }

  Widget _buildMessageField() {
    return TextFormField(
      controller: _messageController,
      maxLines: 6,
      maxLength: 1000,
      textCapitalization: TextCapitalization.sentences,
      onChanged: (_) => setState(() {}),
      style: const TextStyle(fontSize: 14, color: AppColors.black),
      decoration: InputDecoration(
        hintText: 'Introduce yourself and explain why you\'re the best fit...',
        hintStyle:
            const TextStyle(fontSize: 14, color: AppColors.greyMedium),
        counterText: '',
        filled: true,
        fillColor: AppColors.surfaceVariant,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide:
              const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: AppColors.error, width: 1.5),
        ),
        contentPadding: const EdgeInsets.all(16),
      ),
    );
  }
}

class _SelectChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;

  const _SelectChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.border,
            width: 1.5,
          ),
          color: selected
              ? AppColors.primary.withValues(alpha: 0.06)
              : Colors.transparent,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 14,
                color: selected ? AppColors.primary : AppColors.grey,
              ),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: selected ? AppColors.primary : AppColors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeeRow extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final bool isBold;

  const _FeeRow({
    required this.label,
    required this.value,
    required this.color,
    this.isBold = false,
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
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
            color: isBold ? AppColors.black : AppColors.grey,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isBold ? 16 : 13,
            fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
            color: color,
          ),
        ),
      ],
    );
  }
}

class _SuccessOverlay extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
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
                    color: AppColors.primary.withValues(alpha: 0.3),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: const Icon(Icons.check, size: 40, color: Colors.white),
            ),
            const SizedBox(height: 24),
            const Text(
              'Offer Submitted!',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: AppColors.black,
                letterSpacing: -0.44,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'The buyer will be notified of your offer.',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
