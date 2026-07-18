import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/category_picker.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../data/models/category_request_model.dart';
import '../../providers/seller_provider.dart';

/// Seller add-category (add-major) flow (#338): pick a major (Services or Jobs),
/// multi-select subcategories, supply required docs (URL fields for now; a real
/// file picker is a follow-up) and license details, then submit. The backend
/// router decides the outcome (instant unlock / pending review / rejected).
class SellerAddCategoryScreen extends ConsumerStatefulWidget {
  const SellerAddCategoryScreen({super.key});

  @override
  ConsumerState<SellerAddCategoryScreen> createState() =>
      _SellerAddCategoryScreenState();
}

class _SellerAddCategoryScreenState
    extends ConsumerState<SellerAddCategoryScreen> {
  /// 'services' | 'jobs' — Products is auto-granted, so only these are gateable.
  String? _majorSlug;
  List<CategoryPickerResult> _selectedSubs = [];

  CategoryRequirements? _requirements;
  bool _loadingReqs = false;
  bool _isSubmitting = false;

  final Map<String, TextEditingController> _docControllers = {};
  final _licenseNumberController = TextEditingController();
  final _holderNameController = TextEditingController();
  DateTime? _insuranceExpiry;

  @override
  void dispose() {
    for (final c in _docControllers.values) {
      c.dispose();
    }
    _licenseNumberController.dispose();
    _holderNameController.dispose();
    super.dispose();
  }

  void _selectMajor(String slug) {
    if (_majorSlug == slug) return;
    setState(() {
      _majorSlug = slug;
      _selectedSubs = [];
      _requirements = null;
    });
  }

  Future<void> _pickSubcategories() async {
    final slug = _majorSlug;
    if (slug == null) return;
    final result = await showMultiCategoryPicker(
      context,
      fixedMajorSlug: slug,
      initiallySelected:
          _selectedSubs.map((s) => s.subcategoryId).whereType<String>().toList(),
    );
    if (result == null || result.isEmpty) return;
    setState(() {
      _selectedSubs = result;
      _requirements = null;
    });
    await _loadRequirements();
  }

  Future<void> _loadRequirements() async {
    final ids =
        _selectedSubs.map((s) => s.subcategoryId).whereType<String>().toList();
    if (ids.isEmpty) return;
    setState(() => _loadingReqs = true);
    try {
      final reqs = await ref
          .read(sellerRepositoryProvider)
          .getCategoryRequirements(ids);
      if (!mounted) return;
      // Ensure a URL controller exists for each required doc type, plus the
      // optional insurance certificate when this category recommends it (#381).
      for (final t in reqs.requiredDocTypes) {
        _docControllers.putIfAbsent(t, () => TextEditingController());
      }
      if (reqs.recommendsInsurance) {
        _docControllers.putIfAbsent('insurance', () => TextEditingController());
      }
      setState(() {
        _requirements = reqs;
        _loadingReqs = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingReqs = false);
      _showError('Could not load requirements. Please try again.');
    }
  }

  Future<void> _submit() async {
    final reqs = _requirements;
    if (_selectedSubs.isEmpty || reqs == null) return;

    final authority = _licenseAuthority(reqs);
    final documents = <Map<String, String>>[];
    for (final t in reqs.requiredDocTypes) {
      final url = _docControllers[t]?.text.trim() ?? '';
      if (url.isEmpty) {
        _showError('Please add a link for: ${_docLabel(t, authority: authority)}');
        return;
      }
      documents.add({'type': t, 'url': url});
    }

    // Optional insurance certificate (#381): include it only if provided — an
    // empty field is fine and never blocks the request.
    if (reqs.recommendsInsurance) {
      final insuranceUrl = _docControllers['insurance']?.text.trim() ?? '';
      if (insuranceUrl.isNotEmpty) {
        documents.add({
          'type': 'insurance',
          'url': insuranceUrl,
          // #382: carry the optional cert expiry so the insurance request the
          // backend opens has a date for the lapse sweep to act on.
          if (_insuranceExpiry != null)
            'expiresAt': DateTime.utc(_insuranceExpiry!.year,
                    _insuranceExpiry!.month, _insuranceExpiry!.day)
                .toIso8601String(),
        });
      }
    }

    String? licenseNumber;
    String? holderName;
    if (reqs.needsLicense) {
      licenseNumber = _licenseNumberController.text.trim();
      holderName = _holderNameController.text.trim();
      if (licenseNumber.isEmpty || holderName.isEmpty) {
        _showError('License number and holder name are required.');
        return;
      }
    }

    setState(() => _isSubmitting = true);
    final result =
        await ref.read(sellerProfileProvider.notifier).submitCategoryRequest(
              majorCategoryId: _selectedSubs.first.categoryId,
              subcategoryIds: _selectedSubs
                  .map((s) => s.subcategoryId)
                  .whereType<String>()
                  .toList(),
              documents: documents,
              licenseNumber: licenseNumber,
              holderName: holderName,
            );

    if (!mounted) return;
    setState(() => _isSubmitting = false);
    if (result == null) {
      _showError(ref.read(sellerProfileProvider).error ?? 'Submission failed.');
      return;
    }
    _showOutcome(result);
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: AppColors.error),
    );
  }

  void _showOutcome(CategoryRequestResult result) {
    final (title, message) = result.isApproved
        ? (
            'Access granted',
            'You can now receive requests in these categories.'
          )
        : result.isRejected
            ? (
                'Request not approved',
                'Check your seller profile for details — you can resubmit with corrected info.'
              )
            : (
                'Submitted for review',
                'We will notify you once your request has been reviewed.'
              );
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.pop();
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  /// The license authority for the currently-selected subcategories, if any
  /// (first licensed sub that carries one). Drives Texas-specific field labels
  /// so sellers know exactly which credential to enter (#369).
  String? _licenseAuthority(CategoryRequirements reqs) {
    for (final s in reqs.subcategories) {
      if (s.isLicensed && (s.licenseAuthority?.isNotEmpty ?? false)) {
        return s.licenseAuthority;
      }
    }
    return null;
  }

  String _docLabel(String type, {String? authority}) => switch (type) {
        'id' => 'Government ID',
        'license' => _licenseDocLabel(authority),
        'background_check' => 'Background check',
        _ => type,
      };

  String _licenseDocLabel(String? authority) => switch (authority) {
        'TX_TXDMV' => 'TxDMV registration',
        'TX_TCEQ' => 'Irrigator license',
        _ => 'Professional license',
      };

  String _licenseNumberLabel(String? authority) => switch (authority) {
        'TX_TDLR' => 'TDLR license number',
        'TX_TSBPE' => 'TSBPE (RMP) license number',
        'TX_TDA' => 'TDA license number',
        'TX_TXDMV' => 'TxDMV number',
        'TX_TCEQ' => 'TCEQ irrigator license number',
        _ => 'License number',
      };

  String _licenseNumberHint(String? authority) => switch (authority) {
        'TX_TDLR' => 'e.g. TECL 12345 or TACLA00012345C',
        'TX_TSBPE' => 'Responsible Master Plumber (RMP) number',
        'TX_TDA' => 'Pest control or pesticide applicator license number',
        'TX_TXDMV' => 'e.g. 006123456',
        'TX_TCEQ' => 'Licensed Irrigator (LI) number',
        _ => 'e.g. 123456',
      };

  String _holderLabel(String? authority) => switch (authority) {
        'TX_TXDMV' => 'Registrant / company name',
        _ => 'License holder name',
      };

  String? _authorityHelp(String? authority) => switch (authority) {
        'TX_TDLR' => 'Texas Department of Licensing & Regulation license',
        'TX_TSBPE' => 'Texas State Board of Plumbing Examiners license',
        'TX_TDA' =>
          'Texas Department of Agriculture pest control / pesticide applicator license',
        'TX_TXDMV' =>
          'Texas DMV motor-carrier registration (required to move household goods)',
        'TX_TCEQ' =>
          'Texas Commission on Environmental Quality licensed irrigator (Water Code Ch. 344)',
        _ => null,
      };

  @override
  Widget build(BuildContext context) {
    final reqs = _requirements;
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Add Category',
        onBack: () => context.pop(),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),
            const Text(
              'What do you want to offer?',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.black,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _majorChip('Services', 'services', Icons.build),
                ),
                const SizedBox(width: 10),
                Expanded(child: _majorChip('Jobs', 'jobs', Icons.work)),
              ],
            ),
            const SizedBox(height: 20),

            if (_majorSlug != null) ...[
              const Text(
                'Subcategories',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.black,
                ),
              ),
              const SizedBox(height: 8),
              if (_selectedSubs.isNotEmpty) ...[
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: _selectedSubs
                      .map((s) => Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color:
                                  AppColors.primary.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: AppColors.primary
                                    .withValues(alpha: 0.25),
                              ),
                            ),
                            child: Text(
                              s.subcategoryName ?? '',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppColors.primary,
                              ),
                            ),
                          ))
                      .toList(),
                ),
                const SizedBox(height: 8),
              ],
              _outlineButton(
                label: _selectedSubs.isEmpty
                    ? 'Select subcategories'
                    : 'Edit selection',
                icon: Icons.add,
                onTap: _pickSubcategories,
              ),
              const SizedBox(height: 20),
            ],

            if (_loadingReqs)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: CircularProgressIndicator()),
              ),

            if (reqs != null && _selectedSubs.isNotEmpty) ...[
              _requirementsSection(reqs),
              const SizedBox(height: 24),
              GradientButton(
                text: 'Submit Request',
                onPressed: _isSubmitting ? null : _submit,
                isLoading: _isSubmitting,
              ),
              const SizedBox(height: 32),
            ],
          ],
        ),
      ),
    );
  }

  Widget _requirementsSection(CategoryRequirements reqs) {
    final authority = _licenseAuthority(reqs);
    final authorityHelp = _authorityHelp(authority);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (reqs.allInstant)
          _infoBanner(
            'These subcategories unlock instantly once you submit the required documents.',
          )
        else
          _infoBanner(
            'These subcategories require verification. Submitting sends your request for review (some are reviewed automatically).',
          ),
        const SizedBox(height: 16),

        // Required document links.
        for (final t in reqs.requiredDocTypes) ...[
          _urlField(
            label: '${_docLabel(t, authority: authority)} link',
            controller: _docControllers[t]!,
            hint:
                'Paste a link to your ${_docLabel(t, authority: authority).toLowerCase()}',
          ),
          const SizedBox(height: 16),
        ],

        // Optional insurance certificate — earns the "Insured" badge if
        // provided; never required, never blocks access (#381).
        if (reqs.recommendsInsurance) ...[
          _infoBanner(
            'Optional: add a liability insurance certificate to earn the '
            '"Insured" badge on your profile. You can skip this and still get access.',
          ),
          const SizedBox(height: 12),
          _urlField(
            label: 'Insurance certificate link (optional)',
            controller: _docControllers['insurance']!,
            hint: 'Paste a link to your certificate of insurance (COI)',
          ),
          const SizedBox(height: 12),
          _insuranceExpiryField(),
          const SizedBox(height: 16),
        ],

        // License details when a license is required. Labels are scoped to the
        // issuing Texas authority so sellers enter the right credential (#369).
        if (reqs.needsLicense) ...[
          if (authorityHelp != null) ...[
            _infoBanner(authorityHelp),
            const SizedBox(height: 16),
          ],
          _plainField(
            label: _licenseNumberLabel(authority),
            controller: _licenseNumberController,
            hint: _licenseNumberHint(authority),
          ),
          const SizedBox(height: 16),
          _plainField(
            label: _holderLabel(authority),
            controller: _holderNameController,
            hint: authority == 'TX_TXDMV'
                ? 'Name exactly as on the TxDMV registration'
                : 'Name exactly as on the license',
          ),
          const SizedBox(height: 16),
        ],
      ],
    );
  }

  Widget _majorChip(String label, String slug, IconData icon) {
    final selected = _majorSlug == slug;
    return GestureDetector(
      onTap: () => _selectMajor(slug),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        height: 56,
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withValues(alpha: 0.08)
              : AppColors.surfaceVariant,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.border,
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon,
                size: 18,
                color: selected ? AppColors.primary : AppColors.greyMedium),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: selected ? AppColors.primary : AppColors.black,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _outlineButton({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        height: 44,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppColors.primary.withValues(alpha: 0.3),
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: AppColors.primary),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoBanner(String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, size: 18, color: AppColors.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                  fontSize: 13, color: AppColors.black, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  /// Optional expiry for the insurance certificate (#382). Date-only; serialized
  /// to UTC midnight on submit so the calendar date is what lands on `@db.Date`.
  Widget _insuranceExpiryField() {
    final label = _insuranceExpiry == null
        ? 'Insurance expiry (optional)'
        : 'Insurance expiry: '
            '${_insuranceExpiry!.year}-'
            '${_insuranceExpiry!.month.toString().padLeft(2, '0')}-'
            '${_insuranceExpiry!.day.toString().padLeft(2, '0')}';
    return GestureDetector(
      onTap: () async {
        final now = DateTime.now();
        final picked = await showDatePicker(
          context: context,
          initialDate:
              _insuranceExpiry ?? DateTime(now.year + 1, now.month, now.day),
          firstDate: DateTime(now.year - 1),
          lastDate: DateTime(now.year + 20),
        );
        if (picked != null) {
          setState(() => _insuranceExpiry = picked);
        }
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 52,
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border, width: 1.5),
            ),
            child: Row(
              children: [
                const SizedBox(width: 16),
                const Icon(Icons.event_outlined,
                    size: 18, color: AppColors.greyMedium),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 14,
                      color: _insuranceExpiry == null
                          ? AppColors.greyMedium
                          : AppColors.black,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _urlField({
    required String label,
    required TextEditingController controller,
    String? hint,
  }) {
    return _plainField(
      label: label,
      controller: controller,
      hint: hint,
      icon: Icons.link,
      keyboardType: TextInputType.url,
    );
  }

  Widget _plainField({
    required String label,
    required TextEditingController controller,
    String? hint,
    IconData? icon,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.black,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          height: 52,
          decoration: BoxDecoration(
            color: AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border, width: 1.5),
          ),
          child: Row(
            children: [
              const SizedBox(width: 16),
              if (icon != null) ...[
                Icon(icon, size: 18, color: AppColors.greyMedium),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: TextField(
                  controller: controller,
                  keyboardType: keyboardType,
                  style:
                      const TextStyle(fontSize: 15, color: AppColors.black),
                  decoration: InputDecoration(
                    border: InputBorder.none,
                    hintText: hint,
                    hintStyle: const TextStyle(
                        fontSize: 15, color: AppColors.greyMedium),
                    contentPadding: const EdgeInsets.only(right: 16),
                    isDense: true,
                  ),
                ),
              ),
              if (icon == null) const SizedBox(width: 16),
            ],
          ),
        ),
      ],
    );
  }
}
