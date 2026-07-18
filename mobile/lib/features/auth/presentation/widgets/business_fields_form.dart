import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/providers/upload_provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_input_field.dart';

/// Business-account fields shared between registration and "upgrade to business"
/// flows. The parent owns the EIN, business-name controllers and the
/// business-type + sales-tax-cert URL state via the provided values/callbacks.
class BusinessFieldsForm extends ConsumerStatefulWidget {
  final TextEditingController einController;
  final TextEditingController businessNameController;
  final String? businessType;
  final ValueChanged<String?> onBusinessTypeChanged;
  final String? salesTaxCertificateUrl;
  final ValueChanged<String?> onSalesTaxCertificateChanged;

  /// Deferred-upload mode (registration). When provided, picking a certificate
  /// does NOT upload — it hands the file to the parent, which uploads it after
  /// the account is created (POST /uploads needs an auth token the user only
  /// gets post-registration). When null (the authenticated upgrade flow), the
  /// cert is uploaded immediately on pick. [selectedCertName] drives the
  /// "selected" display in deferred mode.
  final ValueChanged<File>? onCertFilePicked;
  final String? selectedCertName;

  const BusinessFieldsForm({
    super.key,
    required this.einController,
    required this.businessNameController,
    required this.businessType,
    required this.onBusinessTypeChanged,
    required this.salesTaxCertificateUrl,
    required this.onSalesTaxCertificateChanged,
    this.onCertFilePicked,
    this.selectedCertName,
  });

  @override
  ConsumerState<BusinessFieldsForm> createState() => _BusinessFieldsFormState();
}

class _BusinessFieldsFormState extends ConsumerState<BusinessFieldsForm> {
  bool _uploadingCert = false;
  String? _uploadError;

  static const _businessTypes = <_BusinessTypeOption>[
    _BusinessTypeOption('llc', 'LLC'),
    _BusinessTypeOption('corporation', 'Corporation'),
    _BusinessTypeOption('sole_proprietor', 'Sole Proprietor'),
    _BusinessTypeOption('partnership', 'Partnership'),
  ];

  Future<void> _pickAndUploadCert() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (picked == null) return;

    // Deferred mode (registration): hand the file up; the upload runs after the
    // account exists and an auth token is available.
    if (widget.onCertFilePicked != null) {
      setState(() => _uploadError = null);
      widget.onCertFilePicked!(File(picked.path));
      return;
    }

    setState(() {
      _uploadingCert = true;
      _uploadError = null;
    });

    try {
      final uploadService = ref.read(uploadServiceProvider);
      final result = await uploadService.uploadFile(
        file: File(picked.path),
        category: 'verification-docs',
      );
      widget.onSalesTaxCertificateChanged(result.publicUrl);
    } catch (e) {
      debugPrint('[BusinessFieldsForm] cert upload failed: $e');
      setState(() => _uploadError = 'Upload failed. Please try again.');
    } finally {
      if (mounted) setState(() => _uploadingCert = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final deferred = widget.onCertFilePicked != null;
    final hasCert = deferred
        ? widget.selectedCertName != null
        : (widget.salesTaxCertificateUrl != null &&
            widget.salesTaxCertificateUrl!.isNotEmpty);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppInputField(
          controller: widget.einController,
          label: 'EIN (Employer ID)',
          hint: '12-3456789',
          prefixIcon: Icons.badge_outlined,
          keyboardType: TextInputType.text,
          textInputAction: TextInputAction.next,
          validator: (v) {
            if (v == null || v.isEmpty) {
              return 'EIN is required for business accounts';
            }
            if (!RegExp(r'^\d{2}-\d{7}$').hasMatch(v)) {
              return 'EIN must be XX-XXXXXXX';
            }
            return null;
          },
        ),
        const SizedBox(height: 16),
        AppInputField(
          controller: widget.businessNameController,
          label: 'Business Name',
          hint: 'Acme Resale LLC',
          prefixIcon: Icons.storefront_outlined,
          textInputAction: TextInputAction.next,
          validator: (v) {
            if (v == null || v.trim().isEmpty) {
              return 'Business name is required';
            }
            return null;
          },
        ),
        const SizedBox(height: 16),
        Text(
          'Business Type',
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.black,
          ),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          initialValue: widget.businessType,
          decoration: InputDecoration(
            filled: true,
            fillColor: AppColors.surfaceVariant,
            prefixIcon: const Icon(Icons.business_outlined, size: 20),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.border, width: 1.5),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.border, width: 1.5),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
            ),
          ),
          items: _businessTypes
              .map((o) => DropdownMenuItem(value: o.value, child: Text(o.label)))
              .toList(),
          onChanged: widget.onBusinessTypeChanged,
          validator: (v) =>
              (v == null || v.isEmpty) ? 'Business type is required' : null,
        ),
        const SizedBox(height: 16),
        Text(
          'Sales Tax Certificate',
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.black,
          ),
        ),
        const SizedBox(height: 8),
        InkWell(
          key: const ValueKey('sales-tax-cert-upload'),
          onTap: _uploadingCert ? null : _pickAndUploadCert,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: hasCert ? AppColors.primary : AppColors.border,
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  hasCert ? Icons.check_circle : Icons.upload_file_outlined,
                  size: 22,
                  color: hasCert ? AppColors.primary : AppColors.greyMedium,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _uploadingCert
                        ? 'Uploading…'
                        : hasCert
                            ? (deferred
                                ? 'Selected: ${widget.selectedCertName} — tap to replace'
                                : 'Certificate uploaded — tap to replace')
                            : 'Upload sales tax certificate (image)',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: hasCert ? AppColors.primary : AppColors.black,
                    ),
                  ),
                ),
                if (_uploadingCert)
                  const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
              ],
            ),
          ),
        ),
        if (_uploadError != null) ...[
          const SizedBox(height: 6),
          Text(
            _uploadError!,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppColors.error,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
        if (!hasCert) ...[
          const SizedBox(height: 6),
          Text(
            deferred
                ? 'Optional now — you can add it later from Settings. Selling '
                    'stays locked until it\'s verified.'
                : 'A sales-tax certificate is required for business accounts.',
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppColors.greyMedium,
            ),
          ),
        ],
      ],
    );
  }
}

class _BusinessTypeOption {
  final String value;
  final String label;
  const _BusinessTypeOption(this.value, this.label);
}
