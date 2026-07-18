import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../auth/presentation/widgets/business_fields_form.dart';
import '../../../auth/providers/auth_provider.dart';

class UpgradeToBusinessScreen extends ConsumerStatefulWidget {
  const UpgradeToBusinessScreen({super.key});

  @override
  ConsumerState<UpgradeToBusinessScreen> createState() =>
      _UpgradeToBusinessScreenState();
}

class _UpgradeToBusinessScreenState
    extends ConsumerState<UpgradeToBusinessScreen> {
  final _formKey = GlobalKey<FormState>();
  final _einController = TextEditingController();
  final _businessNameController = TextEditingController();
  String? _businessType;
  String? _salesTaxCertificateUrl;
  bool _submitting = false;

  @override
  void dispose() {
    _einController.dispose();
    _businessNameController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_salesTaxCertificateUrl == null || _salesTaxCertificateUrl!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please upload your sales tax certificate'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      await ref.read(authProvider.notifier).upgradeToBusiness(
            ein: _einController.text.trim(),
            businessName: _businessNameController.text.trim(),
            businessType: _businessType!,
            salesTaxCertificateUrl: _salesTaxCertificateUrl!,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Upgraded to business account')),
      );
      context.pop();
    } catch (_) {
      if (!mounted) return;
      final error = ref.read(authProvider).error ??
          'Upgrade failed. Please try again.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error),
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
          'Upgrade to Business',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: AppColors.black,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Unlock inventory management, business storefront, and bulk listings. Business accounts need an EIN and a sales-tax certificate to publish.',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: AppColors.greyMedium,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 24),
                BusinessFieldsForm(
                  einController: _einController,
                  businessNameController: _businessNameController,
                  businessType: _businessType,
                  onBusinessTypeChanged: (v) =>
                      setState(() => _businessType = v),
                  salesTaxCertificateUrl: _salesTaxCertificateUrl,
                  onSalesTaxCertificateChanged: (v) =>
                      setState(() => _salesTaxCertificateUrl = v),
                ),
                const SizedBox(height: 28),
                GradientButton(
                  text: 'Upgrade Account',
                  onPressed: _handleSubmit,
                  isLoading: _submitting,
                ),
                const SizedBox(height: 8),
                Text(
                  'Your account will be reviewed by our team within 24 hours. You can publish listings once verification is pending.',
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
        ),
      ),
    );
  }
}
