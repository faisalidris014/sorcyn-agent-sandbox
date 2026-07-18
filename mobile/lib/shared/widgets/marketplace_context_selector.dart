import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/marketplace_context_provider.dart';
import '../../core/theme/app_colors.dart';

/// Horizontal chip row for selecting B2C / B2B / C2C marketplace context.
/// Place at the top of dashboard/feed screens.
class MarketplaceContextSelector extends ConsumerWidget {
  const MarketplaceContextSelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(marketplaceContextProvider);

    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 8),
      child: Row(
        children: MarketplaceContext.values.map((ctx) {
          final isSelected = ctx == current;
          return Padding(
            padding: const EdgeInsetsDirectional.only(end: 8),
            child: ChoiceChip(
              label: Text(ctx.label),
              selected: isSelected,
              onSelected: (_) {
                ref
                    .read(marketplaceContextProvider.notifier)
                    .setContext(ctx);
              },
              selectedColor: AppColors.primary,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : AppColors.black,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              ),
              backgroundColor: AppColors.greyLight,
              side: BorderSide.none,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
