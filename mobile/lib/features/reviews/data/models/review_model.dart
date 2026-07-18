class CreateReviewInput {
  final String transactionId;
  final int overallRating;
  final Map<String, int>? categoryRatings;
  final String? writtenReview;
  final bool wouldRecommend;
  final List<String> completionPhotos;

  const CreateReviewInput({
    required this.transactionId,
    required this.overallRating,
    this.categoryRatings,
    this.writtenReview,
    this.wouldRecommend = true,
    this.completionPhotos = const [],
  });

  Map<String, dynamic> toJson() => {
        'transactionId': transactionId,
        'overallRating': overallRating,
        if (categoryRatings != null) 'categoryRatings': categoryRatings,
        if (writtenReview != null && writtenReview!.isNotEmpty)
          'writtenReview': writtenReview,
        'wouldRecommend': wouldRecommend,
        if (completionPhotos.isNotEmpty) 'completionPhotos': completionPhotos,
      };
}
