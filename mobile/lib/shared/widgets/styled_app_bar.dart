import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class StyledAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final VoidCallback? onBack;
  final List<Widget>? actions;
  final Widget? titleWidget;
  final bool centerTitle;

  const StyledAppBar({
    super.key,
    required this.title,
    this.onBack,
    this.actions,
    this.titleWidget,
    this.centerTitle = true,
  });

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: centerTitle,
      automaticallyImplyLeading: false,
      leading: onBack != null
          ? Padding(
              padding: const EdgeInsets.only(left: 16),
              child: Center(
                child: GestureDetector(
                  onTap: onBack,
                  child: Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.border,
                        width: 1.5,
                      ),
                    ),
                    child: const Icon(
                      Icons.chevron_left,
                      color: AppColors.black,
                      size: 22,
                    ),
                  ),
                ),
              ),
            )
          : null,
      title: titleWidget ??
          Text(
            title,
            style: const TextStyle(
              color: AppColors.black,
              fontSize: 17,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.01,
            ),
          ),
      actions: actions != null
          ? [
              ...actions!,
              const SizedBox(width: 16),
            ]
          : null,
    );
  }
}
