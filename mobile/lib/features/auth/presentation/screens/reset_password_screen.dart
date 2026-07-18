import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../providers/auth_provider.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {
  final String token;

  const ResetPasswordScreen({super.key, required this.token});

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _isLoading = false;
  bool _isSuccess = false;
  bool _passwordFocused = false;
  bool _confirmFocused = false;
  String? _error;
  String _password = '';

  late AnimationController _successAnimController;
  late Animation<double> _successScaleAnim;

  @override
  void initState() {
    super.initState();
    _successAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _successScaleAnim = CurvedAnimation(
      parent: _successAnimController,
      curve: Curves.elasticOut,
    );
  }

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmController.dispose();
    _successAnimController.dispose();
    super.dispose();
  }

  int get _strength {
    int s = 0;
    if (_password.length >= 8) s++;
    if (_password.contains(RegExp(r'[A-Z]'))) s++;
    if (_password.contains(RegExp(r'[0-9]'))) s++;
    if (_password.contains(RegExp(r'[!@#\$%\^&\*\(\),.?":{}|<>]'))) s++;
    return s;
  }

  bool get _passwordsMatch =>
      _password.isNotEmpty &&
      _confirmController.text.isNotEmpty &&
      _password == _confirmController.text;

  bool get _canSubmit => _strength >= 3 && _passwordsMatch;

  Future<void> _handleSubmit() async {
    if (!_canSubmit) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await ref.read(authProvider.notifier).resetPassword(
            token: widget.token,
            newPassword: _passwordController.text,
          );
      if (mounted) {
        setState(() {
          _isSuccess = true;
          _isLoading = false;
        });
        _successAnimController.forward();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Reset failed. The link may have expired.';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: '',
        onBack: () => context.go('/login'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: _isSuccess ? _buildSuccessView() : _buildFormView(),
        ),
      ),
    );
  }

  Widget _buildFormView() {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          const SizedBox(height: 20),

          // Hero icon
          _buildHeroIcon(),
          const SizedBox(height: 28),

          // Title
          const Text(
            'Set New Password',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: AppColors.black,
              letterSpacing: -0.02 * 26,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Create a strong password for your account',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.grey,
              height: 1.65,
            ),
          ),
          const SizedBox(height: 32),

          // New Password field
          _buildPasswordField(
            label: 'New Password',
            controller: _passwordController,
            obscure: _obscurePassword,
            focused: _passwordFocused,
            onFocusChange: (f) => setState(() => _passwordFocused = f),
            onToggleObscure: () =>
                setState(() => _obscurePassword = !_obscurePassword),
            onChanged: (v) => setState(() => _password = v),
            icon: Icons.lock_outline,
          ),
          const SizedBox(height: 8),

          // Strength indicator
          _buildStrengthIndicator(),
          const SizedBox(height: 12),

          // Requirements checklist
          _buildRequirements(),
          const SizedBox(height: 20),

          // Confirm Password field
          _buildPasswordField(
            label: 'Confirm Password',
            controller: _confirmController,
            obscure: _obscureConfirm,
            focused: _confirmFocused,
            onFocusChange: (f) => setState(() => _confirmFocused = f),
            onToggleObscure: () =>
                setState(() => _obscureConfirm = !_obscureConfirm),
            onChanged: (_) => setState(() {}),
            icon: Icons.shield_outlined,
            showMatchIndicator: true,
          ),

          if (_error != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.error.withValues(alpha: 0.2),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline,
                      size: 16, color: AppColors.error),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _error!,
                      style: const TextStyle(
                          fontSize: 13, color: AppColors.error),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 24),

          GradientButton(
            text: 'Reset Password',
            onPressed: _canSubmit ? _handleSubmit : null,
            isLoading: _isLoading,
          ),

          const SizedBox(height: 32),
        ],
      ),
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
            child: const Icon(Icons.vpn_key, size: 36, color: Colors.white),
          ),
        ],
      ),
    );
  }

  Widget _buildPasswordField({
    required String label,
    required TextEditingController controller,
    required bool obscure,
    required bool focused,
    required ValueChanged<bool> onFocusChange,
    required VoidCallback onToggleObscure,
    required ValueChanged<String> onChanged,
    required IconData icon,
    bool showMatchIndicator = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.black,
              ),
            ),
            if (showMatchIndicator &&
                _confirmController.text.isNotEmpty) ...[
              const SizedBox(width: 8),
              Icon(
                _passwordsMatch ? Icons.check_circle : Icons.cancel,
                size: 14,
                color: _passwordsMatch ? AppColors.success : AppColors.error,
              ),
            ],
          ],
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
                  child: TextField(
                    controller: controller,
                    obscureText: obscure,
                    onChanged: onChanged,
                    style: const TextStyle(
                      fontSize: 15,
                      color: AppColors.black,
                    ),
                    decoration: const InputDecoration(
                      border: InputBorder.none,
                      hintText: '••••••••',
                      hintStyle: TextStyle(
                        fontSize: 15,
                        color: AppColors.greyMedium,
                      ),
                      contentPadding: EdgeInsets.zero,
                      isDense: true,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: onToggleObscure,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Icon(
                      obscure
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      size: 18,
                      color: AppColors.greyMedium,
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

  Widget _buildStrengthIndicator() {
    final labels = ['Weak', 'Fair', 'Good', 'Strong'];
    final colors = [
      AppColors.error,
      AppColors.warning,
      const Color(0xFF84CC16),
      AppColors.success,
    ];

    return Column(
      children: [
        Row(
          children: List.generate(4, (i) {
            return Expanded(
              child: Container(
                height: 4,
                margin: EdgeInsets.only(right: i < 3 ? 4 : 0),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(2),
                  color: _password.isEmpty
                      ? AppColors.border
                      : i < _strength
                          ? colors[_strength - 1]
                          : AppColors.border,
                ),
              ),
            );
          }),
        ),
        if (_password.isNotEmpty) ...[
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              labels[_strength > 0 ? _strength - 1 : 0],
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: colors[_strength > 0 ? _strength - 1 : 0],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildRequirements() {
    final reqs = [
      ('At least 8 characters', _password.length >= 8),
      ('One uppercase letter', _password.contains(RegExp(r'[A-Z]'))),
      ('One number', _password.contains(RegExp(r'[0-9]'))),
      (
        'One special character',
        _password.contains(RegExp(r'[!@#\$%\^&\*\(\),.?":{}|<>]'))
      ),
    ];

    return Column(
      children: reqs.map((req) {
        final met = req.$2;
        return Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Row(
            children: [
              Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: met ? AppColors.success : Colors.transparent,
                  border: Border.all(
                    color: met ? AppColors.success : AppColors.border,
                    width: 1.5,
                  ),
                ),
                child: met
                    ? const Icon(Icons.check, size: 9, color: Colors.white)
                    : null,
              ),
              const SizedBox(width: 8),
              Text(
                req.$1,
                style: TextStyle(
                  fontSize: 12,
                  color: met
                      ? const Color(0xFF059669)
                      : AppColors.greyMedium,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildSuccessView() {
    return Column(
      children: [
        const SizedBox(height: 80),

        // Success icon
        ScaleTransition(
          scale: _successScaleAnim,
          child: Container(
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
        ),
        const SizedBox(height: 28),

        const Text(
          'Password Updated!',
          style: TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w700,
            color: AppColors.black,
            letterSpacing: -0.02 * 26,
          ),
        ),
        const SizedBox(height: 10),

        const Text(
          'Your password has been reset successfully.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 14,
            color: AppColors.grey,
            height: 1.65,
          ),
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
              _buildStep('1', 'Password securely updated'),
              const SizedBox(height: 12),
              _buildStep('2', 'All other sessions logged out'),
              const SizedBox(height: 12),
              _buildStep('3', 'Sign in with your new password'),
            ],
          ),
        ),
        const SizedBox(height: 32),

        GradientButton(
          text: 'Back to Sign In',
          icon: Icons.chevron_left,
          onPressed: () => context.go('/login'),
        ),

        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildStep(String number, String text) {
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppColors.primaryGradient,
          ),
          child: Center(
            child: Text(
              number,
              style: const TextStyle(
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
          style: const TextStyle(
            fontSize: 13,
            color: Color(0xFF4B5563),
          ),
        ),
      ],
    );
  }
}
