import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/secure_storage.dart';

const _storageKey = 'preferred_language';

/// All supported languages with their native display names.
enum AppLanguage {
  en('en', 'English', 'English'),
  es('es', 'Español', 'Spanish'),
  zh('zh', '中文', 'Chinese'),
  ar('ar', 'العربية', 'Arabic'),
  fr('fr', 'Français', 'French'),
  de('de', 'Deutsch', 'German'),
  pt('pt', 'Português', 'Portuguese'),
  hi('hi', 'हिन्दी', 'Hindi'),
  vi('vi', 'Tiếng Việt', 'Vietnamese'),
  ko('ko', '한국어', 'Korean'),
  ja('ja', '日本語', 'Japanese');

  final String code;
  final String nativeName;
  final String englishName;

  const AppLanguage(this.code, this.nativeName, this.englishName);
}

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(const Locale('en')) {
    _loadSavedLocale();
  }

  Future<void> _loadSavedLocale() async {
    final saved = await SecureStorage.read(_storageKey);
    if (saved != null) {
      state = Locale(saved);
    }
  }

  Future<void> setLocale(String languageCode) async {
    state = Locale(languageCode);
    await SecureStorage.write(_storageKey, languageCode);
  }

  /// Get the current language code (e.g. 'en', 'es')
  String get languageCode => state.languageCode;
}

final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  return LocaleNotifier();
});
