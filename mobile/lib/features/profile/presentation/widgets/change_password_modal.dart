import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../auth/providers/auth_provider.dart';

/// Shows a bottom sheet modal for changing the user's password.
Future<bool?> showChangePasswordModal(BuildContext context) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const _ChangePasswordSheet(),
  );
}

class _ChangePasswordSheet extends ConsumerStatefulWidget {
  const _ChangePasswordSheet();

  @override
  ConsumerState<_ChangePasswordSheet> createState() =>
      _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends ConsumerState<_ChangePasswordSheet> {
  final _currentController = TextEditingController();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();

  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _currentFocused = false;
  bool _newFocused = false;
  bool _confirmFocused = false;
  bool _isLoading = false;
  String _newPassword = '';

  @override
  void dispose() {
    _currentController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  int get _strength {
    int s = 0;
    if (_newPassword.length >= 8) s++;
    if (_newPassword.contains(RegExp(r'[A-Z]'))) s++;
    if (_newPassword.contains(RegExp(r'[0-9]'))) s++;
    if (_newPassword.contains(RegExp(r'[!@#\$%\^&\*\(\),.?":{}|<>]'))) s++;
    return s;
  }

  bool get _passwordsMatch =>
      _newPassword.isNotEmpty &&
      _confirmController.text.isNotEmpty &&
      _newPassword == _confirmController.text;

  bool get _canSubmit =>
      _currentController.text.isNotEmpty && _strength >= 3 && _passwordsMatch;

  Future<void> _handleSubmit() async {
    if (!_canSubmit) return;
    setState(() => _isLoading = true);
    try {
      await ref.read(authProvider.notifier).changePassword(
        currentPassword: _currentController.text,
        newPassword: _newController.text,
      );
      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to change password. Check your current password.')),
        );
      }
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
      padding: EdgeInsets.fromLTRB(20, 12, 20, 32 + bottomInset),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),

            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'Change Password',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.black,
                        letterSpacing: -0.4,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'Update your account password',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.greyMedium,
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: AppColors.border,
                        width: 1.5,
                      ),
                    ),
                    child: const Icon(Icons.close, size: 16, color: AppColors.grey),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Current password
            _buildField(
              label: 'Current Password',
              controller: _currentController,
              obscure: _obscureCurrent,
              focused: _currentFocused,
              onFocusChange: (f) => setState(() => _currentFocused = f),
              onToggle: () =>
                  setState(() => _obscureCurrent = !_obscureCurrent),
              onChanged: (_) => setState(() {}),
              icon: Icons.lock_outline,
            ),
            const SizedBox(height: 16),

            // New password
            _buildField(
              label: 'New Password',
              controller: _newController,
              obscure: _obscureNew,
              focused: _newFocused,
              onFocusChange: (f) => setState(() => _newFocused = f),
              onToggle: () => setState(() => _obscureNew = !_obscureNew),
              onChanged: (v) => setState(() => _newPassword = v),
              icon: Icons.vpn_key_outlined,
            ),
            const SizedBox(height: 8),

            // Strength indicator
            _buildStrengthBars(),
            const SizedBox(height: 10),

            // Requirements
            _buildRequirements(),
            const SizedBox(height: 16),

            // Confirm new password
            _buildField(
              label: 'Confirm New Password',
              controller: _confirmController,
              obscure: _obscureConfirm,
              focused: _confirmFocused,
              onFocusChange: (f) => setState(() => _confirmFocused = f),
              onToggle: () =>
                  setState(() => _obscureConfirm = !_obscureConfirm),
              onChanged: (_) => setState(() {}),
              icon: Icons.shield_outlined,
              showMatch: true,
            ),
            const SizedBox(height: 24),

            // Submit button
            GradientButton(
              text: 'Update Password',
              onPressed: _canSubmit ? _handleSubmit : null,
              isLoading: _isLoading,
              height: 54,
              borderRadius: 20,
            ),
            const SizedBox(height: 10),

            // Cancel button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: TextButton(
                onPressed: () => Navigator.pop(context),
                style: TextButton.styleFrom(
                  backgroundColor: AppColors.greyLight,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
                child: const Text(
                  'Cancel',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.grey,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField({
    required String label,
    required TextEditingController controller,
    required bool obscure,
    required bool focused,
    required ValueChanged<bool> onFocusChange,
    required VoidCallback onToggle,
    required ValueChanged<String> onChanged,
    required IconData icon,
    bool showMatch = false,
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
            if (showMatch && _confirmController.text.isNotEmpty) ...[
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
                    style: const TextStyle(fontSize: 15, color: AppColors.black),
                    decoration: const InputDecoration(
                      border: InputBorder.none,
                      hintText: '••••••••',
                      hintStyle:
                          TextStyle(fontSize: 15, color: AppColors.greyMedium),
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

  Widget _buildStrengthBars() {
    final colors = [
      AppColors.error,
      AppColors.warning,
      const Color(0xFF84CC16),
      AppColors.success,
    ];
    final labels = ['Weak', 'Fair', 'Good', 'Strong'];

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
                  color: _newPassword.isEmpty
                      ? AppColors.border
                      : i < _strength
                          ? colors[_strength - 1]
                          : AppColors.border,
                ),
              ),
            );
          }),
        ),
        if (_newPassword.isNotEmpty) ...[
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
      ('At least 8 characters', _newPassword.length >= 8),
      ('One uppercase letter', _newPassword.contains(RegExp(r'[A-Z]'))),
      ('One number', _newPassword.contains(RegExp(r'[0-9]'))),
      (
        'One special character',
        _newPassword.contains(RegExp(r'[!@#\$%\^&\*\(\),.?":{}|<>]'))
      ),
    ];

    return Column(
      children: reqs.map((req) {
        final met = req.$2;
        return Padding(
          padding: const EdgeInsets.only(bottom: 4),
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
                  color: met ? const Color(0xFF059669) : AppColors.greyMedium,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
