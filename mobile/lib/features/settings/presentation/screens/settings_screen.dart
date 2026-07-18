import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/config/app_config.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../auth/providers/auth_provider.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _pushEnabled = true;
  bool _emailEnabled = true;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  void _loadPreferences() {
    final user = ref.read(authProvider).user;
    if (user?.notificationPreferences != null) {
      final prefs = user!.notificationPreferences!;
      _pushEnabled = prefs['push_messages'] ?? true;
      _emailEnabled = prefs['email_offers'] ?? true;
    }
  }

  Future<void> _updatePreferences() async {
    try {
      await DioClient.instance.patch('/users/me', data: {
        'notificationPreferences': {
          'push_messages': _pushEnabled,
          'email_offers': _emailEnabled,
        },
      });
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to update preferences')),
        );
      }
    }
  }

  Future<void> _signOut() async {
    setState(() => _isLoading = true);
    try {
      await ref.read(authProvider.notifier).logout();
      if (mounted) context.go('/login');
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to sign out')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _deactivateAccount() async {
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const _DeactivateAccountSheet(),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isLoading = true);
    try {
      await DioClient.instance.patch('/users/me', data: {'isActive': false});
      if (mounted) {
        await ref.read(authProvider.notifier).logout();
        if (mounted) context.go('/login');
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to deactivate account')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteAccount() async {
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const _DeleteAccountSheet(),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isLoading = true);
    try {
      await DioClient.instance.delete('/users/me');
      if (mounted) {
        await ref.read(authProvider.notifier).logout();
        if (mounted) context.go('/login');
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to delete account')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  // Custom Header — locked Sorcyn header (22px w900 per BATCH_7_PLAN)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                    child: Row(
                      children: [
                        GestureDetector(
                          onTap: () => context.pop(),
                          child: Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: AppColors.surfaceVariant,
                              // 12 — locked control radius
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: AppColors.border,
                                width: 1,
                              ),
                            ),
                            child: const Icon(
                              Icons.chevron_left,
                              color: AppColors.black,
                              size: 22,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        const Text(
                          'Settings',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: AppColors.black,
                            letterSpacing: -0.02,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Body
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 24),

                          // Notifications section
                          const _SectionLabel(text: 'NOTIFICATIONS'),
                          _MenuCard(
                            children: [
                              _ToggleMenuItem(
                                icon: Icons.notifications_outlined,
                                label: 'Push Notifications',
                                value: _pushEnabled,
                                onChanged: (v) {
                                  setState(() => _pushEnabled = v);
                                  _updatePreferences();
                                },
                              ),
                              const _MenuDivider(),
                              _ToggleMenuItem(
                                icon: Icons.email_outlined,
                                label: 'Email Notifications',
                                value: _emailEnabled,
                                onChanged: (v) {
                                  setState(() => _emailEnabled = v);
                                  _updatePreferences();
                                },
                              ),
                            ],
                          ),

                          // Account section — Upgrade to Business (classic
                          // accounts) OR Sales-Tax Certificate management
                          // (business accounts), per v2.2 PRD / #229.
                          if (ref.watch(authProvider).user?.isBusiness ==
                              false) ...[
                            const SizedBox(height: 24),
                            const _SectionLabel(text: 'ACCOUNT'),
                            _MenuCard(
                              children: [
                                _ChevronMenuItem(
                                  icon: Icons.business_center_outlined,
                                  label: 'Upgrade to Business',
                                  onTap: () =>
                                      context.push('/settings/upgrade-to-business'),
                                ),
                              ],
                            ),
                          ] else if (ref.watch(authProvider).user?.isBusiness ==
                              true) ...[
                            const SizedBox(height: 24),
                            const _SectionLabel(text: 'BUSINESS'),
                            _MenuCard(
                              children: [
                                _ChevronMenuItem(
                                  icon: Icons.receipt_long_outlined,
                                  label: 'Sales Tax Certificate',
                                  onTap: () =>
                                      context.push('/settings/business-profile'),
                                ),
                              ],
                            ),
                          ],

                          const SizedBox(height: 24),

                          // Preferences section
                          const _SectionLabel(text: 'PREFERENCES'),
                          _MenuCard(
                            children: [
                              _ChevronMenuItem(
                                icon: Icons.language,
                                label: 'Language',
                                value: 'English',
                                onTap: () => context.push('/settings/language'),
                              ),
                              const _MenuDivider(),
                              _DarkModeMenuItem(),
                            ],
                          ),

                          const SizedBox(height: 24),

                          // About section
                          const _SectionLabel(text: 'ABOUT'),
                          _MenuCard(
                            children: [
                              _ChevronMenuItem(
                                icon: Icons.shield_outlined,
                                label: 'Privacy Policy',
                                onTap: () => launchUrl(
                                  Uri.parse(AppConfig.privacyPolicyUrl),
                                  mode: LaunchMode.externalApplication,
                                ),
                              ),
                              const _MenuDivider(),
                              _ChevronMenuItem(
                                icon: Icons.description_outlined,
                                label: 'Terms of Service',
                                onTap: () => launchUrl(
                                  Uri.parse(AppConfig.termsOfServiceUrl),
                                  mode: LaunchMode.externalApplication,
                                ),
                              ),
                              const _MenuDivider(),
                              _ChevronMenuItem(
                                icon: Icons.headset_mic_outlined,
                                label: 'Contact Support',
                                onTap: () => launchUrl(
                                  Uri.parse(
                                      'mailto:${AppConfig.supportEmail}'),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 28),

                          // Sign Out
                          GradientButton(
                            text: 'Sign Out',
                            onPressed: _signOut,
                            icon: Icons.logout,
                          ),

                          const SizedBox(height: 28),

                          // Danger Zone
                          const _SectionLabel(text: 'DANGER ZONE'),
                          _MenuCard(
                            children: [
                              _ChevronMenuItem(
                                icon: Icons.pause_circle_outline,
                                label: 'Deactivate Account',
                                onTap: _deactivateAccount,
                                destructive: true,
                              ),
                              const _MenuDivider(),
                              _ChevronMenuItem(
                                icon: Icons.delete_outline,
                                label: 'Delete Account',
                                onTap: _deleteAccount,
                                destructive: true,
                              ),
                            ],
                          ),

                          const SizedBox(height: 20),

                          // App version
                          Center(
                            child: Text(
                              'Sorcyn v1.0.0 · Build 42',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.greyMedium
                                    .withValues(alpha: 0.55),
                              ),
                            ),
                          ),

                          const SizedBox(height: 32),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

// --- Shared Widgets ---

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, left: 4),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: AppColors.greyMedium,
          letterSpacing: 0.96,
        ),
      ),
    );
  }
}

class _MenuCard extends StatelessWidget {
  final List<Widget> children;
  const _MenuCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        // 16 — locked card radius
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(children: children),
    );
  }
}

class _MenuDivider extends StatelessWidget {
  const _MenuDivider();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 56),
      child: Divider(
        height: 1,
        thickness: 1,
        color: AppColors.border.withValues(alpha: 0.6),
      ),
    );
  }
}

class _ToggleMenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _ToggleMenuItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 56,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14),
        child: Row(
          children: [
            _IconCircle(icon: icon),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.black,
                ),
              ),
            ),
            // Locked 44x26 toggle with Sorcyn primary gradient track
            _GradientToggle(value: value, onChanged: onChanged),
          ],
        ),
      ),
    );
  }
}

/// 44x26 toggle with [AppColors.primaryGradient] active track.
///
/// CupertinoSwitch's `activeTrackColor` only accepts a flat color, so we
/// stack a gradient track underneath the switch and hide the native track
/// when active to render the locked Sorcyn primary gradient.
class _GradientToggle extends StatelessWidget {
  final bool value;
  final ValueChanged<bool>? onChanged;

  const _GradientToggle({required this.value, this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 44,
      height: 26,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Gradient track (visible when active)
          AnimatedOpacity(
            duration: const Duration(milliseconds: 180),
            opacity: value ? 1.0 : 0.0,
            child: Container(
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                // 24 — locked pill radius (capsule)
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.35),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
            ),
          ),
          // Native switch — transparent active track lets gradient show through
          FittedBox(
            fit: BoxFit.contain,
            child: CupertinoSwitch(
              value: value,
              activeTrackColor: Colors.transparent,
              inactiveTrackColor:
                  AppColors.greyMedium.withValues(alpha: 0.35),
              onChanged: onChanged,
            ),
          ),
        ],
      ),
    );
  }
}

class _DarkModeMenuItem extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 56,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14),
        child: Row(
          children: [
            _IconCircle(icon: Icons.dark_mode_outlined),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Dark Mode',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.black,
                ),
              ),
            ),
            // Coming Soon pill
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.greyLight,
                // 24 — locked pill radius (capsule)
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: AppColors.border,
                  width: 0.5,
                ),
              ),
              child: const Text(
                'Coming Soon',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  color: AppColors.greyMedium,
                ),
              ),
            ),
            const SizedBox(width: 10),
            // Disabled toggle (still uses gradient track style for parity, but
            // greyed out via Opacity; null onChanged disables interaction)
            const Opacity(
              opacity: 0.55,
              child: _GradientToggle(value: false),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChevronMenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? value;
  final VoidCallback onTap;
  final bool destructive;

  const _ChevronMenuItem({
    required this.icon,
    required this.label,
    this.value,
    required this.onTap,
    this.destructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = destructive ? AppColors.error : AppColors.black;
    final iconBg = destructive
        ? AppColors.error.withValues(alpha: 0.08)
        : AppColors.primary.withValues(alpha: 0.08);
    final iconColor = destructive ? AppColors.error : AppColors.primary;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: SizedBox(
          height: 56,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Row(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: iconBg,
                  ),
                  child: Icon(icon, size: 16, color: iconColor),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: color,
                    ),
                  ),
                ),
                if (value != null) ...[
                  Text(
                    value!,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.greyMedium,
                    ),
                  ),
                  const SizedBox(width: 6),
                ],
                Icon(
                  Icons.chevron_right,
                  size: 18,
                  color: destructive
                      ? AppColors.error.withValues(alpha: 0.5)
                      : AppColors.greyMedium.withValues(alpha: 0.7),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _IconCircle extends StatelessWidget {
  final IconData icon;
  const _IconCircle({required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 34,
      height: 34,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.primary.withValues(alpha: 0.08),
      ),
      child: Icon(icon, size: 16, color: AppColors.primary),
    );
  }
}

// --- Deactivate Account Bottom Sheet ---

class _DeactivateAccountSheet extends StatelessWidget {
  const _DeactivateAccountSheet();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 36),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          const SizedBox(height: 24),
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.error.withValues(alpha: 0.1),
            ),
            child: const Icon(
              Icons.pause_circle_outline,
              size: 24,
              color: AppColors.error,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Deactivate Account?',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.black,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Your account will be turned off and hidden from other users. All your data is retained. You can reactivate anytime by logging back in.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.grey,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: FilledButton(
              onPressed: () => Navigator.pop(context, true),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.error,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text(
                'Yes, Deactivate',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: TextButton(
              onPressed: () => Navigator.pop(context, false),
              style: TextButton.styleFrom(
                backgroundColor: AppColors.greyLight,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text(
                'Cancel',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.grey,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// --- Delete Account Bottom Sheet ---

class _DeleteAccountSheet extends StatelessWidget {
  const _DeleteAccountSheet();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        // 24 — locked sheet/hero radius
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 36),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          const SizedBox(height: 24),

          // Warning icon
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.error.withValues(alpha: 0.1),
            ),
            child: const Icon(
              Icons.delete_outline,
              size: 24,
              color: AppColors.error,
            ),
          ),
          const SizedBox(height: 16),

          const Text(
            'Delete Account?',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.black,
            ),
          ),
          const SizedBox(height: 8),

          const Text(
            'This action is permanent and cannot be undone. All your posts, offers, and data will be erased.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.grey,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 24),

          // Delete button — destructive (intentionally NOT GradientButton; the
          // primary CTA on this confirmation is destructive, not affirmative)
          SizedBox(
            width: double.infinity,
            height: 52,
            child: FilledButton(
              onPressed: () => Navigator.pop(context, true),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.error,
                shape: RoundedRectangleBorder(
                  // 16 — locked card radius
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text(
                'Yes, Delete',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Cancel button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: TextButton(
              onPressed: () => Navigator.pop(context, false),
              style: TextButton.styleFrom(
                backgroundColor: AppColors.greyLight,
                shape: RoundedRectangleBorder(
                  // 16 — locked card radius
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text(
                'Cancel',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.grey,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
