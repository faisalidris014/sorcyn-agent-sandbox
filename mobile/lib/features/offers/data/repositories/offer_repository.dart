import 'package:dio/dio.dart';

import '../../../../core/network/api_response.dart';
import '../../../../core/network/dio_client.dart';
import '../models/offer_model.dart';

class OfferRepository {
  Dio get _dio => DioClient.instance;

  Future<({List<Offer> offers, PaginationMeta? meta})> getPostOffers(
    String postId, {
    int page = 1,
    int limit = 20,
    String sort = 'best_match',
  }) async {
    final response =
        await _dio.get('/offers/post/$postId', queryParameters: {
      'page': page,
      'limit': limit,
      'sort': sort,
    });
    final data = response.data['data'] as List;
    final offers =
        data.map((e) => Offer.fromJson(e as Map<String, dynamic>)).toList();
    final meta = response.data['meta'] != null
        ? PaginationMeta.fromJson(
            response.data['meta'] as Map<String, dynamic>)
        : null;
    return (offers: offers, meta: meta);
  }

  Future<Offer> getOfferById(String offerId) async {
    final response = await _dio.get('/offers/$offerId');
    return Offer.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<AcceptOfferResult> acceptOffer(String offerId) async {
    final response = await _dio.post('/offers/$offerId/accept');
    return AcceptOfferResult.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }

  // ── Seller methods ──

  Future<Offer> submitOffer(CreateOfferInput input) async {
    final response = await _dio.post('/offers', data: input.toJson());
    return Offer.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<({List<Offer> offers, PaginationMeta? meta})> getMyOffers({
    String? status,
    int page = 1,
    int limit = 20,
    String sort = 'newest',
  }) async {
    final response =
        await _dio.get('/offers/my-offers', queryParameters: {
      'status': ?status,
      'page': page,
      'limit': limit,
      'sort': sort,
    });
    final data = response.data['data'] as List;
    final offers =
        data.map((e) => Offer.fromJson(e as Map<String, dynamic>)).toList();
    final meta = response.data['meta'] != null
        ? PaginationMeta.fromJson(
            response.data['meta'] as Map<String, dynamic>)
        : null;
    return (offers: offers, meta: meta);
  }

  Future<Offer> updateOffer(String offerId, Map<String, dynamic> data) async {
    final response = await _dio.put('/offers/$offerId', data: data);
    return Offer.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<void> withdrawOffer(String offerId) async {
    await _dio.delete('/offers/$offerId');
  }

  /// Buyer declines a seller's offer on their post (distinct from a seller
  /// withdrawing their own offer).
  Future<void> declineOffer(String offerId) async {
    await _dio.post('/offers/$offerId/decline');
  }

  Future<Offer> counterOffer(
    String offerId, {
    required double counterAmount,
    String? counterMessage,
  }) async {
    final response = await _dio.post('/offers/$offerId/counter', data: {
      'counterAmount': counterAmount,
      if (counterMessage != null && counterMessage.isNotEmpty)
        'counterMessage': counterMessage,
    });
    return Offer.fromJson(response.data['data'] as Map<String, dynamic>);
  }
}
