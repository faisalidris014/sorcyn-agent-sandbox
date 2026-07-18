import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/review_model.dart';
import '../data/repositories/review_repository.dart';

class ReviewSubmitNotifier extends StateNotifier<AsyncValue<void>> {
  final ReviewRepository _repository;

  ReviewSubmitNotifier(this._repository) : super(const AsyncData(null));

  Future<bool> submitReview(CreateReviewInput input) async {
    state = const AsyncLoading();
    try {
      await _repository.submitReview(input);
      state = const AsyncData(null);
      return true;
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
      return false;
    }
  }
}

final reviewRepositoryProvider = Provider<ReviewRepository>((ref) {
  return ReviewRepository();
});

final reviewSubmitProvider =
    StateNotifierProvider<ReviewSubmitNotifier, AsyncValue<void>>((ref) {
  return ReviewSubmitNotifier(ref.read(reviewRepositoryProvider));
});
