import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_logo.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../providers/auth_provider.dart';

class VerifyEmailScreen extends ConsumerStatefulWidget {
  final String? token;

  const VerifyEmailScreen({super.key, this.token});

  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen>
    with SingleTickerProviderStateMixin {
  bool _isVerifying = false;
  bool _isResending = false;
  bool _isRefreshing = false;
  bool _resent = false;
  int _cooldown = 0;
  Timer? _cooldownTimer;

  late AnimationController _floatController;
  late Animation<double> _floatAnim;

  @override
  void initState() {
    super.initState();
    _floatController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3200),
    )..repeat(reverse: true);
    _floatAnim = Tween<double>(begin: 0, end: -8).animate(
      CurvedAnimation(parent: _floatController, curve: Curves.easeInOut),
    );

    if (widget.token != null) {
      _autoVerify();
    }
  }

  @override
  void dispose() {
    _floatController.dispose();
    _cooldownTimer?.cancel();
    super.dispose();
  }

  void _startCooldown() {
    setState(() => _cooldown = 30);
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_cooldown <= 1) {
        timer.cancel();
        if (mounted) setState(() => _cooldown = 0);
      } else {
        if (mounted) setState(() => _cooldown--);
      }
    });
  }

  Future<void> _autoVerify() async {
    setState(() => _isVerifying = true);

    try {
      await ref.read(authProvider.notifier).verifyEmail(widget.token!);
      // Auth state updated → router will redirect to /home
    } catch (e) {
      if (mounted) {
        setState(() => _isVerifying = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Verification failed. The link may have expired.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _handleResend() async {
    if (_isResending || _cooldown > 0) return;

    setState(() {
      _isResending = true;
      _resent = false;
    });

    try {
      await ref.read(authProvider.notifier).resendVerification();
      if (mounted) {
        setState(() {
          _resent = true;
          _isResending = false;
        });
        _startCooldown();
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isResending = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to resend. Please try again later.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _handleRefresh() async {
    setState(() => _isRefreshing = true);
    await ref.read(authProvider.notifier).refreshCurrentUser();
    if (mounted) setState(() => _isRefreshing = false);
    // Router redirect fires automatically if emailVerified flipped to true
  }

  Future<void> _handleLogout() async {
    await ref.read(authProvider.notifier).logout();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final email = authState.user?.email ?? '';

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _handleRefresh,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const SizedBox(height: 32),

              // Logo (compact)
              const AppLogo(size: 44, showText: true),
              const SizedBox(height: 24),

              // Hero mail icon
              if (_isVerifying)
                _buildVerifyingState()
              else ...[
                _buildMailHero(),
                const SizedBox(height: 24),

                // Title
                Text(
                  'Verify Your Email',
                  style: GoogleFonts.inter(
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                    color: AppColors.black,
                    letterSpacing: -0.52,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),

                // Email chip
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.18),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.mail_outline, size: 14, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          email,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Instruction text
                Text.rich(
                  TextSpan(
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: AppColors.grey,
                      height: 1.7,
                    ),
                    children: [
                      const TextSpan(
                        text: "We've sent a verification link to your email address. Open it to activate your Sorcyn account. The link expires in ",
                      ),
                      TextSpan(
                        text: '24 hours',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.black,
                        ),
                      ),
                      const TextSpan(text: '.'),
                    ],
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),

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
                      _buildStep('1', 'Open your email inbox'),
                      const SizedBox(height: 12),
                      _buildStep('2', 'Find the email from Sorcyn'),
                      const SizedBox(height: 12),
                      _buildStep('3', "Tap 'Verify My Email' in the email"),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Success toast
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  height: _resent ? 48 : 0,
                  clipBehavior: Clip.hardEdge,
                  decoration: const BoxDecoration(),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.success.withValues(alpha: 0.2),
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 22,
                          height: 22,
                          decoration: const BoxDecoration(
                            color: AppColors.success,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.check, size: 12, color: Colors.white),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Verification email sent!',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: const Color(0xFF065F46),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Spam hint
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.1),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.only(top: 1),
                        child: Icon(Icons.info_outline, size: 15, color: AppColors.primary),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text.rich(
                          TextSpan(
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: AppColors.primary,
                              height: 1.6,
                            ),
                            children: [
                              const TextSpan(text: "Can't find it? Check your "),
                              TextSpan(
                                text: 'spam',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                ),
                              ),
                              const TextSpan(text: ' or '),
                              TextSpan(
                                text: 'promotions',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                ),
                              ),
                              const TextSpan(text: ' folder.'),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Resend button
                GradientButton(
                  text: _cooldown > 0
                      ? 'Resend in ${_cooldown}s'
                      : 'Resend Verification Email',
                  icon: _cooldown > 0 ? Icons.timer_outlined : Icons.mail_outline_rounded,
                  onPressed:
                      (_cooldown > 0 || _isResending) ? null : _handleResend,
                  isLoading: _isResending,
                ),
                const SizedBox(height: 8),

                // Manual refresh — for out-of-band verification (dev DB update, support override)
                TextButton.icon(
                  onPressed: _isRefreshing ? null : _handleRefresh,
                  icon: _isRefreshing
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.check_circle_outline, size: 16),
                  label: Text(
                    _isRefreshing ? 'Checking...' : "Already verified? Tap to continue",
                    style: GoogleFonts.inter(fontSize: 13),
                  ),
                ),
                const SizedBox(height: 6),

                // Switch account link
                GestureDetector(
                  onTap: _handleLogout,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.chevron_left, size: 14, color: AppColors.primary),
                      const SizedBox(width: 4),
                      Text(
                        'Sign in with a different account',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ],
          ),
        ),
        ),
      ),
    );
  }

  Widget _buildVerifyingState() {
    return Column(
      children: [
        const SizedBox(height: 80),
        SizedBox(
          width: 96,
          height: 96,
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppColors.primaryGradient,
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.4),
                  blurRadius: 40,
                  offset: const Offset(0, 16),
                ),
              ],
            ),
            child: const Center(
              child: SizedBox(
                width: 40,
                height: 40,
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  valueColor: AlwaysStoppedAnimation(Colors.white),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Verifying your email...',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: AppColors.black,
          ),
        ),
      ],
    );
  }

  Widget _buildMailHero() {
    return AnimatedBuilder(
      animation: _floatAnim,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, _floatAnim.value),
          child: child,
        );
      },
      child: SizedBox(
        width: 148,
        height: 148,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Outer glow ring
            Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.primary.withValues(alpha: 0.14),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
            // Mid ring
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.14),
                  width: 1.5,
                ),
              ),
            ),
            // Icon circle
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.primaryGradient,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.4),
                    blurRadius: 40,
                    offset: const Offset(0, 16),
                  ),
                ],
              ),
              child: const Icon(
                Icons.mail_outline_rounded,
                size: 46,
                color: Colors.white,
              ),
            ),
          ],
        ),
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
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: const Color(0xFF4B5563),
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }
}
