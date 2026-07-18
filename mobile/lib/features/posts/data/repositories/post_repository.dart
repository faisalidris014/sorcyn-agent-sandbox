import 'package:dio/dio.dart';

import '../../../../core/network/api_response.dart';
import '../../../../core/network/dio_client.dart';
import '../models/post_model.dart';

/// Backend response for `POST /posts/:id/extend`.
class ExtendPostResult {
  final String postId;
  final DateTime? newExpiresAt;
  final int extensionsRemaining;

  ExtendPostResult({
    required this.postId,
    required this.newExpiresAt,
    required this.extensionsRemaining,
  });

  factory ExtendPostResult.fromJson(Map<String, dynamic> json) {
    final raw = json['newExpiresAt'];
    return ExtendPostResult(
      postId: json['postId'] as String,
      newExpiresAt: raw is String ? DateTime.tryParse(raw) : null,
      extensionsRemaining: (json['extensionsRemaining'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Backend response for `POST /posts/:id/mark-filled`.
class MarkFilledResult {
  final String postId;
  final String status;

  MarkFilledResult({required this.postId, required this.status});

  factory MarkFilledResult.fromJson(Map<String, dynamic> json) {
    return MarkFilledResult(
      postId: json['postId'] as String,
      status: json['status'] as String,
    );
  }
}

class PostRepository {
  Dio get _dio => DioClient.instance;

  Future<Post> createPost(Map<String, dynamic> data) async {
    final response = await _dio.post('/posts', data: data);
    return Post.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<({List<Post> posts, PaginationMeta? meta})> getMyPosts({
    String? status,
    String? categoryId,
    int page = 1,
    int limit = 20,
    String sort = 'newest',
  }) async {
    final response = await _dio.get('/posts/my-posts', queryParameters: {
      'status': ?status,
      'categoryId': ?categoryId,
      'page': page,
      'limit': limit,
      'sort': sort,
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

  Future<Post> getPostById(String postId) async {
    final response = await _dio.get('/posts/$postId');
    return Post.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<Post> updatePost(String postId, Map<String, dynamic> data) async {
    final response = await _dio.put('/posts/$postId', data: data);
    return Post.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<void> deletePost(String postId) async {
    await _dio.delete('/posts/$postId');
  }

  Future<ExtendPostResult> extendPost(String postId) async {
    final response = await _dio.post('/posts/$postId/extend');
    return ExtendPostResult.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }

  Future<MarkFilledResult> markFilled(String postId) async {
    final response = await _dio.post('/posts/$postId/mark-filled');
    return MarkFilledResult.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }

  Future<Post> repost(String postId) async {
    final response = await _dio.post('/posts/$postId/repost');
    return Post.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<ParsedPost> parseWithAI({
    required String text,
    Map<String, String>? location,
  }) async {
    final response = await _dio.post('/posts/ai/parse', data: {
      'text': text,
      'location': ?location,
    });
    return ParsedPost.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }
}
