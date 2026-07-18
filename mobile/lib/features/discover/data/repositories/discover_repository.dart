import 'package:dio/dio.dart';

import '../../../../core/network/api_response.dart';
import '../../../../core/network/dio_client.dart';
import '../models/discover_models.dart';

/// Buyer Discover feed (#315) — GET /posts/discover. Returns other buyers' posts
/// (excluding the viewer's own, server-side) that have a pending seller offer,
/// each with its offers nested oldest-first.
class DiscoverRepository {
  Dio get _dio => DioClient.instance;

  Future<({List<DiscoverItem> items, PaginationMeta? meta})> getDiscover({
    String? categoryId,
    String mode = 'foryou',
    int page = 1,
    int limit = 20,
  }) async {
    // mode (#323): foryou (default) | trending | nearby. Geo for foryou/nearby is
    // resolved server-side from the buyer's saved location, so no lat/lng is sent here.
    final response = await _dio.get('/posts/discover', queryParameters: {
      'categoryId': ?categoryId,
      'mode': mode,
      'page': page,
      'limit': limit,
    });
    final data = response.data['data'] as List;
    final items = data
        .map((e) => DiscoverItem.fromJson(e as Map<String, dynamic>))
        .toList();
    final meta = response.data['meta'] != null
        ? PaginationMeta.fromJson(response.data['meta'] as Map<String, dynamic>)
        : null;
    return (items: items, meta: meta);
  }
}
