import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/providers/app_mode_provider.dart';
import '../../../../core/providers/marketplace_context_provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../sellers/providers/seller_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final user = ref.read(authProvider).user;
      if (user != null && user.isSeller) {
        ref.read(sellerProfileProvider.notifier).loadProfile();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final appMode = ref.watch(appModeProvider);
    final marketplaceContext = ref.watch(marketplaceContextProvider);
    // Keep the screen reactive to seller-profile changes (mode switch, stats
    // refresh); also drives the Verification badge (#245).
    final sellerProfile = ref.watch(sellerProfileProvider).profile;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          children: [
            const SizedBox(height: 16),
            // Custom AppBar
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Profile',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppColors.black,
                  ),
                ),
                GestureDetector(
                  onTap: () => context.push('/settings'),
                  child: Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF9FAFB),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: const Icon(
                      Icons.settings_outlined,
                      size: 20,
                      color: AppColors.grey,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),

            // Profile Hero Section
            Center(
              child: Column(
                children: [
                  // Avatar with edit button
                  Stack(
                    children: [
                      Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: AppColors.primaryGradient,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.35),
                              blurRadius: 24,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: user?.profilePhotoUrl != null
                            ? ClipOval(
                                child: Image.network(
                                  user!.profilePhotoUrl!,
                                  width: 96,
                                  height: 96,
                                  fit: BoxFit.cover,
                                ),
                              )
                            : Center(
                                child: Text(
                                  user != null
                                      ? '${user.firstName[0]}${user.lastName[0]}'
                                      : '?',
                                  style: const TextStyle(
                                    fontSize: 32,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                      ),
                      // Edit photo button
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: GestureDetector(
                          onTap: () => context.push('/profile/edit'),
                          child: Container(
                            width: 30,
                            height: 30,
                            decoration: BoxDecoration(
                              gradient: AppColors.primaryGradient,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: Colors.white,
                                width: 2.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withValues(alpha: 0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.camera_alt_rounded,
                              size: 14,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Name
                  Text(
                    user?.fullName ?? 'User',
                    style: const TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w700,
                      color: AppColors.black,
                    ),
                  ),
                  const SizedBox(height: 4),
                  // Email
                  Text(
                    user?.email ?? '',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.grey,
                    ),
                  ),
                  const SizedBox(height: 10),
                  // Account type badge pill
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      user?.accountType.toUpperCase() ?? '',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Account Mode Section
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 12),
              child: Text(
                'ACCOUNT MODE',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.greyMedium,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            _MarketplaceContextSelector(
              currentContext: marketplaceContext,
              onChanged: (ctx) {
                ref.read(marketplaceContextProvider.notifier).setContext(ctx);
              },
            ),
            const SizedBox(height: 28),

            // Account Menu Section
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 12),
              child: Text(
                'ACCOUNT',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.greyMedium,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  _ProfileMenuItem(
                    icon: Icons.person_outline_rounded,
                    label: 'Edit Profile',
                    onTap: () => context.push('/profile/edit'),
                    showTopRadius: true,
                  ),
                  _ProfileMenuDivider(),
                  _ProfileMenuToggleItem(
                    icon: Icons.store_outlined,
                    label: 'Switch to Seller Mode',
                    value: appMode == AppMode.seller,
                    onChanged: (val) async {
                      // Switching INTO seller mode without a seller profile →
                      // nudge to setup (consistent with the router onboarding
                      // gate, which keys off profile existence, not account
                      // type). The old `!user.isSeller` guard never fired for
                      // seller/both accounts, so a profile-less seller could
                      // flip to seller mode and land on an unscoped feed.
                      final hasProfile =
                          ref.read(sellerProfileProvider).hasProfile;
                      if (val && user != null && !hasProfile) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Set up your seller profile first'),
                          ),
                        );
                        context.push('/seller/profile/setup');
                        return;
                      }
                      final newMode = val ? AppMode.seller : AppMode.buyer;
                      await ref.read(appModeProvider.notifier).setMode(newMode);
                      if (newMode == AppMode.seller) {
                        ref.read(sellerProfileProvider.notifier).loadProfile();
                      }
                    },
                  ),
                  if (appMode == AppMode.seller) ...[
                    _ProfileMenuDivider(),
                    _ProfileMenuItem(
                      icon: Icons.storefront_outlined,
                      label: 'Seller Profile',
                      onTap: () => context.push('/seller/profile'),
                    ),
                    _ProfileMenuDivider(),
                    _ProfileMenuItem(
                      icon: Icons.verified_outlined,
                      label: 'Verification',
                      // #245: reflect real seller identity verification, not
                      // emailVerified (true for every logged-in user).
                      trailing: sellerProfile?.hasIdentityVerification == true
                          ? _VerifiedBadge()
                          : null,
                      onTap: () => context.push('/seller/verification'),
                    ),
                  ],
                  if (appMode == AppMode.seller) ...[
                    _ProfileMenuDivider(),
                    _ProfileMenuItem(
                      icon: Icons.work_outline,
                      label: 'My Jobs',
                      onTap: () => context.push('/my-jobs'),
                    ),
                  ],
                  if (appMode == AppMode.buyer) ...[
                    _ProfileMenuDivider(),
                    _ProfileMenuItem(
                      icon: Icons.list_alt_outlined,
                      label: 'My Posts',
                      onTap: () => context.push('/my-posts'),
                    ),
                  ],
                  _ProfileMenuDivider(),
                  _ProfileMenuItem(
                    icon: Icons.receipt_long_outlined,
                    label: 'Transactions',
                    onTap: () => context.push('/transactions'),
                  ),
                  _ProfileMenuDivider(),
                  _ProfileMenuItem(
                    icon: Icons.bookmark_outline,
                    label: 'Saved Sellers',
                    onTap: () => context.push('/saved-sellers'),
                  ),
                  if (appMode == AppMode.seller) ...[
                    _ProfileMenuDivider(),
                    _ProfileMenuItem(
                      icon: Icons.account_balance_wallet_outlined,
                      label: 'Earnings Dashboard',
                      onTap: () => context.push('/seller/earnings'),
                    ),
                  ],
                  _ProfileMenuDivider(),
                  _ProfileMenuItem(
                    icon: Icons.credit_card_outlined,
                    label: 'Payment Methods',
                    onTap: () => context.push('/payment-methods'),
                  ),
                  _ProfileMenuDivider(),
                  _ProfileMenuItem(
                    icon: Icons.settings_outlined,
                    label: 'Settings',
                    onTap: () => context.push('/settings'),
                  ),
                  _ProfileMenuDivider(),
                  _ProfileMenuItem(
                    icon: Icons.language_outlined,
                    label: 'Language',
                    trailingText: 'English',
                    onTap: () => context.push('/settings/language'),
                  ),
                  _ProfileMenuDivider(),
                  _ProfileMenuItem(
                    icon: Icons.help_outline_rounded,
                    label: 'Help & Support',
                    onTap: () => context.push('/help'),
                    showBottomRadius: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Sign Out Button
            GestureDetector(
              onTap: () async {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) context.go('/login');
              },
              child: Container(
                height: 52,
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.07),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppColors.error.withValues(alpha: 0.2),
                  ),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.logout_rounded,
                      size: 20,
                      color: AppColors.error,
                    ),
                    SizedBox(width: 10),
                    Text(
                      'Sign Out',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: AppColors.error,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // App Version
            const Center(
              child: Text(
                'Sorcyn v1.0.0 \u00B7 Build 42',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFFD1D5DB),
                ),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

// ── Marketplace Context Selector ──

class _MarketplaceContextSelector extends StatelessWidget {
  final MarketplaceContext currentContext;
  final ValueChanged<MarketplaceContext> onChanged;

  const _MarketplaceContextSelector({
    required this.currentContext,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: MarketplaceContext.values.map((ctx) {
          final isActive = ctx == currentContext;
          return Expanded(
            child: GestureDetector(
              onTap: () => onChanged(ctx),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeInOut,
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  gradient: isActive ? AppColors.primaryGradient : null,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: isActive
                      ? [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Column(
                  children: [
                    Text(
                      ctx.label,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: isActive ? Colors.white : AppColors.grey,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _subtitleFor(ctx),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                        color: isActive
                            ? Colors.white.withValues(alpha: 0.8)
                            : AppColors.greyMedium,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  String _subtitleFor(MarketplaceContext ctx) {
    switch (ctx) {
      case MarketplaceContext.b2c:
        return 'Business to You';
      case MarketplaceContext.b2b:
        return 'Business to Biz';
      case MarketplaceContext.c2c:
        return 'Peer to Peer';
    }
  }
}

// ── Menu Item ──

class _ProfileMenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final Widget? trailing;
  final String? trailingText;
  final bool showTopRadius;
  final bool showBottomRadius;

  const _ProfileMenuItem({
    required this.icon,
    required this.label,
    this.onTap,
    this.trailing,
    this.trailingText,
    this.showTopRadius = false,
    this.showBottomRadius = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        height: 52,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.vertical(
            top: showTopRadius ? const Radius.circular(16) : Radius.zero,
            bottom: showBottomRadius ? const Radius.circular(16) : Radius.zero,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 18, color: AppColors.primary),
            ),
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
            if (trailing != null) ...[
              trailing!,
              const SizedBox(width: 8),
            ],
            if (trailingText != null) ...[
              Text(
                trailingText!,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.greyMedium,
                ),
              ),
              const SizedBox(width: 6),
            ],
            const Icon(
              Icons.chevron_right_rounded,
              size: 20,
              color: AppColors.greyMedium,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Menu Toggle Item (iOS Switch) ──

class _ProfileMenuToggleItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _ProfileMenuToggleItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: AppColors.primary),
          ),
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
          SizedBox(
            width: 44,
            height: 26,
            child: FittedBox(
              fit: BoxFit.contain,
              child: CupertinoSwitch(
                value: value,
                onChanged: onChanged,
                activeTrackColor: AppColors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Divider ──

class _ProfileMenuDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 56),
      child: Container(
        height: 1,
        color: AppColors.border.withValues(alpha: 0.6),
      ),
    );
  }
}

// ── Verified Badge ──

class _VerifiedBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.check_circle, size: 12, color: AppColors.success),
          SizedBox(width: 4),
          Text(
            'Verified',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.success,
            ),
          ),
        ],
      ),
    );
  }
}
