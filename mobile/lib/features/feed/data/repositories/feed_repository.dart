import 'package:dio/dio.dart';

import '../../../../core/network/api_response.dart';
import '../../../../core/network/dio_client.dart';
import '../../../posts/data/models/post_model.dart';

class FeedRepository {
  Dio get _dio => DioClient.instance;

  Future<({List<Post> posts, PaginationMeta? meta})> getFeed({
    String? categoryId,
    String? subcategoryId,
    String? search,
    double? minBudget,
    double? maxBudget,
    String? urgency,
    String? city,
    String? state,
    double? latitude,
    double? longitude,
    int? radiusMiles,
    String sort = 'newest',
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _dio.get('/posts/feed', queryParameters: {
      'categoryId': ?categoryId,
      'subcategoryId': ?subcategoryId,
      'search': ?search,
      'minBudget': ?minBudget,
      'maxBudget': ?maxBudget,
      'urgency': ?urgency,
      'city': ?city,
      'state': ?state,
      'latitude': ?latitude,
      'longitude': ?longitude,
      'radiusMiles': ?radiusMiles,
      'sort': sort,
      'page': page,
      'limit': limit,
    });
    final data = response.data['data'] as List;
    final posts =
        data.map((e) => Post.fromJson(e as Map<String, dynamic>)).toList();
    final meta = response.data['meta'] != null
        ? PaginationMeta.fromJson(
            response.data['meta'] as Map<String, dynamic>)
        : null;
    return (posts: posts, meta: meta);
  }
}
