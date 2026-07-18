import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../providers/seller_provider.dart';
import '../widgets/business_hours_editor.dart';

class SellerProfileSetupScreen extends ConsumerStatefulWidget {
  const SellerProfileSetupScreen({super.key});

  @override
  ConsumerState<SellerProfileSetupScreen> createState() =>
      _SellerProfileSetupScreenState();
}

class _SellerProfileSetupScreenState
    extends ConsumerState<SellerProfileSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _businessNameController = TextEditingController();
  final _bioController = TextEditingController();
  final _radiusController = TextEditingController(text: '25');
  final _yearsController = TextEditingController();
  final _websiteController = TextEditingController();

  bool _isSubmitting = false;

  // Availability captured by the BusinessHoursEditor (defaults emitted on init).
  Map<String, dynamic> _businessHours = const {};

  // Focus states
  bool _businessNameFocused = false;
  bool _bioFocused = false;
  bool _radiusFocused = false;
  bool _yearsFocused = false;
  bool _websiteFocused = false;

  @override
  void dispose() {
    _businessNameController.dispose();
    _bioController.dispose();
    _radiusController.dispose();
    _yearsController.dispose();
    _websiteController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final success =
        await ref.read(sellerProfileProvider.notifier).createProfile(
              businessName: _businessNameController.text.isNotEmpty
                  ? _businessNameController.text
                  : null,
              bio: _bioController.text.isNotEmpty ? _bioController.text : null,
              serviceRadiusMiles:
                  int.tryParse(_radiusController.text) ?? 25,
              yearsExperience: int.tryParse(_yearsController.text),
              businessWebsite: _websiteController.text.isNotEmpty
                  ? _websiteController.text
                  : null,
              businessHours: _businessHours.isNotEmpty ? _businessHours : null,
            );

    if (!mounted) return;
    setState(() => _isSubmitting = false);
    if (!success) {
      final error = ref.read(sellerProfileProvider).error;
      if (error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error), backgroundColor: AppColors.error),
        );
      }
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Seller profile created!'),
        backgroundColor: AppColors.success,
      ),
    );

    // Profile now exists (Products auto-granted) → the onboarding gate releases.
    // Offer to start the verified add-category flow for Services/Jobs now —
    // it needs the profile to exist, so this is the earliest it can run — or
    // skip straight into the app. (#338 / #4 add-category from setup.)
    final addNow = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add seller categories?'),
        content: const Text(
          'You can sell Products right away. Add Services or Jobs categories '
          'now — each needs license or insurance verification — or do it later '
          'from your seller profile.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Skip for now'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Add categories'),
          ),
        ],
      ),
    );

    if (!mounted) return;
    if (addNow == true) {
      context.go('/seller/profile/add-category');
    } else {
      context.go('/dashboard');
    }
  }

  Future<void> _confirmLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Log out?'),
        content: const Text(
          'You can finish setting up your seller profile next time you log in.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Log out'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(authProvider.notifier).logout();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Set Up Seller Profile',
        // Only show back when there's somewhere to pop to. When the onboarding
        // gate redirected here (replacing the stack), canPop is false — show no
        // back so the seller can't escape into an unscoped feed, but always
        // offer Log out so they're never trapped.
        onBack: context.canPop() ? () => context.pop() : null,
        actions: [
          TextButton(
            onPressed: _isSubmitting ? null : _confirmLogout,
            child: const Text(
              'Log out',
              style: TextStyle(
                color: AppColors.grey,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              const Text(
                'Tell buyers about yourself and your services.',
                style: TextStyle(fontSize: 14, color: AppColors.grey),
              ),
              const SizedBox(height: 24),

              _buildField(
                label: 'Business Name (optional)',
                controller: _businessNameController,
                focused: _businessNameFocused,
                onFocusChange: (f) =>
                    setState(() => _businessNameFocused = f),
                icon: Icons.storefront,
                hint: 'Your business name',
              ),
              const SizedBox(height: 16),

              _buildTextArea(
                label: 'Bio / Description',
                controller: _bioController,
                focused: _bioFocused,
                onFocusChange: (f) => setState(() => _bioFocused = f),
                maxLength: 500,
                hint:
                    'Describe your experience, skills, and what sets you apart...',
              ),
              const SizedBox(height: 16),

              // Seller categories — Products is auto-granted on profile
              // creation (#301 Phase 1); Services/Jobs are verification-gated
              // and offered right after create via the add-category flow
              // (#338 / #4). They can't be requested before the profile exists.
              const Text(
                'Seller categories',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.black,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.2),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Row(
                      children: [
                        Icon(Icons.check_circle,
                            size: 18, color: AppColors.primary),
                        SizedBox(width: 10),
                        Text(
                          'Products',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.black,
                          ),
                        ),
                        SizedBox(width: 6),
                        Text(
                          'granted automatically',
                          style: TextStyle(fontSize: 12, color: AppColors.grey),
                        ),
                      ],
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Add Services or Jobs categories right after you create '
                      'your profile. Each requires license or insurance '
                      'verification before it unlocks.',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.black,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              _buildField(
                label: 'Service Radius (miles)',
                controller: _radiusController,
                focused: _radiusFocused,
                onFocusChange: (f) =>
                    setState(() => _radiusFocused = f),
                icon: Icons.radar,
                keyboardType: TextInputType.number,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Required';
                  final radius = int.tryParse(v);
                  if (radius == null || radius < 1 || radius > 500) {
                    return 'Between 1 and 500 miles';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              _buildField(
                label: 'Years of Experience (optional)',
                controller: _yearsController,
                focused: _yearsFocused,
                onFocusChange: (f) =>
                    setState(() => _yearsFocused = f),
                icon: Icons.work_outline,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),

              _buildField(
                label: 'Business Website (optional)',
                controller: _websiteController,
                focused: _websiteFocused,
                onFocusChange: (f) =>
                    setState(() => _websiteFocused = f),
                icon: Icons.link,
                keyboardType: TextInputType.url,
                hint: 'https://yourbusiness.com',
              ),
              const SizedBox(height: 20),

              // Real availability editor (#298 parity / Q4). Replaces the old
              // static "Mon-Fri, 9am-5pm" stub and the no-op Emergency Services
              // toggle. Emits the businessHours map the backend already accepts.
              BusinessHoursEditor(
                onChanged: (hours) => _businessHours = hours,
              ),
              const SizedBox(height: 32),

              GradientButton(
                text: 'Create Seller Profile',
                onPressed: _isSubmitting ? null : _submit,
                isLoading: _isSubmitting,
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField({
    required String label,
    required TextEditingController controller,
    required bool focused,
    required ValueChanged<bool> onFocusChange,
    required IconData icon,
    String? Function(String?)? validator,
    TextInputType? keyboardType,
    String? hint,
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
        Focus(
          onFocusChange: onFocusChange,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            height: 52,
            decoration: BoxDecoration(
              color: focused
                  ? AppColors.primary.withValues(alpha: 0.03)
                  : AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: focused ? AppColors.primary : AppColors.border,
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                const SizedBox(width: 16),
                Icon(
                  icon,
                  size: 18,
                  color: focused ? AppColors.primary : AppColors.greyMedium,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: controller,
                    validator: validator,
                    keyboardType: keyboardType,
                    style: const TextStyle(
                        fontSize: 15, color: AppColors.black),
                    decoration: InputDecoration(
                      border: InputBorder.none,
                      hintText: hint,
                      hintStyle: const TextStyle(
                          fontSize: 15, color: AppColors.greyMedium),
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
    );
  }

  Widget _buildTextArea({
    required String label,
    required TextEditingController controller,
    required bool focused,
    required ValueChanged<bool> onFocusChange,
    required int maxLength,
    String? hint,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.black,
              ),
            ),
            Text(
              '${controller.text.length}/$maxLength',
              style: const TextStyle(
                  fontSize: 11, color: AppColors.greyMedium),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Focus(
          onFocusChange: onFocusChange,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            decoration: BoxDecoration(
              color: focused
                  ? AppColors.primary.withValues(alpha: 0.03)
                  : AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: focused ? AppColors.primary : AppColors.border,
                width: 1.5,
              ),
            ),
            child: TextFormField(
              controller: controller,
              maxLines: 4,
              maxLength: maxLength,
              onChanged: (_) => setState(() {}),
              textCapitalization: TextCapitalization.sentences,
              style:
                  const TextStyle(fontSize: 15, color: AppColors.black),
              decoration: InputDecoration(
                border: InputBorder.none,
                hintText: hint,
                hintStyle: const TextStyle(
                    fontSize: 15, color: AppColors.greyMedium),
                contentPadding: const EdgeInsets.all(16),
                counterText: '',
              ),
            ),
          ),
        ),
      ],
    );
  }
}
