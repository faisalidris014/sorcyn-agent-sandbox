import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_client.dart';
import '../data/models/seller_profile_model.dart';
import '../data/models/category_request_model.dart';
import '../data/repositories/seller_repository.dart';

// ── State ──

class SellerProfileState {
  final SellerProfile? profile;
  final List<VerificationRequest> verificationRequests;
  final List<CategoryRequest> categoryRequests;
  final StripeStatus? stripeStatus;
  final bool isLoading;
  final String? error;

  /// True once a profile fetch (or create) has definitively resolved — whether
  /// the result was a profile or a confirmed "no profile yet" (404). Stays
  /// false on transient/network errors. The onboarding gate keys off this so it
  /// only forces setup once we KNOW the seller has no profile, never mid-fetch
  /// or on a flaky connection. `loaded-null` vs `unknown` is the distinction
  /// `profile == null` alone can't make.
  final bool profileLoaded;

  const SellerProfileState({
    this.profile,
    this.verificationRequests = const [],
    this.categoryRequests = const [],
    this.stripeStatus,
    this.isLoading = false,
    this.error,
    this.profileLoaded = false,
  });

  bool get hasProfile => profile != null;

  SellerProfileState copyWith({
    SellerProfile? profile,
    List<VerificationRequest>? verificationRequests,
    List<CategoryRequest>? categoryRequests,
    StripeStatus? stripeStatus,
    bool? isLoading,
    String? error,
    bool? profileLoaded,
    bool clearError = false,
    bool clearProfile = false,
  }) {
    return SellerProfileState(
      profile: clearProfile ? null : (profile ?? this.profile),
      verificationRequests:
          verificationRequests ?? this.verificationRequests,
      categoryRequests: categoryRequests ?? this.categoryRequests,
      stripeStatus: stripeStatus ?? this.stripeStatus,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      profileLoaded: profileLoaded ?? this.profileLoaded,
    );
  }
}

// ── Notifier ──

class SellerProfileNotifier extends StateNotifier<SellerProfileState> {
  final SellerRepository _repository;

  SellerProfileNotifier(this._repository)
      : super(const SellerProfileState());

  Future<void> loadProfile() async {
    if (state.isLoading) return;
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final profile = await _repository.getMySellerProfile();
      // The notifier can be disposed mid-fetch when an auth change (logout /
      // account switch) invalidates sellerProfileProvider before this network
      // call returns. Guard against writing state on a dead notifier — the
      // session-reset listener fires loadProfile() fire-and-forget on every
      // transition, so this race is reachable.
      if (!mounted) return;
      state =
          state.copyWith(profile: profile, isLoading: false, profileLoaded: true);
    } catch (e) {
      if (!mounted) return;
      // A 404 from GET /sellers/me means "no seller profile yet" — a definitive
      // loaded-empty state that the onboarding gate must act on. Any other error
      // (network/5xx) leaves profileLoaded untouched so the gate never forces
      // setup on a transient failure.
      final notFound = e is DioException && e.response?.statusCode == 404;
      state = state.copyWith(
        isLoading: false,
        clearProfile: notFound,
        profileLoaded: notFound ? true : null,
        clearError: notFound,
        error: notFound ? null : _extractError(e),
      );
    }
  }

  Future<bool> createProfile({
    String? businessName,
    String? bio,
    int serviceRadiusMiles = 25,
    List<String> categories = const [],
    List<String> subcategories = const [],
    int? yearsExperience,
    String? businessWebsite,
    Map<String, dynamic>? businessHours,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final profile = await _repository.createSellerProfile(
        businessName: businessName,
        bio: bio,
        serviceRadiusMiles: serviceRadiusMiles,
        categories: categories,
        subcategories: subcategories,
        yearsExperience: yearsExperience,
        businessWebsite: businessWebsite,
        businessHours: businessHours,
      );
      state =
          state.copyWith(profile: profile, isLoading: false, profileLoaded: true);
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: _extractError(e),
      );
      return false;
    }
  }

  Future<bool> updateProfile({
    String? businessName,
    String? bio,
    int? serviceRadiusMiles,
    List<String>? categories,
    List<String>? subcategories,
    int? yearsExperience,
    String? businessWebsite,
    Map<String, dynamic>? businessHours,
    List<String>? portfolioPhotos,
    String? profilePhotoUrl,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final profile = await _repository.updateSellerProfile(
        businessName: businessName,
        bio: bio,
        serviceRadiusMiles: serviceRadiusMiles,
        categories: categories,
        subcategories: subcategories,
        yearsExperience: yearsExperience,
        businessWebsite: businessWebsite,
        businessHours: businessHours,
        portfolioPhotos: portfolioPhotos,
        profilePhotoUrl: profilePhotoUrl,
      );
      state = state.copyWith(profile: profile, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: _extractError(e),
      );
      return false;
    }
  }

  Future<bool> submitVerification({
    required String verificationType,
    required List<String> documents,
    String? licenseNumber,
    String? licenseState,
    String? licenseExpiry,
    String? insuranceProvider,
    String? insurancePolicyNumber,
    String? insuranceExpiry,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.submitVerification(
        verificationType: verificationType,
        documents: documents,
        licenseNumber: licenseNumber,
        licenseState: licenseState,
        licenseExpiry: licenseExpiry,
        insuranceProvider: insuranceProvider,
        insurancePolicyNumber: insurancePolicyNumber,
        insuranceExpiry: insuranceExpiry,
      );
      await loadVerificationRequests();
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: _extractError(e),
      );
      return false;
    }
  }

  Future<void> loadVerificationRequests() async {
    try {
      final requests = await _repository.getMyVerificationRequests();
      state = state.copyWith(verificationRequests: requests);
    } catch (_) {}
  }

  Future<void> loadStripeStatus() async {
    try {
      final status = await _repository.getStripeStatus();
      state = state.copyWith(stripeStatus: status);
    } catch (_) {}
  }

  /// Load the seller's category-access requests (fire-and-forget, swallows errors).
  Future<void> loadCategoryRequests() async {
    try {
      final requests = await _repository.getMyCategoryRequests();
      state = state.copyWith(categoryRequests: requests);
    } catch (_) {}
  }

  /// Submit a category-access request; refreshes the list and returns the
  /// router's outcome (null on failure, with [state.error] set).
  Future<CategoryRequestResult?> submitCategoryRequest({
    required String majorCategoryId,
    required List<String> subcategoryIds,
    required List<Map<String, String>> documents,
    String? licenseNumber,
    String? holderName,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _repository.submitCategoryRequest(
        majorCategoryId: majorCategoryId,
        subcategoryIds: subcategoryIds,
        documents: documents,
        licenseNumber: licenseNumber,
        holderName: holderName,
      );
      await loadCategoryRequests();
      state = state.copyWith(isLoading: false);
      return result;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _extractError(e));
      return null;
    }
  }

  Future<StripeOnboardingResult?> startStripeOnboarding() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _repository.startStripeOnboarding();
      state = state.copyWith(isLoading: false);
      return result;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: _extractError(e),
      );
      return null;
    }
  }

  Future<StripeIdentitySession?> startIdentityVerification() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _repository.startIdentityVerification();
      state = state.copyWith(isLoading: false);
      return result;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: _extractError(e),
      );
      return null;
    }
  }

  void clearProfile() {
    state = const SellerProfileState();
  }

  String _extractError(Object e) {
    if (e is DioException && e.error is ApiException) {
      return (e.error as ApiException).error.userMessage;
    }
    return 'Something went wrong. Please try again.';
  }
}

// ── Providers ──

final sellerRepositoryProvider = Provider<SellerRepository>((ref) {
  return SellerRepository();
});

final sellerProfileProvider =
    StateNotifierProvider<SellerProfileNotifier, SellerProfileState>((ref) {
  return SellerProfileNotifier(ref.read(sellerRepositoryProvider));
});

/// Verification policy + required docs for a set of selected subcategories,
/// keyed by the comma-joined subcategory id list (#338 add-category flow).
final categoryRequirementsProvider =
    FutureProvider.family<CategoryRequirements, String>((ref, idsCsv) async {
  final ids = idsCsv.split(',').where((s) => s.isNotEmpty).toList();
  if (ids.isEmpty) return CategoryRequirements();
  return ref.read(sellerRepositoryProvider).getCategoryRequirements(ids);
});
