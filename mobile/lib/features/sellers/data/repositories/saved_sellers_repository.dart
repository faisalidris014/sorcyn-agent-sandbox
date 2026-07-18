import 'package:dio/dio.dart';

import '../../../../core/network/dio_client.dart';
import '../models/saved_seller_model.dart';

class SavedSellersRepository {
  Dio get _dio => DioClient.instance;

  Future<void> saveSeller(String sellerProfileId) async {
    await _dio.post('/saved-sellers/$sellerProfileId');
  }

  Future<void> unsaveSeller(String sellerProfileId) async {
    await _dio.delete('/saved-sellers/$sellerProfileId');
  }

  Future<({List<SavedSellerEntry> sellers, int total})> listSavedSellers({
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _dio.get('/saved-sellers', queryParameters: {
      'page': page,
      'limit': limit,
    });
    final data = response.data['data'] as List<dynamic>;
    final meta = response.data['meta'] as Map<String, dynamic>?;
    return (
      sellers: data
          .map((e) => SavedSellerEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: (meta?['total'] as num?)?.toInt() ?? data.length,
    );
  }

  // Fetch a seller's public profile for a userId: the profile ID (needed for the
  // save toggle) plus verification badge flags that drive the public profile
  // badges (#381). Returns null on any error / no profile.
  Future<PublicSellerVerification?> getPublicSellerVerification(
      String userId) async {
    try {
      final response = await _dio.get('/sellers/user/$userId');
      final data = response.data['data'] as Map<String, dynamic>?;
      if (data == null) return null;
      return (
        sellerProfileId: data['id'] as String?,
        idVerified: data['idVerified'] as bool? ?? false,
        licenseVerified: data['licenseVerified'] as bool? ?? false,
        insuranceVerified: data['insuranceVerified'] as bool? ?? false,
        backgroundCheckVerified:
            data['backgroundCheckVerified'] as bool? ?? false,
      );
    } on DioException {
      return null;
    }
  }
}

/// Public seller verification snapshot used by the public profile screen (#381):
/// the seller profile id + the four identity/credential badge flags exposed by
/// `GET /sellers/user/:userId`.
typedef PublicSellerVerification = ({
  String? sellerProfileId,
  bool idVerified,
  bool licenseVerified,
  bool insuranceVerified,
  bool backgroundCheckVerified,
});
