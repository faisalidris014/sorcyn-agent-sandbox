import '../../../../core/network/dio_client.dart';
import '../models/review_model.dart';

class ReviewRepository {
  final _dio = DioClient.instance;

  Future<void> submitReview(CreateReviewInput input) async {
    await _dio.post('/reviews', data: input.toJson());
  }
}
