import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// Shows a bottom sheet modal for changing the user's password.
void showChangePasswordModal(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => const _ChangePasswordSheet(),
  );
}

class _ChangePasswordSheet extends StatefulWidget {
  const _ChangePasswordSheet();

  @override
  State<_ChangePasswordSheet> createState() => _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends State<_ChangePasswordSheet> {
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _showCurrentPassword = false;
  bool _showNewPassword = false;
  bool _showConfirmPassword = false;
  bool _isLoading = false;

  bool _currentFocused = false;
  bool _newFocused = false;
  bool _confirmFocused = false;

  @override
  void initState() {
    super.initState();
    _newPasswordController.addListener(_onPasswordChanged);
    _confirmPasswordController.addListener(_onPasswordChanged);
  }

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _onPasswordChanged() {
    setState(() {});
  }

  // Password strength calculation
  int get _passwordStrength {
    final password = _newPasswordController.text;
    if (password.isEmpty) return 0;
    int strength = 0;
    if (password.length >= 8) strength++;
    if (password.contains(RegExp(r'[A-Z]'))) strength++;
    if (password.contains(RegExp(r'[0-9]'))) strength++;
    if (password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) strength++;
    return strength;
  }

  String get _strengthLabel {
    return switch (_passwordStrength) {
      0 => '',
      1 => 'Weak',
      2 => 'Fair',
      3 => 'Good',
      4 => 'Strong',
      _ => '',
    };
  }

  Color get _strengthColor {
    return switch (_passwordStrength) {
      1 => AppColors.error,
      2 => const Color(0xFFF97316),
      3 => const Color(0xFF84CC16),
      4 => AppColors.success,
      _ => AppColors.greyMedium,
    };
  }

  bool get _hasMinLength => _newPasswordController.text.length >= 8;
  bool get _hasUppercase =>
      _newPasswordController.text.contains(RegExp(r'[A-Z]'));
  bool get _hasNumber =>
      _newPasswordController.text.contains(RegExp(r'[0-9]'));
  bool get _hasSpecialChar => _newPasswordController.text
      .contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'));

  bool get _passwordsMatch =>
      _confirmPasswordController.text.isNotEmpty &&
      _newPasswordController.text == _confirmPasswordController.text;
  bool get _passwordsMismatch =>
      _confirmPasswordController.text.isNotEmpty &&
      _newPasswordController.text != _confirmPasswordController.text;

  bool get _canSubmit =>
      _currentPasswordController.text.isNotEmpty &&
      _hasMinLength &&
      _hasUppercase &&
      _hasNumber &&
      _hasSpecialChar &&
      _passwordsMatch;

  Future<void> _handleSubmit() async {
    if (!_canSubmit || _isLoading) return;
    setState(() => _isLoading = true);

    // TODO: Integrate with auth provider to change password
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      setState(() => _isLoading = false);
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password updated successfully'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.only(bottom: bottomInset),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.greyMedium.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Change Password',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: AppColors.border,
                          width: 1.5,
                        ),
                      ),
                      child: const Icon(
                        Icons.close,
                        size: 18,
                        color: AppColors.greyMedium,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Current password
              _buildFieldLabel('Current Password'),
              const SizedBox(height: 8),
              _buildPasswordField(
                controller: _currentPasswordController,
                showPassword: _showCurrentPassword,
                onToggle: () =>
                    setState(() => _showCurrentPassword = !_showCurrentPassword),
                focused: _currentFocused,
                onFocusChange: (f) => setState(() => _currentFocused = f),
                hintText: 'Enter current password',
              ),
              const SizedBox(height: 20),

              // New password
              _buildFieldLabel('New Password'),
              const SizedBox(height: 8),
              _buildPasswordField(
                controller: _newPasswordController,
                showPassword: _showNewPassword,
                onToggle: () =>
                    setState(() => _showNewPassword = !_showNewPassword),
                focused: _newFocused,
                onFocusChange: (f) => setState(() => _newFocused = f),
                hintText: 'Enter new password',
              ),

              // Strength indicator
              if (_newPasswordController.text.isNotEmpty) ...[
                const SizedBox(height: 12),
                _buildStrengthBar(),
                const SizedBox(height: 12),
                _buildRequirements(),
              ],
              const SizedBox(height: 20),

              // Confirm password
              Row(
                children: [
                  _buildFieldLabel('Confirm Password'),
                  const Spacer(),
                  if (_passwordsMatch)
                    const Icon(Icons.check_circle,
                        size: 16, color: AppColors.success)
                  else if (_passwordsMismatch)
                    const Icon(Icons.cancel,
                        size: 16, color: AppColors.error),
                ],
              ),
              const SizedBox(height: 8),
              _buildPasswordField(
                controller: _confirmPasswordController,
                showPassword: _showConfirmPassword,
                onToggle: () => setState(
                    () => _showConfirmPassword = !_showConfirmPassword),
                focused: _confirmFocused,
                onFocusChange: (f) => setState(() => _confirmFocused = f),
                hintText: 'Re-enter new password',
              ),
              const SizedBox(height: 28),

              // Update Password button
              GestureDetector(
                onTap: _canSubmit ? _handleSubmit : null,
                child: Container(
                  width: double.infinity,
                  height: 54,
                  decoration: BoxDecoration(
                    gradient: _canSubmit
                        ? const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [Color(0xFF7C3AED), Color(0xFFA855F7)],
                          )
                        : null,
                    color: _canSubmit ? null : AppColors.greyLight,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: _canSubmit
                        ? [
                            BoxShadow(
                              color:
                                  AppColors.primary.withValues(alpha: 0.35),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ]
                        : null,
                  ),
                  child: Center(
                    child: _isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor:
                                  AlwaysStoppedAnimation(Colors.white),
                            ),
                          )
                        : Text(
                            'Update Password',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: _canSubmit
                                  ? Colors.white
                                  : AppColors.greyMedium,
                            ),
                          ),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Cancel button
              GestureDetector(
                onTap: () => Navigator.of(context).pop(),
                child: Container(
                  width: double.infinity,
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: const Center(
                    child: Text(
                      'Cancel',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.grey,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFieldLabel(String label) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: Color(0xFF1F2937),
      ),
    );
  }

  Widget _buildPasswordField({
    required TextEditingController controller,
    required bool showPassword,
    required VoidCallback onToggle,
    required bool focused,
    required ValueChanged<bool> onFocusChange,
    required String hintText,
  }) {
    return Focus(
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
              Icons.lock_outline,
              size: 18,
              color: focused ? AppColors.primary : AppColors.greyMedium,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                controller: controller,
                obscureText: !showPassword,
                style: const TextStyle(
                  fontSize: 15,
                  color: Color(0xFF1F2937),
                ),
                decoration: InputDecoration(
                  border: InputBorder.none,
                  hintText: hintText,
                  hintStyle: const TextStyle(
                    fontSize: 15,
                    color: AppColors.greyMedium,
                  ),
                  contentPadding: EdgeInsets.zero,
                  isDense: true,
                ),
              ),
            ),
            GestureDetector(
              onTap: onToggle,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Icon(
                  showPassword
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                  size: 20,
                  color: AppColors.greyMedium,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStrengthBar() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: List.generate(4, (index) {
            final isActive = index < _passwordStrength;
            return Expanded(
              child: Container(
                height: 4,
                margin: EdgeInsets.only(right: index < 3 ? 4 : 0),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(2),
                  color: isActive
                      ? _strengthColor
                      : AppColors.greyMedium.withValues(alpha: 0.2),
                ),
              ),
            );
          }),
        ),
        if (_strengthLabel.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(
            _strengthLabel,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: _strengthColor,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildRequirements() {
    final requirements = [
      (_hasMinLength, 'At least 8 characters'),
      (_hasUppercase, 'One uppercase letter'),
      (_hasNumber, 'One number'),
      (_hasSpecialChar, 'One special character'),
    ];

    return Column(
      children: requirements.map((req) {
        final met = req.$1;
        return Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Row(
            children: [
              Container(
                width: 16,
                height: 16,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: met
                      ? AppColors.success
                      : Colors.transparent,
                  border: met
                      ? null
                      : Border.all(
                          color: AppColors.greyMedium.withValues(alpha: 0.4),
                          width: 1.5,
                        ),
                ),
                child: met
                    ? const Icon(Icons.check, size: 10, color: Colors.white)
                    : null,
              ),
              const SizedBox(width: 8),
              Text(
                req.$2,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: met
                      ? AppColors.success
                      : AppColors.greyMedium,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
