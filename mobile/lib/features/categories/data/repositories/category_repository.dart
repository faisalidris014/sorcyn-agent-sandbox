import 'package:dio/dio.dart';

import '../../../../core/network/dio_client.dart';
import '../models/category_model.dart';

class CategoryRepository {
  Dio get _dio => DioClient.instance;

  Future<List<CategoryTreeNode>> getCategoryTree() async {
    final response = await _dio.get('/categories/tree');
    final data = response.data['data'] as List;
    return data
        .map((e) => CategoryTreeNode.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Category>> listCategories({
    String? parentId,
    bool activeOnly = true,
    bool mvpOnly = true,
  }) async {
    final response = await _dio.get('/categories', queryParameters: {
      'parentId': ?parentId,
      'activeOnly': activeOnly,
      'mvpOnly': mvpOnly,
    });
    final data = response.data['data'] as List;
    return data
        .map((e) => Category.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
