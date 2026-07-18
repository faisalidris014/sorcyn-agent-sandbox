import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/providers/upload_provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/validators.dart';
import '../../../../shared/widgets/app_input_field.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../providers/auth_provider.dart';
import '../widgets/business_fields_form.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _zipController = TextEditingController();
  final _einController = TextEditingController();
  final _businessNameController = TextEditingController();
  bool _obscurePassword = true;
  String _accountType = 'buyer';
  String _password = '';
  bool _isBusiness = false;
  String? _businessType;
  // Cert is picked locally and uploaded only after the account exists (POST
  // /uploads needs an auth token). See _handleRegister.
  File? _certFile;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    _zipController.dispose();
    _einController.dispose();
    _businessNameController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    final messenger = ScaffoldMessenger.of(context);

    if (_isBusiness) {
      // The cert is optional at signup. If it's missing, confirm the
      // limited-access tradeoff and register without it — the user can add it
      // later from Settings. With a cert, we run the two-step upload below
      // (the cert is picked locally because POST /uploads needs an auth token
      // we only get after the account exists).
      if (_certFile == null) {
        final proceed = await _confirmProceedWithoutCert();
        if (proceed != true) return;
        try {
          await ref.read(authProvider.notifier).register(
                email: _emailController.text.trim(),
                password: _passwordController.text,
                firstName: _firstNameController.text.trim(),
                lastName: _lastNameController.text.trim(),
                phone: _phoneController.text.trim().isEmpty
                    ? null
                    : _phoneController.text.trim(),
                // Business accounts always buy and sell.
                accountType: 'both',
                locationZip: _zipController.text.trim().isEmpty
                    ? null
                    : _zipController.text.trim(),
                isBusiness: true,
                ein: _einController.text.trim(),
                businessName: _businessNameController.text.trim(),
                businessType: _businessType,
              );
          // Router redirect handles navigation. Account is in limited mode
          // until the cert is uploaded + verified (publishing stays gated
          // server-side).
        } catch (_) {
          _showAuthError(messenger);
        }
        return;
      }

      try {
        // Two-step: create the account, then upload + attach the cert once
        // authenticated. Router redirect is held until the flow completes.
        final attached =
            await ref.read(authProvider.notifier).registerBusiness(
                  email: _emailController.text.trim(),
                  password: _passwordController.text,
                  firstName: _firstNameController.text.trim(),
                  lastName: _lastNameController.text.trim(),
                  phone: _phoneController.text.trim().isEmpty
                      ? null
                      : _phoneController.text.trim(),
                  // Business accounts always buy and sell.
                  accountType: 'both',
                  locationZip: _zipController.text.trim().isEmpty
                      ? null
                      : _zipController.text.trim(),
                  ein: _einController.text.trim(),
                  businessName: _businessNameController.text.trim(),
                  businessType: _businessType!,
                  uploadCert: () async {
                    final result =
                        await ref.read(uploadServiceProvider).uploadFile(
                              file: _certFile!,
                              category: 'verification-docs',
                            );
                    return result.publicUrl;
                  },
                );
        // Account created; router redirect handles navigation. If the cert
        // step failed, the user is logged in but must finish it from Settings
        // (publishing stays gated server-side until the cert is submitted).
        if (!attached && mounted) {
          messenger.showSnackBar(
            const SnackBar(
              content: Text(
                'Account created, but the certificate upload failed. '
                'You can add it later from Settings.',
              ),
              backgroundColor: AppColors.warning,
            ),
          );
        }
      } catch (_) {
        _showAuthError(messenger);
      }
      return;
    }

    try {
      await ref.read(authProvider.notifier).register(
            email: _emailController.text.trim(),
            password: _passwordController.text,
            firstName: _firstNameController.text.trim(),
            lastName: _lastNameController.text.trim(),
            phone: _phoneController.text.trim().isEmpty
                ? null
                : _phoneController.text.trim(),
            accountType: _accountType,
            locationZip: _zipController.text.trim().isEmpty
                ? null
                : _zipController.text.trim(),
          );
      // Router redirect handles navigation (to verify-email or home)
    } catch (_) {
      _showAuthError(messenger);
    }
  }

  void _showAuthError(ScaffoldMessengerState messenger) {
    if (!mounted) return;
    final error = ref.read(authProvider).error;
    if (error != null) {
      messenger.showSnackBar(
        SnackBar(
          content: Text(error),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  /// Asks the user to confirm proceeding without a sales-tax certificate.
  /// Returns true to register now (limited access), false/null to go back and
  /// upload it first.
  Future<bool?> _confirmProceedWithoutCert() {
    return showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: Colors.white,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Add your certificate later?',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.black,
          ),
        ),
        content: Text(
          'You can start exploring Sorcyn right away. Until your sales-tax '
          'certificate is uploaded and verified, your business account stays '
          'in limited mode — you can browse and shop, but listing items and '
          'selling stay locked. Add it anytime from Settings; verification '
          'usually takes about a day.',
          style: GoogleFonts.inter(
            fontSize: 14,
            height: 1.5,
            color: AppColors.grey,
          ),
        ),
        actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text(
              'Upload now',
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: Text(
              'Continue with limited access',
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.greyMedium,
              ),
            ),
          ),
        ],
      ),
    );
  }

  int get _passwordStrength {
    int s = 0;
    if (_password.length >= 8) s++;
    if (_password.length >= 12) s++;
    if (_password.contains(RegExp(r'[A-Z]'))) s++;
    if (_password.contains(RegExp(r'[0-9]'))) s++;
    if (_password.contains(RegExp(r'[^A-Za-z0-9]'))) s++;
    if (s <= 1) return 1;
    if (s == 2) return 2;
    if (s == 3) return 3;
    return 4;
  }

  String get _strengthLabel {
    return switch (_passwordStrength) {
      1 => 'Weak',
      2 => 'Fair',
      3 => 'Good',
      _ => 'Strong',
    };
  }

  Color get _strengthColor {
    return switch (_passwordStrength) {
      1 => AppColors.error,
      2 => AppColors.warning,
      3 => AppColors.primary,
      _ => AppColors.secondaryPurple,
    };
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 16),

                  // Back button
                  Align(
                    alignment: Alignment.centerLeft,
                    child: _BackButton(onTap: () => context.pop()),
                  ),
                  const SizedBox(height: 20),

                  // Heading
                  Text(
                    'Create Account',
                    style: GoogleFonts.inter(
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      color: AppColors.black,
                      letterSpacing: -0.56,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    'Join Sorcyn and start today',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: AppColors.grey,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // First Name
                  AppInputField(
                    controller: _firstNameController,
                    label: 'First Name',
                    hint: 'Jane',
                    prefixIcon: Icons.person_outline_rounded,
                    textInputAction: TextInputAction.next,
                    validator: (v) => Validators.name(v, 'First name'),
                  ),
                  const SizedBox(height: 16),

                  // Last Name
                  AppInputField(
                    controller: _lastNameController,
                    label: 'Last Name',
                    hint: 'Doe',
                    prefixIcon: Icons.person_outline_rounded,
                    textInputAction: TextInputAction.next,
                    validator: (v) => Validators.name(v, 'Last name'),
                  ),
                  const SizedBox(height: 16),

                  // Email
                  AppInputField(
                    controller: _emailController,
                    label: 'Email Address',
                    hint: 'you@example.com',
                    prefixIcon: Icons.mail_outline_rounded,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    validator: Validators.email,
                  ),
                  const SizedBox(height: 16),

                  // Password
                  AppInputField(
                    controller: _passwordController,
                    label: 'Password',
                    hint: '••••••••',
                    prefixIcon: Icons.lock_outline_rounded,
                    obscureText: _obscurePassword,
                    textInputAction: TextInputAction.next,
                    validator: Validators.password,
                    onChanged: (v) => setState(() => _password = v),
                    suffixWidget: GestureDetector(
                      onTap: () =>
                          setState(() => _obscurePassword = !_obscurePassword),
                      child: Icon(
                        _obscurePassword
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                        size: 20,
                        color: AppColors.greyMedium,
                      ),
                    ),
                  ),

                  // Password strength indicator
                  if (_password.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: List.generate(4, (i) {
                        final active = i < _passwordStrength;
                        return Expanded(
                          child: Container(
                            height: 4,
                            margin: EdgeInsets.only(right: i < 3 ? 6 : 0),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(4),
                              color: active ? _strengthColor : AppColors.border,
                            ),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _strengthLabel,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: _strengthColor,
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),

                  // Phone
                  AppInputField(
                    controller: _phoneController,
                    label: 'Phone Number',
                    hint: '+1 (555) 000-0000',
                    prefixIcon: Icons.phone_outlined,
                    keyboardType: TextInputType.phone,
                    textInputAction: TextInputAction.next,
                    validator: Validators.phone,
                  ),
                  const SizedBox(height: 16),

                  // ZIP Code
                  AppInputField(
                    controller: _zipController,
                    label: 'ZIP Code',
                    hint: '90210',
                    prefixIcon: Icons.location_on_outlined,
                    keyboardType: TextInputType.number,
                    textInputAction: TextInputAction.done,
                    validator: Validators.zip,
                  ),
                  const SizedBox(height: 24),

                  // Account Type — hidden for business accounts, which are
                  // always registered as `both` (see _handleRegister). We don't
                  // mutate _accountType here, so toggling Business back off
                  // restores the user's previous Buy/Sell/Both selection.
                  if (!_isBusiness) ...[
                    Text(
                      'Account Type',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.black,
                      ),
                    ),
                    const SizedBox(height: 10),
                    _AccountTypeSelector(
                      value: _accountType,
                      onChanged: (v) => setState(() => _accountType = v),
                    ),
                  ],

                  // Business toggle — backend Zod superRefine is the authoritative
                  // gate; client-side validation is defensive.
                  const SizedBox(height: 16),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      'Business account',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    subtitle: Text(
                      'For resellers and bulk sellers. EIN required; add your '
                      'sales-tax cert now or later to unlock selling.',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppColors.greyMedium,
                      ),
                    ),
                    value: _isBusiness,
                    onChanged: (v) => setState(() => _isBusiness = v),
                    activeThumbColor: AppColors.primary,
                  ),
                  if (_isBusiness) ...[
                    const SizedBox(height: 8),
                    BusinessFieldsForm(
                      einController: _einController,
                      businessNameController: _businessNameController,
                      businessType: _businessType,
                      onBusinessTypeChanged: (v) =>
                          setState(() => _businessType = v),
                      // Deferred-upload mode: pick the cert now, upload after
                      // the account is created (see _handleRegister).
                      salesTaxCertificateUrl: null,
                      onSalesTaxCertificateChanged: (_) {},
                      onCertFilePicked: (f) => setState(() => _certFile = f),
                      selectedCertName: _certFile?.path.split('/').last,
                    ),
                  ],
                  const SizedBox(height: 24),

                  // Terms text
                  Text.rich(
                    TextSpan(
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppColors.greyMedium,
                        height: 1.6,
                      ),
                      children: [
                        const TextSpan(text: 'By creating an account you agree to our '),
                        TextSpan(
                          text: 'Terms of Service',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                        const TextSpan(text: ' and '),
                        TextSpan(
                          text: 'Privacy Policy',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),

                  // Create Account button — label flips to "Continue" for
                  // business registrations per PRD US-C-001.
                  GradientButton(
                    text: _isBusiness ? 'Continue' : 'Create Account',
                    onPressed: _handleRegister,
                    isLoading: authState.isLoading,
                  ),
                  const SizedBox(height: 20),

                  // Sign In link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Already have an account? ',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: AppColors.grey,
                        ),
                      ),
                      GestureDetector(
                        onTap: () => context.pop(),
                        child: Text(
                          'Sign In',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _BackButton extends StatefulWidget {
  final VoidCallback onTap;

  const _BackButton({required this.onTap});

  @override
  State<_BackButton> createState() => _BackButtonState();
}

class _BackButtonState extends State<_BackButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        widget.onTap();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.9 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border, width: 1.5),
          ),
          child: const Icon(
            Icons.chevron_left,
            size: 20,
            color: AppColors.black,
          ),
        ),
      ),
    );
  }
}

class _AccountTypeSelector extends StatelessWidget {
  final String value;
  final ValueChanged<String> onChanged;

  const _AccountTypeSelector({
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _buildOption('buyer', 'Buy', 'Shop & discover', Icons.shopping_cart_outlined),
        const SizedBox(width: 12),
        _buildOption('seller', 'Sell', 'List & earn', Icons.storefront_outlined),
        const SizedBox(width: 12),
        _buildOption('both', 'Both', 'Full access', Icons.swap_horiz_rounded),
      ],
    );
  }

  Widget _buildOption(
      String type, String label, String desc, IconData icon) {
    final isSelected = value == type;
    return Expanded(
      child: GestureDetector(
        onTap: () => onChanged(type),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.primary.withValues(alpha: 0.07)
                : AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? AppColors.primary : AppColors.border,
              width: 1.5,
            ),
          ),
          child: Stack(
            children: [
              Column(
                children: [
                  // Icon circle
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: isSelected ? AppColors.primaryGradient : null,
                      color: isSelected ? null : const Color(0xFFEDEDF0),
                    ),
                    child: Icon(
                      icon,
                      size: 22,
                      color: isSelected ? Colors.white : AppColors.grey,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    label,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: isSelected ? AppColors.primary : AppColors.black,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    desc,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: isSelected
                          ? const Color(0xFF9F67FA)
                          : AppColors.greyMedium,
                    ),
                  ),
                ],
              ),
              // Checkmark badge
              if (isSelected)
                Positioned(
                  top: 0,
                  right: 8,
                  child: Container(
                    width: 16,
                    height: 16,
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check, size: 10, color: Colors.white),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
