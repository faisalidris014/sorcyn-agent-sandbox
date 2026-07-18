import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/validators.dart';
import '../../../../shared/widgets/app_input_field.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../providers/auth_provider.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _emailSent = false;

  late AnimationController _successAnimController;
  late Animation<double> _successScaleAnim;

  @override
  void initState() {
    super.initState();
    _successAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _successScaleAnim = CurvedAnimation(
      parent: _successAnimController,
      curve: Curves.elasticOut,
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _successAnimController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await ref
          .read(authProvider.notifier)
          .forgotPassword(_emailController.text.trim());
      if (mounted) {
        setState(() {
          _emailSent = true;
          _isLoading = false;
        });
        _successAnimController.forward();
      }
    } catch (_) {
      // Always show success to prevent email enumeration
      if (mounted) {
        setState(() {
          _emailSent = true;
          _isLoading = false;
        });
        _successAnimController.forward();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Back button
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
              child: Align(
                alignment: Alignment.centerLeft,
                child: _BackButton(
                  onTap: () => _emailSent
                      ? context.go('/login')
                      : context.pop(),
                ),
              ),
            ),

            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: _emailSent ? _buildSuccessView() : _buildFormView(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormView() {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          const SizedBox(height: 40),

          // Hero lock icon
          _buildHeroIcon(),
          const SizedBox(height: 32),

          // Title
          Text(
            'Reset Your Password',
            style: GoogleFonts.inter(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: AppColors.black,
              letterSpacing: -0.52,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          Text(
            "Enter the email address linked to your account and we'll send you a reset link.",
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppColors.grey,
              height: 1.65,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),

          // Email field
          AppInputField(
            controller: _emailController,
            label: 'Email Address',
            hint: 'you@example.com',
            prefixIcon: Icons.mail_outline_rounded,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            autofocus: true,
            validator: Validators.email,
            showClearButton: true,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 24),

          // Spam hint
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.12),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 1),
                  child: Icon(Icons.info_outline, size: 16, color: AppColors.primary),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    "Check your spam folder if you don't see the email within a few minutes.",
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppColors.primary,
                      height: 1.6,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Send button
          GradientButton(
            text: 'Send Reset Link',
            icon: Icons.send_rounded,
            onPressed: _handleSubmit,
            isLoading: _isLoading,
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSuccessView() {
    return Column(
      children: [
        const SizedBox(height: 60),

        // Success icon
        ScaleTransition(
          scale: _successScaleAnim,
          child: SizedBox(
            width: 120,
            height: 120,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Glow
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        AppColors.success.withValues(alpha: 0.15),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
                // Mid ring
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.success.withValues(alpha: 0.2),
                      width: 1.5,
                    ),
                  ),
                ),
                // Icon circle
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF10B981), Color(0xFF34D399)],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.success.withValues(alpha: 0.38),
                        blurRadius: 32,
                        offset: const Offset(0, 12),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.check, size: 36, color: Colors.white),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 28),

        // Title
        Text(
          'Check your email',
          style: GoogleFonts.inter(
            fontSize: 26,
            fontWeight: FontWeight.w700,
            color: AppColors.black,
            letterSpacing: -0.52,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 10),
        Text(
          'We sent a password reset link to',
          style: GoogleFonts.inter(
            fontSize: 14,
            color: AppColors.grey,
            height: 1.65,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Text(
          _emailController.text.trim(),
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppColors.primary,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),

        // Steps card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              _buildStep('1', 'Open the email from Sorcyn'),
              const SizedBox(height: 12),
              _buildStep('2', 'Tap "Reset Password"'),
              const SizedBox(height: 12),
              _buildStep('3', 'Create your new password'),
            ],
          ),
        ),
        const SizedBox(height: 32),

        // Back to Sign In button
        GradientButton(
          text: 'Back to Sign In',
          icon: Icons.chevron_left,
          onPressed: () => context.go('/login'),
        ),
        const SizedBox(height: 16),

        // Resend link
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              "Didn't get it? ",
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppColors.greyMedium,
              ),
            ),
            GestureDetector(
              onTap: () {
                setState(() => _emailSent = false);
                _successAnimController.reset();
              },
              child: Text(
                'Resend email',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 40),
      ],
    );
  }

  Widget _buildHeroIcon() {
    return SizedBox(
      width: 120,
      height: 120,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Outer glow
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  AppColors.primary.withValues(alpha: 0.18),
                  Colors.transparent,
                ],
              ),
            ),
          ),
          // Mid ring
          Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.15),
                width: 1.5,
              ),
            ),
          ),
          // Icon circle
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppColors.primaryGradient,
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.38),
                  blurRadius: 32,
                  offset: const Offset(0, 12),
                ),
              ],
            ),
            child: const Icon(Icons.lock_outline_rounded, size: 36, color: Colors.white),
          ),
        ],
      ),
    );
  }

  Widget _buildStep(String number, String text) {
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppColors.primaryGradient,
          ),
          child: Center(
            child: Text(
              number,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Text(
          text,
          style: GoogleFonts.inter(
            fontSize: 13,
            color: const Color(0xFF4B5563),
          ),
        ),
      ],
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
