import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_client.dart';
import '../../../core/services/push_notification_service.dart';
import '../data/models/user_model.dart';
import '../data/repositories/auth_repository.dart';

// ── Auth State ──

class AuthState {
  final User? user;
  final bool isLoading;
  final bool isInitializing;
  final String? error;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.isInitializing = true,
    this.error,
  });

  bool get isAuthenticated => user != null && user!.emailVerified;
  bool get needsEmailVerification => user != null && !user!.emailVerified;
  bool get isLoggedOut => user == null && !isInitializing;

  AuthState copyWith({
    User? user,
    bool? isLoading,
    bool? isInitializing,
    String? error,
    bool clearUser = false,
    bool clearError = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isLoading: isLoading ?? this.isLoading,
      isInitializing: isInitializing ?? this.isInitializing,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

// ── Auth Notifier ──

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(const AuthState()) {
    _init();
  }

  Future<void> _init() async {
    try {
      final isLoggedIn = await _repository.isLoggedIn();
      if (isLoggedIn) {
        final user = await _repository.getCurrentUser();
        state = AuthState(user: user, isInitializing: false);
        // Register FCM token after restoring session
        PushNotificationService.instance.registerToken();
      } else {
        state = const AuthState(isInitializing: false);
      }
    } catch (_) {
      // Token invalid or network error — treat as logged out
      await _repository.logout();
      state = const AuthState(isInitializing: false);
    }
  }

  // ── Register ──

  Future<void> register({
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
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _repository.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        accountType: accountType,
        locationZip: locationZip,
        isBusiness: isBusiness,
        ein: ein,
        businessName: businessName,
        businessType: businessType,
        salesTaxCertificateUrl: salesTaxCertificateUrl,
      );
      state = state.copyWith(user: response.user, isLoading: false);
    } catch (e) {
      state = state.copyWith(
          isLoading: false, error: _extractErrorMessage(e));
      rethrow;
    }
  }

  // ── Two-step business registration (issue #211 / #3) ──

  /// Registers a business account, then attaches the sales-tax certificate.
  ///
  /// The cert can't be uploaded during signup because POST /uploads needs an
  /// auth token, so the flow is: (1) create the account (cert deferred), which
  /// saves tokens and authenticates the Dio client, (2) run [uploadCert] — a
  /// caller-supplied closure that uploads the picked file now that we're
  /// authenticated and returns its URL, (3) attach it via PATCH
  /// /users/me/business-profile.
  ///
  /// The router redirect keys off [state.user], so it is set only at the very
  /// end — this keeps the registration screen mounted through the whole flow
  /// instead of navigating away mid-upload.
  ///
  /// Returns `true` when the cert was attached. Returns `false` when the account
  /// was created but the cert step failed: the user is still logged in (so they
  /// can finish from Settings) and publishing stays gated server-side until the
  /// cert is submitted. Throws only when account creation itself fails.
  Future<bool> registerBusiness({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
    required String accountType,
    String? locationZip,
    required String ein,
    required String businessName,
    required String businessType,
    required Future<String> Function() uploadCert,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final res = await _repository.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        accountType: accountType,
        locationZip: locationZip,
        isBusiness: true,
        ein: ein,
        businessName: businessName,
        businessType: businessType,
      );
      // Authenticated now. Attach the cert; if that fails, still log the user
      // in so they can complete it from Settings.
      try {
        final certUrl = await uploadCert();
        final user = await _repository.updateBusinessProfile(
          salesTaxCertificateUrl: certUrl,
        );
        state = state.copyWith(user: user, isLoading: false);
        return true;
      } catch (_) {
        state = state.copyWith(user: res.user, isLoading: false);
        return false;
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _extractErrorMessage(e));
      rethrow;
    }
  }

  // ── Upgrade to Business (v2.2) ──

  Future<void> upgradeToBusiness({
    required String ein,
    required String businessName,
    required String businessType,
    required String salesTaxCertificateUrl,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _repository.upgradeToBusiness(
        ein: ein,
        businessName: businessName,
        businessType: businessType,
        salesTaxCertificateUrl: salesTaxCertificateUrl,
      );
      state = state.copyWith(user: user, isLoading: false);
    } catch (e) {
      state = state.copyWith(
          isLoading: false, error: _extractErrorMessage(e));
      rethrow;
    }
  }

  // ── Update Business Profile (issue #3 / #229) ──

  /// Attach or replace the sales-tax certificate for an account that is ALREADY
  /// a business. The cert must already be uploaded (POST /uploads) — pass its
  /// public URL. The backend re-marks the cert pending and re-queues review on
  /// every change, so callers should refresh the seller profile afterward to
  /// pick up the new (pending) status.
  Future<void> updateBusinessProfile({
    required String salesTaxCertificateUrl,
    String? ein,
    String? businessName,
    String? businessType,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _repository.updateBusinessProfile(
        salesTaxCertificateUrl: salesTaxCertificateUrl,
        ein: ein,
        businessName: businessName,
        businessType: businessType,
      );
      state = state.copyWith(user: user, isLoading: false);
    } catch (e) {
      state = state.copyWith(
          isLoading: false, error: _extractErrorMessage(e));
      rethrow;
    }
  }

  // ── Login ──

  Future<void> login({
    required String email,
    required String password,
    bool rememberMe = false,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _repository.login(
        email: email,
        password: password,
        rememberMe: rememberMe,
      );
      state = state.copyWith(user: response.user, isLoading: false);
      // Register FCM token after login
      PushNotificationService.instance.registerToken();
    } catch (e) {
      state = state.copyWith(
          isLoading: false, error: _extractErrorMessage(e));
      rethrow;
    }
  }

  // ── Logout ──

  Future<void> logout() async {
    // Clear FCM token on server before logging out (best-effort)
    await PushNotificationService.instance.clearToken();
    await _repository.logout();
    // Do NOT call DioClient.reset() here. Closing the singleton orphans
    // the Dio reference cached inside authRepositoryProvider, and the
    // next same-session login throws DioExceptionType.connectionError
    // because it's posting on a closed HTTP client. Tokens are read from
    // SecureStorage per-request (cleared by _repository.logout above),
    // so the Dio carries no per-user state worth resetting.
    state = const AuthState(isInitializing: false);
  }

  // ── Verify Email ──

  Future<void> verifyEmail(String token) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.verifyEmail(token);
      final user = await _repository.getCurrentUser();
      state = state.copyWith(user: user, isLoading: false);
    } catch (e) {
      state = state.copyWith(
          isLoading: false, error: _extractErrorMessage(e));
      rethrow;
    }
  }

  // ── Refresh Current User ──

  Future<void> refreshCurrentUser() async {
    try {
      final user = await _repository.getCurrentUser();
      state = state.copyWith(user: user);
    } catch (_) {
      // Leave state unchanged on network or auth error
    }
  }

  // ── Resend Verification ──

  Future<void> resendVerification() async {
    if (state.user == null) return;
    await _repository.resendVerification(state.user!.email);
  }

  // ── Forgot Password ──

  Future<void> forgotPassword(String email) async {
    await _repository.forgotPassword(email);
  }

  // ── Reset Password ──

  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    await _repository.resetPassword(token: token, newPassword: newPassword);
  }

  // ── Update Profile ──

  Future<void> updateProfile(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _repository.updateProfile(data);
      state = state.copyWith(user: user, isLoading: false);
    } catch (e) {
      state = state.copyWith(
          isLoading: false, error: _extractErrorMessage(e));
      rethrow;
    }
  }

  // ── Update Profile Photo ──

  Future<void> updateProfilePhoto(String photoUrl) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _repository.updateProfilePhoto(photoUrl);
      state = state.copyWith(user: user, isLoading: false);
    } catch (e) {
      state = state.copyWith(
          isLoading: false, error: _extractErrorMessage(e));
      rethrow;
    }
  }

  // ── Change Password ──

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _repository.changePassword(
      currentPassword: currentPassword,
      newPassword: newPassword,
    );
  }

  // ── Delete Account ──

  Future<void> deleteAccount(String password) async {
    await _repository.deleteAccount(password);
    await logout();
  }

  // ── Helpers ──

  String _extractErrorMessage(Object e) {
    if (e is DioException && e.error is ApiException) {
      return (e.error as ApiException).error.userMessage;
    }
    if (e is DioException && e.error is NetworkException) {
      return (e.error as NetworkException).message;
    }
    if (e is DioException && e.error is AuthExpiredException) {
      return 'Session expired. Please log in again.';
    }
    return 'Something went wrong. Please try again.';
  }
}

// ── Providers ──

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authRepositoryProvider));
});
