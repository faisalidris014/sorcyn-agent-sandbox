import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/providers/upload_provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../sellers/data/models/seller_profile_model.dart';
import '../../../sellers/providers/seller_provider.dart';

/// Business Profile → Sales-Tax Certificate management (issue #229).
///
/// Lets a business account view the sales-tax certificate it uploaded at
/// registration, see its verification status (Pending / Verified / Rejected),
/// and upload one for the first time or replace an existing one. Replacing the
/// cert re-marks it pending server-side (PATCH /users/me/business-profile), so
/// after a successful replace the status reloads as Pending.
class BusinessProfileScreen extends ConsumerStatefulWidget {
  const BusinessProfileScreen({super.key});

  @override
  ConsumerState<BusinessProfileScreen> createState() =>
      _BusinessProfileScreenState();
}

class _BusinessProfileScreenState extends ConsumerState<BusinessProfileScreen> {
  bool _loading = true;
  bool _submitting = false;
  String? _loadError;
  SellerProfile? _profile;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final profile =
          await ref.read(sellerRepositoryProvider).getMySellerProfile();
      if (!mounted) return;
      setState(() {
        _profile = profile;
        _loading = false;
      });
    } catch (e) {
      // A business account that never finished cert upload has no seller
      // profile yet → GET /sellers/me 404s. Treat that as the "no cert"
      // first-time-upload state rather than a hard error.
      if (_isNotFound(e)) {
        if (!mounted) return;
        setState(() {
          _profile = null;
          _loading = false;
        });
        return;
      }
      if (!mounted) return;
      setState(() {
        _loadError = 'Could not load your business profile. Pull to retry.';
        _loading = false;
      });
    }
  }

  bool _isNotFound(Object e) => e.toString().contains('404');

  Future<void> _pickReplaceUpload() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (picked == null) return;

    setState(() => _submitting = true);
    try {
      final upload = await ref.read(uploadServiceProvider).uploadFile(
            file: File(picked.path),
            category: 'verification-docs',
          );
      await ref.read(authProvider.notifier).updateBusinessProfile(
            salesTaxCertificateUrl: upload.publicUrl,
          );
      // Reload to surface the now-pending status from the backend.
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Certificate submitted — verification pending'),
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Upload failed. Please try again.'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.chevron_left, color: AppColors.black),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Sales Tax Certificate',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: AppColors.black,
          ),
        ),
      ),
      body: SafeArea(child: _buildBody()),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_loadError != null) {
      return RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 80),
            Icon(Icons.cloud_off_outlined,
                size: 40, color: AppColors.greyMedium),
            const SizedBox(height: 12),
            Text(
              _loadError!,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.greyMedium,
              ),
            ),
          ],
        ),
      );
    }

    final status = _profile?.salesTaxCertStatus ?? SalesTaxCertStatus.none;
    final hasCert = _profile?.hasSalesTaxCertificate ?? false;

    return RefreshIndicator(
      onRefresh: _load,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Your sales-tax certificate confirms your business is registered '
              'to collect sales tax. It is reviewed by our team before your '
              'business can sell.',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.greyMedium,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 20),
            if (hasCert) ...[
              _StatusBadge(status: status),
              const SizedBox(height: 16),
              _CertPreview(url: _profile!.salesTaxCertificateUrl!),
              if (status == SalesTaxCertStatus.rejected &&
                  (_profile!.salesTaxRejectionReason?.isNotEmpty ?? false)) ...[
                const SizedBox(height: 16),
                _RejectionReason(reason: _profile!.salesTaxRejectionReason!),
              ],
              const SizedBox(height: 28),
              GradientButton(
                text: 'Replace Certificate',
                icon: Icons.refresh,
                onPressed: _submitting ? null : _pickReplaceUpload,
                isLoading: _submitting,
              ),
            ] else ...[
              _EmptyCert(),
              const SizedBox(height: 24),
              GradientButton(
                text: 'Upload Certificate',
                icon: Icons.upload_file_outlined,
                onPressed: _submitting ? null : _pickReplaceUpload,
                isLoading: _submitting,
              ),
            ],
            const SizedBox(height: 12),
            Text(
              hasCert
                  ? 'Replacing your certificate resets verification to pending '
                      'while our team reviews the new document.'
                  : 'Selling stays locked until your certificate is verified.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: AppColors.greyMedium,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final SalesTaxCertStatus status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final (label, color, icon) = switch (status) {
      SalesTaxCertStatus.verified => (
          'Verified',
          AppColors.success,
          Icons.verified_outlined,
        ),
      SalesTaxCertStatus.rejected => (
          'Rejected',
          AppColors.error,
          Icons.cancel_outlined,
        ),
      _ => ('Pending Review', AppColors.warning, Icons.hourglass_top_outlined),
    };

    return Container(
      key: const ValueKey('sales-tax-status-badge'),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 8),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _CertPreview extends StatelessWidget {
  final String url;
  const _CertPreview({required this.url});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceVariant,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        constraints: const BoxConstraints(minHeight: 180, maxHeight: 320),
        width: double.infinity,
        child: Image.network(
          url,
          fit: BoxFit.contain,
          loadingBuilder: (context, child, progress) {
            if (progress == null) return child;
            return const SizedBox(
              height: 180,
              child: Center(child: CircularProgressIndicator()),
            );
          },
          errorBuilder: (context, error, stack) => const SizedBox(
            height: 180,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.description_outlined,
                      size: 36, color: AppColors.greyMedium),
                  SizedBox(height: 8),
                  Text(
                    'Certificate on file',
                    style: TextStyle(color: AppColors.greyMedium),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RejectionReason extends StatelessWidget {
  final String reason;
  const _RejectionReason({required this.reason});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Reason for rejection',
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: AppColors.error,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            reason,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: AppColors.black,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyCert extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Icon(Icons.upload_file_outlined,
              size: 40, color: AppColors.greyMedium),
          const SizedBox(height: 12),
          Text(
            'No certificate uploaded yet',
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.black,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Upload your sales-tax certificate to get verified.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: AppColors.greyMedium,
            ),
          ),
        ],
      ),
    );
  }
}
