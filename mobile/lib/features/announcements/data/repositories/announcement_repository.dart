import 'package:dio/dio.dart';

import '../../../../core/network/dio_client.dart';
import '../models/announcement_model.dart';

class AnnouncementRepository {
  Dio get _dio => DioClient.instance;

  /// Fetch the currently-active announcement banner(s). Public endpoint —
  /// no auth required, safe to poll before login.
  Future<List<Announcement>> getActive() async {
    final response = await _dio.get('/announcements/active');
    final data = response.data['data'] as List;
    return data
        .map((e) => Announcement.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
