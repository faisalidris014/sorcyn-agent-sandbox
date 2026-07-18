import 'package:dio/dio.dart';

import '../../../../core/config/app_config.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/storage/secure_storage.dart';
import '../models/user_model.dart';

class AuthRepository {
  Dio get _dio => DioClient.instance;

  // ── Register ──

  Future<AuthResponse> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
    String accountType = 'buyer',
    String? locationZip,
    bool isBusiness = false,
    String? ein,
    String? businessName,
    String? businessType,
    String? salesTaxCertificateUrl,
  }) async {
    final response = await _dio.post('/auth/register', data: {
      'email': email,
      'password': password,
      'firstName': firstName,
      'lastName': lastName,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
      'accountType': accountType,
      if (locationZip != null && locationZip.isNotEmpty)
        'locationZip': locationZip,
      if (isBusiness) ...{
        'isBusiness': true,
        if (ein != null && ein.isNotEmpty) 'ein': ein,
        if (businessName != null && businessName.isNotEmpty)
          'businessName': businessName,
        if (businessType != null && businessType.isNotEmpty)
          'businessType': businessType,
        if (salesTaxCertificateUrl != null && salesTaxCertificateUrl.isNotEmpty)
          'salesTaxCertificateUrl': salesTaxCertificateUrl,
      },
      'agreeToTerms': true,
      'agreeToPrivacy': true,
    });

    final authResponse =
        AuthResponse.fromJson(response.data['data'] as Map<String, dynamic>);
    await _saveTokens(authResponse.tokens);
    return authResponse;
  }

  // ── Upgrade to Business (v2.2) ──

  Future<User> upgradeToBusiness({
    required String ein,
    required String businessName,
    required String businessType,
    required String salesTaxCertificateUrl,
  }) async {
    final response = await _dio.post('/users/me/upgrade-to-business', data: {
      'ein': ein,
      'businessName': businessName,
      'businessType': businessType,
      'salesTaxCertificateUrl': salesTaxCertificateUrl,
    });
    return User.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  // ── Complete business registration (issue #3) ──

  /// Attach (or update) the sales-tax certificate for an account that is ALREADY
  /// a business. Used to finish business registration: the cert can't be
  /// uploaded during signup because POST /uploads needs an auth token the user
  /// only gets after registering. `upgrade-to-business` 409s on already-business
  /// accounts, so this PATCH is the post-registration completion path.
  Future<User> updateBusinessProfile({
    required String salesTaxCertificateUrl,
    String? ein,
    String? businessName,
    String? businessType,
  }) async {
    final response = await _dio.patch('/users/me/business-profile', data: {
      'salesTaxCertificateUrl': salesTaxCertificateUrl,
      if (ein != null && ein.isNotEmpty) 'ein': ein,
      if (businessName != null && businessName.isNotEmpty)
        'businessName': businessName,
      if (businessType != null && businessType.isNotEmpty)
        'businessType': businessType,
    });
    return User.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  // ── Login ──

  Future<AuthResponse> login({
    required String email,
    required String password,
    bool rememberMe = false,
  }) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
      'rememberMe': rememberMe,
    });

    final authResponse =
        AuthResponse.fromJson(response.data['data'] as Map<String, dynamic>);
    await _saveTokens(authResponse.tokens);
    return authResponse;
  }

  // ── Logout ──

  Future<void> logout() async {
    final refreshToken = await SecureStorage.read(AppConfig.refreshTokenKey);
    if (refreshToken != null) {
      try {
        await _dio.post('/auth/logout', data: {
          'refreshToken': refreshToken,
        });
      } catch (_) {
        // Best-effort logout on server
      }
    }
    await SecureStorage.deleteAll();
  }

  // ── Verify Email ──

  Future<void> verifyEmail(String token) async {
    await _dio.get('/auth/verify-email', queryParameters: {'token': token});
  }

  // ── Resend Verification ──

  Future<void> resendVerification(String email) async {
    await _dio.post('/auth/resend-verification', data: {'email': email});
  }

  // ── Forgot Password ──

  Future<void> forgotPassword(String email) async {
    await _dio.post('/auth/forgot-password', data: {'email': email});
  }

  // ── Reset Password ──

  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    await _dio.post('/auth/reset-password', data: {
      'token': token,
      'newPassword': newPassword,
    });
  }

  // ── Get Current User ──

  Future<User> getCurrentUser() async {
    final response = await _dio.get('/users/me');
    return User.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  // ── Update Profile ──

  Future<User> updateProfile(Map<String, dynamic> data) async {
    final response = await _dio.patch('/users/me', data: data);
    return User.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  // ── Update Profile Photo ──

  Future<User> updateProfilePhoto(String photoUrl) async {
    final response =
        await _dio.patch('/users/me/photo', data: {'photoUrl': photoUrl});
    return User.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  // ── Change Password ──

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _dio.post('/users/me/change-password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  // ── Delete Account ──

  Future<void> deleteAccount(String password) async {
    await _dio.delete('/users/me', data: {'password': password});
  }

  // ── Check Login Status ──

  Future<bool> isLoggedIn() async {
    final token = await SecureStorage.read(AppConfig.accessTokenKey);
    return token != null;
  }

  // ── Private ──

  Future<void> _saveTokens(AuthTokens tokens) async {
    await SecureStorage.write(AppConfig.accessTokenKey, tokens.accessToken);
    await SecureStorage.write(AppConfig.refreshTokenKey, tokens.refreshToken);
  }
}
