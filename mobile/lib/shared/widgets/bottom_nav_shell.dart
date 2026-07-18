import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/app_mode_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../features/messages/providers/conversations_provider.dart';

class BottomNavShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const BottomNavShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appMode = ref.watch(appModeProvider);
    final isSeller = appMode == AppMode.seller;
    final unreadCount = ref.watch(unreadCountProvider);

    return Scaffold(
      body: navigationShell,
      extendBody: true,
      bottomNavigationBar: _CustomBottomNav(
        currentIndex: navigationShell.currentIndex,
        isSeller: isSeller,
        unreadCount: unreadCount,
        onTap: (index) {
          navigationShell.goBranch(
            index,
            initialLocation: index == navigationShell.currentIndex,
          );
        },
        onCreatePost:
            isSeller ? null : () => context.push('/posts/create'),
      ),
    );
  }
}

class _CustomBottomNav extends StatelessWidget {
  final int currentIndex;
  final bool isSeller;
  final int unreadCount;
  final ValueChanged<int> onTap;
  final VoidCallback? onCreatePost;

  const _CustomBottomNav({
    required this.currentIndex,
    required this.isSeller,
    required this.unreadCount,
    required this.onTap,
    this.onCreatePost,
  });

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    final items = isSeller ? _sellerItems : _buyerItems;
    // Buyer mode renders 5 visual slots; the center slot (index 2) is the +
    // button and does not map to a navigation branch.
    final totalSlots = (!isSeller) ? items.length + 1 : items.length;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.96),
        border: Border(
          top: BorderSide(color: Colors.black.withValues(alpha: 0.06)),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      padding: EdgeInsets.only(bottom: bottomPadding, top: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(totalSlots, (i) {
          // Center slot in buyer mode: purple + button
          if (!isSeller && i == 2) {
            return _CenterCreateButton(onPressed: onCreatePost);
          }

          // Map visual slot index → nav item index and branch index.
          // In buyer mode slots 3,4 shift down by 1 to account for the +.
          final itemIndex = (!isSeller && i > 2) ? i - 1 : i;
          final item = items[itemIndex];
          final isActive = currentIndex == itemIndex;
          final showBadge = item.hasBadge && unreadCount > 0;

          return GestureDetector(
            onTap: () => onTap(itemIndex),
            behavior: HitTestBehavior.opaque,
            child: SizedBox(
              width: 64,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Icon(
                        isActive ? item.activeIcon : item.icon,
                        size: 22,
                        color: isActive
                            ? AppColors.primary
                            : AppColors.greyMedium,
                      ),
                      if (showBadge)
                        Positioned(
                          top: -4,
                          right: -8,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 4,
                            ),
                            constraints: const BoxConstraints(
                              minWidth: 17,
                              minHeight: 17,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.error,
                              borderRadius: BorderRadius.circular(9),
                              border: Border.all(
                                color: Colors.white,
                                width: 1.5,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                '$unreadCount',
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.label,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                      color: isActive
                          ? AppColors.primary
                          : AppColors.greyMedium,
                    ),
                  ),
                  const SizedBox(height: 4),
                  // Active indicator dot
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: isActive ? 20 : 0,
                    height: 3,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(2),
                      gradient: isActive ? AppColors.primaryGradient : null,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }

  static const _buyerItems = [
    _NavItem(
      icon: Icons.home_outlined,
      activeIcon: Icons.home,
      label: 'Home',
    ),
    _NavItem(
      icon: Icons.explore_outlined,
      activeIcon: Icons.explore,
      label: 'Discover',
    ),
    _NavItem(
      icon: Icons.chat_bubble_outline,
      activeIcon: Icons.chat_bubble,
      label: 'Messages',
      hasBadge: true,
    ),
    _NavItem(
      icon: Icons.person_outline,
      activeIcon: Icons.person,
      label: 'Profile',
    ),
  ];

  static const _sellerItems = [
    _NavItem(
      icon: Icons.explore_outlined,
      activeIcon: Icons.explore,
      label: 'Feed',
    ),
    _NavItem(
      icon: Icons.local_offer_outlined,
      activeIcon: Icons.local_offer,
      label: 'My Offers',
    ),
    _NavItem(
      icon: Icons.chat_bubble_outline,
      activeIcon: Icons.chat_bubble,
      label: 'Messages',
      hasBadge: true,
    ),
    _NavItem(
      icon: Icons.person_outline,
      activeIcon: Icons.person,
      label: 'Profile',
    ),
  ];
}

class _CenterCreateButton extends StatefulWidget {
  final VoidCallback? onPressed;

  const _CenterCreateButton({this.onPressed});

  @override
  State<_CenterCreateButton> createState() => _CenterCreateButtonState();
}

class _CenterCreateButtonState extends State<_CenterCreateButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 64,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onTapDown: widget.onPressed == null
                ? null
                : (_) => setState(() => _pressed = true),
            onTapUp: widget.onPressed == null
                ? null
                : (_) {
                    setState(() => _pressed = false);
                    widget.onPressed?.call();
                  },
            onTapCancel: widget.onPressed == null
                ? null
                : () => setState(() => _pressed = false),
            child: AnimatedScale(
              scale: _pressed ? 0.92 : 1.0,
              duration: const Duration(milliseconds: 100),
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppColors.primary, AppColors.secondaryPurple],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.35),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.add,
                  color: Colors.white,
                  size: 26,
                ),
              ),
            ),
          ),
          // Spacer to align with the label + dot rows of sibling items
          const SizedBox(height: 11),
        ],
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool hasBadge;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    this.hasBadge = false,
  });
}
