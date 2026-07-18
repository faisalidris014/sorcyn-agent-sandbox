class AppConfig {
  // API Timeouts
  static const Duration connectTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 10);

  // Secure Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'cached_user';

  // Pagination
  static const int defaultPageSize = 20;

  // Validation
  static const int passwordMinLength = 8;
  static const int phoneMaxLength = 20;

  // External URLs
  static const String privacyPolicyUrl = 'https://reversemarket.com/privacy';
  static const String termsOfServiceUrl = 'https://reversemarket.com/terms';
  static const String supportEmail = 'support@reversemarket.com';

  AppConfig._();
}
