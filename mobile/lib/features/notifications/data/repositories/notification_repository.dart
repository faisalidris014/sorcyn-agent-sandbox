import '../../../../core/network/api_response.dart';
import '../../../../core/network/dio_client.dart';
import '../models/notification_model.dart';

class NotificationRepository {
  final _dio = DioClient.instance;

  Future<({List<AppNotification> items, PaginationMeta? meta})>
      getNotifications({
    int page = 1,
    int limit = 20,
    bool? unreadOnly,
    String? type,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (unreadOnly == true) 'unreadOnly': true,
      'type': ?type,
    };

    final response =
        await _dio.get('/notifications', queryParameters: queryParams);
    final data = response.data['data'] as Map<String, dynamic>;

    final items = (data['notifications'] as List)
        .map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
        .toList();

    final metaJson = data['meta'] as Map<String, dynamic>?;
    final meta = metaJson != null ? PaginationMeta.fromJson(metaJson) : null;

    return (items: items, meta: meta);
  }

  Future<void> markRead(String notificationId) async {
    await _dio.put('/notifications/$notificationId/read');
  }

  Future<int> markAllRead() async {
    final response = await _dio.put('/notifications/read-all');
    return response.data['data']?['count'] ?? 0;
  }

  Future<void> deleteNotification(String notificationId) async {
    await _dio.delete('/notifications/$notificationId');
  }
}
