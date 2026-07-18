import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

class EnvConfig {
  /// Compile-time override via `--dart-define=API_BASE_URL=...`
  /// Empty string means "not provided".
  static const String _apiBaseUrlOverride = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  /// API base URL with platform-smart defaults for development.
  ///
  /// Priority:
  /// 1. Explicit `--dart-define=API_BASE_URL=<url>` — used as-is
  /// 2. Web → http://localhost:3000/api/v1
  /// 3. Android emulator → http://10.0.2.2:3000/api/v1
  /// 4. iOS simulator / fallback → http://localhost:3000/api/v1
  ///
  /// Physical devices need `--dart-define` with the Mac's local IP.
  static String get apiBaseUrl {
    if (_apiBaseUrlOverride.isNotEmpty) return _apiBaseUrlOverride;
    if (kIsWeb) return 'http://localhost:3000/api/v1';
    if (Platform.isAndroid) return 'http://10.0.2.2:3000/api/v1';
    return 'http://localhost:3000/api/v1';
  }

  static const String stripePublishableKey = String.fromEnvironment(
    'STRIPE_PUBLISHABLE_KEY',
    defaultValue: '',
  );

  static const String appName = 'Reverse Marketplace';

  static bool get isProduction =>
      const bool.fromEnvironment('dart.vm.product');

  static String get environment {
    if (isProduction) return 'production';
    return const String.fromEnvironment('ENV', defaultValue: 'development');
  }

  EnvConfig._();
}
