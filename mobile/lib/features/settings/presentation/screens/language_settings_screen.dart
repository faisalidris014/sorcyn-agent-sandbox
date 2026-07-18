import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/providers/locale_provider.dart';
import '../../../../core/theme/app_colors.dart';

/// Languages displayed in the settings screen (ordered per TSX design).
const List<AppLanguage> _displayLanguages = [
  AppLanguage.en,
  AppLanguage.es,
  AppLanguage.fr,
  AppLanguage.de,
  AppLanguage.pt,
  AppLanguage.zh,
  AppLanguage.ar,
  AppLanguage.vi,
];

class LanguageSettingsScreen extends ConsumerWidget {
  const LanguageSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentLocale = ref.watch(localeProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Custom Header
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
                        color: const Color(0xFFF9FAFB),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: const Color(0xFFE5E7EB),
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
                    'Language',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: AppColors.black,
                      letterSpacing: -0.01,
                    ),
                  ),
                ],
              ),
            ),

            // Body
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF9FAFB),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    children: [
                      for (int i = 0; i < _displayLanguages.length; i++) ...[
                        _LanguageItem(
                          lang: _displayLanguages[i],
                          isSelected: currentLocale.languageCode ==
                              _displayLanguages[i].code,
                          onTap: () => ref
                              .read(localeProvider.notifier)
                              .setLocale(_displayLanguages[i].code),
                        ),
                        if (i < _displayLanguages.length - 1)
                          const Padding(
                            padding: EdgeInsets.only(left: 56),
                            child: Divider(
                              height: 1,
                              thickness: 1,
                              color: Color(0xFFF0F0F2),
                            ),
                          ),
                      ],
                    ],
                  ),
                ),
              ),
            ),

            // Bottom note
            const Padding(
              padding: EdgeInsets.only(bottom: 28, top: 16),
              child: Text(
                'Language changes apply immediately.',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF9CA3AF),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LanguageItem extends StatelessWidget {
  final AppLanguage lang;
  final bool isSelected;
  final VoidCallback onTap;

  const _LanguageItem({
    required this.lang,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isSelected
          ? const Color(0xFF7C3AED).withValues(alpha: 0.04)
          : Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          height: 56,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              // Radio indicator
              Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isSelected
                      ? const Color(0xFF7C3AED)
                      : Colors.white,
                  border: Border.all(
                    color: isSelected
                        ? const Color(0xFF7C3AED)
                        : const Color(0xFFD1D5DB),
                    width: 2,
                  ),
                ),
                child: isSelected
                    ? Center(
                        child: Container(
                          width: 7,
                          height: 7,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                          ),
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 12),
              // Language names
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lang.nativeName,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight:
                            isSelected ? FontWeight.w600 : FontWeight.w500,
                        color: AppColors.black,
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      lang.englishName,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF9CA3AF),
                      ),
                    ),
                  ],
                ),
              ),
              // Selected checkmark
              if (isSelected)
                Container(
                  width: 22,
                  height: 22,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFF7C3AED),
                        Color(0xFFA855F7),
                      ],
                    ),
                  ),
                  child: const Icon(
                    Icons.check,
                    size: 13,
                    color: Colors.white,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
