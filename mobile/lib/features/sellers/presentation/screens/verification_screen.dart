import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../data/models/seller_profile_model.dart';
import '../../providers/seller_provider.dart';

class VerificationScreen extends ConsumerStatefulWidget {
  const VerificationScreen({super.key});

  @override
  ConsumerState<VerificationScreen> createState() =>
      _VerificationScreenState();
}

class _VerificationScreenState extends ConsumerState<VerificationScreen> {
  String? _selectedType;
  final _documentUrlController = TextEditingController();
  final _licenseNumberController = TextEditingController();
  final _licenseStateController = TextEditingController();
  final _insuranceProviderController = TextEditingController();
  final _insurancePolicyController = TextEditingController();
  DateTime? _licenseExpiry;
  DateTime? _insuranceExpiry;
  bool _isSubmitting = false;
  bool _docFocused = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(sellerProfileProvider.notifier).loadVerificationRequests();
    });
  }

  @override
  void dispose() {
    _documentUrlController.dispose();
    _licenseNumberController.dispose();
    _licenseStateController.dispose();
    _insuranceProviderController.dispose();
    _insurancePolicyController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_selectedType == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a verification type')),
      );
      return;
    }
    if (_documentUrlController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please provide a document URL')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final success =
        await ref.read(sellerProfileProvider.notifier).submitVerification(
              verificationType: _selectedType!,
              documents: [_documentUrlController.text],
              licenseNumber: _licenseNumberController.text.isNotEmpty
                  ? _licenseNumberController.text
                  : null,
              licenseState: _licenseStateController.text.isNotEmpty
                  ? _licenseStateController.text
                  : null,
              licenseExpiry: _selectedType == 'license'
                  ? _isoDate(_licenseExpiry)
                  : null,
              insuranceProvider: _insuranceProviderController.text.isNotEmpty
                  ? _insuranceProviderController.text
                  : null,
              insurancePolicyNumber:
                  _insurancePolicyController.text.isNotEmpty
                      ? _insurancePolicyController.text
                      : null,
              insuranceExpiry: _selectedType == 'insurance'
                  ? _isoDate(_insuranceExpiry)
                  : null,
            );

    if (mounted) {
      setState(() => _isSubmitting = false);
      if (success) {
        _documentUrlController.clear();
        setState(() {
          _selectedType = null;
          _licenseExpiry = null;
          _insuranceExpiry = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Verification request submitted!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(sellerProfileProvider);
    final profile = state.profile;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Verification',
        onBack: () => Navigator.of(context).pop(),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 12),

            // Badge grid
            if (profile != null) _buildBadgeGrid(profile),

            // Pending requests
            if (state.verificationRequests
                .where((r) => r.isPending)
                .isNotEmpty) ...[
              const SizedBox(height: 16),
              _buildPendingRequests(state),
            ],

            const SizedBox(height: 20),

            // New submission form
            _buildSubmissionForm(state),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildBadgeGrid(dynamic profile) {
    final pendingTypes = ref
        .read(sellerProfileProvider)
        .verificationRequests
        .where((r) => r.isPending)
        .map((r) => r.verificationType)
        .toSet();

    final badges = [
      _BadgeData(
        'Email',
        Icons.email_outlined,
        verified: profile.emailVerified,
        pending: false,
      ),
      _BadgeData(
        'Phone',
        Icons.phone_outlined,
        verified: profile.phoneVerified,
        pending: false,
      ),
      _BadgeData(
        'ID',
        Icons.badge_outlined,
        verified: profile.idVerified,
        pending: pendingTypes.contains('id'),
      ),
      _BadgeData(
        'License',
        Icons.workspace_premium,
        verified: profile.licenseVerified,
        pending: pendingTypes.contains('license'),
        credentialStatus: profile.licenseCredentialStatus,
      ),
      _BadgeData(
        'Insurance',
        Icons.shield_outlined,
        verified: profile.insuranceVerified,
        pending: pendingTypes.contains('insurance'),
        credentialStatus: profile.insuranceCredentialStatus,
      ),
      _BadgeData(
        'Background',
        Icons.fact_check_outlined,
        verified: profile.backgroundCheckVerified,
        pending: pendingTypes.contains('background_check'),
      ),
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.1,
      children: badges.map((badge) => _buildBadgeCard(badge)).toList(),
    );
  }

  Widget _statusChip(String text, Color textColor, Color baseColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: baseColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  Widget _buildBadgeCard(_BadgeData badge) {
    List<Color>? gradientColors;
    Color? shadowColor;
    Widget statusWidget;

    if (badge.verified) {
      gradientColors = [const Color(0xFF059669), const Color(0xFF10B981)];
      shadowColor = const Color(0xFF10B981);
      // #382: a still-valid badge can be expiring/expired for the owner even
      // before the daily sweep flips the boolean — surface a renew nudge.
      statusWidget = switch (badge.credentialStatus) {
        CredentialStatus.expiring => _statusChip(
            'Expiring soon', const Color(0xFFD97706), const Color(0xFFF59E0B)),
        CredentialStatus.expired => _statusChip(
            'Expired — renew', const Color(0xFFDC2626), const Color(0xFFEF4444)),
        _ => _statusChip(
            'Verified', const Color(0xFF059669), const Color(0xFF10B981)),
      };
    } else if (badge.pending) {
      gradientColors = [const Color(0xFFD97706), const Color(0xFFF59E0B)];
      shadowColor = const Color(0xFFF59E0B);
      statusWidget = Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: const Color(0xFFF59E0B).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Text(
          'Under Review',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: Color(0xFFD97706),
          ),
        ),
      );
    } else {
      // #382 PR2: a lapsed credential (the daily sweep flipped the boolean false
      // and set the request 'expired') reads back as CredentialStatus.expired even
      // though it's no longer verified. Distinguish it from a never-earned badge
      // with a red "Re-submit" nudge instead of the neutral "Verify".
      final isLapsed = badge.credentialStatus == CredentialStatus.expired;
      final accent =
          isLapsed ? const Color(0xFFDC2626) : AppColors.primary;
      statusWidget = GestureDetector(
        onTap: () {
          final typeMap = {
            'License': 'license',
            'Insurance': 'insurance',
            'ID': 'id',
            'Background': 'background_check',
          };
          final type = typeMap[badge.label];
          if (type != null) {
            setState(() => _selectedType = type);
          }
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          decoration: BoxDecoration(
            color: accent.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: accent.withValues(alpha: 0.3),
              width: 1,
            ),
          ),
          child: Text(
            isLapsed ? 'Re-submit' : 'Verify',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: accent,
            ),
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF0F0F0), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Icon circle
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: (badge.verified || badge.pending)
                  ? LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: gradientColors!,
                    )
                  : null,
              color: (!badge.verified && !badge.pending)
                  ? const Color(0xFFF3F4F6)
                  : null,
              boxShadow: shadowColor != null
                  ? [
                      BoxShadow(
                        color: shadowColor.withValues(alpha: 0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ]
                  : null,
            ),
            child: Icon(
              badge.verified
                  ? Icons.check
                  : badge.pending
                      ? Icons.access_time
                      : badge.icon,
              size: 20,
              color: (badge.verified || badge.pending)
                  ? Colors.white
                  : AppColors.greyMedium,
            ),
          ),
          const SizedBox(height: 10),

          // Badge name
          Text(
            badge.label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 6),

          // Status
          statusWidget,
        ],
      ),
    );
  }

  Widget _buildPendingRequests(SellerProfileState state) {
    final pendingRequests =
        state.verificationRequests.where((r) => r.isPending).toList();

    return SectionCard(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
            child: Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: const Icon(
                    Icons.access_time,
                    size: 15,
                    color: AppColors.warning,
                  ),
                ),
                const SizedBox(width: 10),
                const Text(
                  'Pending Requests',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1F2937),
                  ),
                ),
              ],
            ),
          ),
          ...pendingRequests.map<Widget>((req) {
            final submittedDate = _formatDate(req.createdAt);
            return Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: AppColors.warning.withValues(alpha: 0.15),
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            req.typeDisplay,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Submitted $submittedDate',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.greyMedium,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'Under Review',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFFD97706),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 4),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}';
  }

  Widget _buildSubmissionForm(dynamic state) {
    final types = [
      ('license', 'License', Icons.workspace_premium),
      ('insurance', 'Insurance', Icons.shield_outlined),
      ('id', 'ID', Icons.badge_outlined),
      ('background_check', 'Background', Icons.fact_check_outlined),
    ];

    return SectionCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: const Icon(
                  Icons.add,
                  size: 15,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 10),
              const Text(
                'Start New Verification',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1F2937),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Type selector grid (2x2)
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 2.4,
            children: types.map((t) {
              final isSelected = _selectedType == t.$1;
              return GestureDetector(
                onTap: () => setState(() => _selectedType = t.$1),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.primary.withValues(alpha: 0.04)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected
                          ? AppColors.primary
                          : AppColors.border,
                      width: isSelected ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        t.$3,
                        size: 16,
                        color: isSelected
                            ? AppColors.primary
                            : AppColors.greyMedium,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        t.$2,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isSelected
                              ? AppColors.primary
                              : AppColors.black,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 16),

          // Upload area
          GestureDetector(
            onTap: () {
              // In real app, open file picker
            },
            child: Container(
              width: double.infinity,
              height: 120,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.3),
                  width: 2,
                  strokeAlign: BorderSide.strokeAlignInside,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.primary.withValues(alpha: 0.08),
                    ),
                    child: const Icon(
                      Icons.cloud_upload_outlined,
                      size: 22,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Upload Document',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'JPG, PNG, or PDF up to 10 MB',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.greyMedium,
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Document URL field (fallback for now)
          Focus(
            onFocusChange: (f) => setState(() => _docFocused = f),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              height: 52,
              decoration: BoxDecoration(
                color: _docFocused
                    ? AppColors.primary.withValues(alpha: 0.03)
                    : AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: _docFocused ? AppColors.primary : AppColors.border,
                  width: 1.5,
                ),
              ),
              child: Row(
                children: [
                  const SizedBox(width: 16),
                  Icon(
                    Icons.link,
                    size: 18,
                    color: _docFocused
                        ? AppColors.primary
                        : AppColors.greyMedium,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _documentUrlController,
                      style: const TextStyle(
                        fontSize: 15,
                        color: AppColors.black,
                      ),
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        hintText: 'Or paste document link',
                        hintStyle: TextStyle(
                          fontSize: 15,
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

          // License/insurance specific fields
          if (_selectedType == 'license') ...[
            const SizedBox(height: 12),
            _buildSmallField('License Number', _licenseNumberController),
            const SizedBox(height: 12),
            _buildSmallField('License State', _licenseStateController),
            const SizedBox(height: 12),
            _buildDateField('License Expiry', _licenseExpiry,
                () => _pickExpiry(isLicense: true)),
          ],
          if (_selectedType == 'insurance') ...[
            const SizedBox(height: 12),
            _buildSmallField(
                'Insurance Provider', _insuranceProviderController),
            const SizedBox(height: 12),
            _buildSmallField('Policy Number', _insurancePolicyController),
            const SizedBox(height: 12),
            _buildDateField('Insurance Expiry', _insuranceExpiry,
                () => _pickExpiry(isLicense: false)),
          ],

          if (state.error != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                state.error!,
                style: const TextStyle(fontSize: 13, color: AppColors.error),
              ),
            ),
          ],

          const SizedBox(height: 20),

          // Submit button
          GradientButton(
            text: 'Submit for Review',
            onPressed: _isSubmitting ? null : _submit,
            isLoading: _isSubmitting,
            height: 52,
            borderRadius: 20,
          ),
        ],
      ),
    );
  }

  /// Serialize a picked date as UTC-midnight ISO 8601 so the calendar date the
  /// seller chose is the date stored on the `@db.Date` column (#382).
  String? _isoDate(DateTime? d) => d == null
      ? null
      : DateTime.utc(d.year, d.month, d.day).toIso8601String();

  Future<void> _pickExpiry({required bool isLicense}) async {
    final now = DateTime.now();
    final current = isLicense ? _licenseExpiry : _insuranceExpiry;
    final picked = await showDatePicker(
      context: context,
      initialDate: current ?? DateTime(now.year + 1, now.month, now.day),
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 20),
    );
    if (picked != null) {
      setState(() {
        if (isLicense) {
          _licenseExpiry = picked;
        } else {
          _insuranceExpiry = picked;
        }
      });
    }
  }

  Widget _buildDateField(String label, DateTime? value, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: AppColors.surfaceVariant,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border, width: 1.5),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              const Icon(Icons.event_outlined,
                  size: 18, color: AppColors.greyMedium),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  value == null
                      ? label
                      : '$label: ${_formatDate(value)}, ${value.year}',
                  style: TextStyle(
                    fontSize: 14,
                    color:
                        value == null ? AppColors.greyMedium : AppColors.black,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSmallField(String hint, TextEditingController controller) {
    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: TextField(
          controller: controller,
          style: const TextStyle(fontSize: 14, color: AppColors.black),
          decoration: InputDecoration(
            border: InputBorder.none,
            hintText: hint,
            hintStyle:
                const TextStyle(fontSize: 14, color: AppColors.greyMedium),
            isDense: true,
          ),
        ),
      ),
    );
  }
}

class _BadgeData {
  final String label;
  final IconData icon;
  final bool verified;
  final bool pending;
  final CredentialStatus credentialStatus;

  _BadgeData(
    this.label,
    this.icon, {
    required this.verified,
    required this.pending,
    this.credentialStatus = CredentialStatus.none,
  });
}
