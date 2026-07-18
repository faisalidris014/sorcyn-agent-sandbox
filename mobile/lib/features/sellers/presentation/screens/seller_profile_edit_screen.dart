import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../providers/seller_provider.dart';
import '../widgets/business_hours_editor.dart';

/// Edit the seller's business profile fields (NOT categories — those are
/// managed via the add-category flow). Fixes #298 (the edit pencil previously
/// routed to a nonexistent `/seller/profile/edit`).
class SellerProfileEditScreen extends ConsumerStatefulWidget {
  const SellerProfileEditScreen({super.key});

  @override
  ConsumerState<SellerProfileEditScreen> createState() =>
      _SellerProfileEditScreenState();
}

class _SellerProfileEditScreenState
    extends ConsumerState<SellerProfileEditScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _businessNameController;
  late final TextEditingController _bioController;
  late final TextEditingController _radiusController;
  late final TextEditingController _yearsController;
  late final TextEditingController _websiteController;

  bool _isSubmitting = false;
  bool _businessNameFocused = false;
  bool _bioFocused = false;
  bool _radiusFocused = false;
  bool _yearsFocused = false;
  bool _websiteFocused = false;

  Map<String, dynamic>? _initialBusinessHours;
  Map<String, dynamic> _businessHours = const {};

  @override
  void initState() {
    super.initState();
    final profile = ref.read(sellerProfileProvider).profile;
    _businessNameController =
        TextEditingController(text: profile?.businessName ?? '');
    _bioController = TextEditingController(text: profile?.bio ?? '');
    _radiusController = TextEditingController(
        text: (profile?.serviceRadiusMiles ?? 25).toString());
    _yearsController = TextEditingController(
        text: profile?.yearsExperience?.toString() ?? '');
    _websiteController =
        TextEditingController(text: profile?.businessWebsite ?? '');
    _initialBusinessHours = profile?.businessHours;
  }

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
        await ref.read(sellerProfileProvider.notifier).updateProfile(
              businessName: _businessNameController.text.trim(),
              bio: _bioController.text.trim(),
              serviceRadiusMiles: int.tryParse(_radiusController.text),
              yearsExperience: int.tryParse(_yearsController.text),
              businessWebsite: _websiteController.text.trim(),
              businessHours: _businessHours,
            );

    if (!mounted) return;
    setState(() => _isSubmitting = false);
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile updated'),
          backgroundColor: AppColors.success,
        ),
      );
      context.pop();
    } else {
      final error = ref.read(sellerProfileProvider).error;
      if (error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error), backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Edit Profile',
        onBack: () => context.pop(),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              _field(
                label: 'Business Name (optional)',
                controller: _businessNameController,
                focused: _businessNameFocused,
                onFocusChange: (f) => setState(() => _businessNameFocused = f),
                icon: Icons.storefront,
                hint: 'Your business name',
              ),
              const SizedBox(height: 16),
              _textArea(
                label: 'Bio / Description',
                controller: _bioController,
                focused: _bioFocused,
                onFocusChange: (f) => setState(() => _bioFocused = f),
                maxLength: 500,
                hint: 'Describe your experience and what sets you apart...',
              ),
              const SizedBox(height: 16),
              _field(
                label: 'Service Radius (miles)',
                controller: _radiusController,
                focused: _radiusFocused,
                onFocusChange: (f) => setState(() => _radiusFocused = f),
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
              _field(
                label: 'Years of Experience (optional)',
                controller: _yearsController,
                focused: _yearsFocused,
                onFocusChange: (f) => setState(() => _yearsFocused = f),
                icon: Icons.work_outline,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              _field(
                label: 'Business Website (optional)',
                controller: _websiteController,
                focused: _websiteFocused,
                onFocusChange: (f) => setState(() => _websiteFocused = f),
                icon: Icons.link,
                keyboardType: TextInputType.url,
                hint: 'https://yourbusiness.com',
              ),
              const SizedBox(height: 24),
              // Seller categories — not edited inline (categories stay
              // verification-gated). Entry point into the add-category flow so
              // a seller can request Services/Jobs from edit too (#338 / #4).
              const Text(
                'Seller categories',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.black,
                ),
              ),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: () => context.push('/seller/profile/add-category'),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border, width: 1.5),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.add_circle_outline,
                          size: 18, color: AppColors.primary),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Add Services or Jobs categories',
                          style:
                              TextStyle(fontSize: 14, color: AppColors.black),
                        ),
                      ),
                      Icon(Icons.chevron_right,
                          size: 20, color: AppColors.greyMedium),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              BusinessHoursEditor(
                initial: _initialBusinessHours,
                defaultWeekdaysOpen: false,
                onChanged: (hours) => _businessHours = hours,
              ),
              const SizedBox(height: 32),
              GradientButton(
                text: 'Save Changes',
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

  Widget _field({
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
                Icon(icon,
                    size: 18,
                    color:
                        focused ? AppColors.primary : AppColors.greyMedium),
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

  Widget _textArea({
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
              textCapitalization: TextCapitalization.sentences,
              style: const TextStyle(fontSize: 15, color: AppColors.black),
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
