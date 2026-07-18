import 'package:dio/dio.dart';

import '../../../../core/network/dio_client.dart';
import '../models/seller_profile_model.dart';
import '../models/category_request_model.dart';

class SellerRepository {
  Dio get _dio => DioClient.instance;

  Future<SellerProfile> createSellerProfile({
    String? businessName,
    String? bio,
    int serviceRadiusMiles = 25,
    List<String> categories = const [],
    List<String> subcategories = const [],
    int? yearsExperience,
    String? businessWebsite,
    Map<String, dynamic>? businessHours,
  }) async {
    final response = await _dio.post('/sellers', data: {
      'businessName': ?businessName,
      'bio': ?bio,
      'serviceRadiusMiles': serviceRadiusMiles,
      'categories': categories,
      'subcategories': subcategories,
      'yearsExperience': ?yearsExperience,
      'businessWebsite': ?businessWebsite,
      'businessHours': ?businessHours,
    });
    return SellerProfile.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }

  Future<SellerProfile> getMySellerProfile() async {
    final response = await _dio.get('/sellers/me');
    return SellerProfile.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }

  Future<SellerProfile> updateSellerProfile({
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
    final response = await _dio.patch('/sellers/me', data: {
      'businessName': ?businessName,
      'bio': ?bio,
      'serviceRadiusMiles': ?serviceRadiusMiles,
      'categories': ?categories,
      'subcategories': ?subcategories,
      'yearsExperience': ?yearsExperience,
      'businessWebsite': ?businessWebsite,
      'businessHours': ?businessHours,
      'portfolioPhotos': ?portfolioPhotos,
      'profilePhotoUrl': ?profilePhotoUrl,
    });
    return SellerProfile.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }

  Future<VerificationRequest> submitVerification({
    required String verificationType,
    required List<String> documents,
    String? licenseNumber,
    String? licenseState,
    String? licenseExpiry,
    String? insuranceProvider,
    String? insurancePolicyNumber,
    String? insuranceExpiry,
  }) async {
    final response =
        await _dio.post('/sellers/me/verification', data: {
      'verificationType': verificationType,
      'documents': documents,
      'licenseNumber': ?licenseNumber,
      'licenseState': ?licenseState,
      'licenseExpiry': ?licenseExpiry,
      'insuranceProvider': ?insuranceProvider,
      'insurancePolicyNumber': ?insurancePolicyNumber,
      'insuranceExpiry': ?insuranceExpiry,
    });
    return VerificationRequest.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }

  Future<List<VerificationRequest>> getMyVerificationRequests() async {
    final response = await _dio.get('/sellers/me/verification');
    final data = response.data['data'] as List;
    return data
        .map((e) =>
            VerificationRequest.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<StripeOnboardingResult> startStripeOnboarding() async {
    final response = await _dio.post('/payments/seller/onboard');
    return StripeOnboardingResult.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }

  Future<StripeIdentitySession> startIdentityVerification() async {
    final response = await _dio.post('/sellers/identity/verify');
    return StripeIdentitySession.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }

  Future<StripeStatus> getStripeStatus() async {
    final response = await _dio.get('/payments/seller/status');
    return StripeStatus.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }

  // ── Category access (#338 / epic #334 Phase 4) ───────────────────

  /// The seller's own category-access requests (newest first).
  Future<List<CategoryRequest>> getMyCategoryRequests() async {
    final response = await _dio.get('/sellers/me/category-requests');
    final data = response.data['data'] as List;
    return data
        .map((e) => CategoryRequest.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Per-subcategory verification policy + required docs for the request form.
  Future<CategoryRequirements> getCategoryRequirements(
      List<String> subcategoryIds) async {
    final response = await _dio.get(
      '/sellers/category-requirements',
      queryParameters: {'subcategoryIds': subcategoryIds.join(',')},
    );
    return CategoryRequirements.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }

  /// Submit a category-access request; the backend router decides the outcome.
  Future<CategoryRequestResult> submitCategoryRequest({
    required String majorCategoryId,
    required List<String> subcategoryIds,
    required List<Map<String, String>> documents,
    String? licenseNumber,
    String? holderName,
  }) async {
    final response = await _dio.post('/sellers/me/category-requests', data: {
      'majorCategoryId': majorCategoryId,
      'subcategoryIds': subcategoryIds,
      'documents': documents,
      'licenseNumber': ?licenseNumber,
      'holderName': ?holderName,
    });
    return CategoryRequestResult.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }
}
