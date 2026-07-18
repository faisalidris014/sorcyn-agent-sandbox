import 'package:json_annotation/json_annotation.dart';

part 'offer_model.g.dart';

@JsonSerializable()
class Offer {
  final String id;
  final String postId;
  final String sellerId;
  final String offerType;
  final double quoteAmount;
  final String? pricingType;
  final double? estimatedHours;
  final String? canStart;
  final String? specificDate;
  final String? completionTime;
  final String message;
  final List<dynamic> attachments;
  final List<dynamic> photos;
  final String? terms;
  final String? warranty;
  final Map<String, dynamic> categorySpecific;
  final double? estimatedPayout;
  final double? platformFee;
  final String status;
  final String? expiresAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Nested
  final SellerSummary? seller;
  final double? bestMatchScore;

  Offer({
    required this.id,
    required this.postId,
    required this.sellerId,
    required this.offerType,
    required this.quoteAmount,
    this.pricingType,
    this.estimatedHours,
    this.canStart,
    this.specificDate,
    this.completionTime,
    required this.message,
    this.attachments = const [],
    this.photos = const [],
    this.terms,
    this.warranty,
    this.categorySpecific = const {},
    this.estimatedPayout,
    this.platformFee,
    this.status = 'pending',
    this.expiresAt,
    required this.createdAt,
    required this.updatedAt,
    this.seller,
    this.bestMatchScore,
  });

  factory Offer.fromJson(Map<String, dynamic> json) => _$OfferFromJson(json);
  Map<String, dynamic> toJson() => _$OfferToJson(this);

  bool get isPending => status == 'pending';
  bool get isAccepted => status == 'accepted';
  // Canonical OfferStatus values (backend prisma enum). The mobile UI used to
  // reference a non-canonical 'countered' that never matched, so these states
  // rendered no banner and were dropped from the stats row (#1).
  bool get isCounterOffered => status == 'counter_offered';
  bool get isNeedsReconfirmation => status == 'needs_reconfirmation';
  bool get isExpired => status == 'expired';
  bool get isWithdrawn => status == 'withdrawn';

  String get sellerName {
    if (seller?.user != null) {
      return '${seller!.user!['firstName'] ?? ''} ${seller!.user!['lastName'] ?? ''}'.trim();
    }
    return seller?.businessName ?? 'Seller';
  }

  double? get sellerRating => seller?.averageRating;
  int get sellerReviewCount => seller?.totalReviews ?? 0;

  List<String> get photoUrls =>
      photos.map((e) => e.toString()).where((s) => s.isNotEmpty).toList();
}

@JsonSerializable()
class SellerSummary {
  final String id;
  final String userId;
  final String? businessName;
  final String? bio;
  final String? profilePhotoUrl;
  // Backend (offers + transactions endpoints) serializes this as `rating`, not
  // `averageRating`. Without this mapping the field parsed null everywhere
  // SellerSummary is used — offer cards, compare/accept modals, and the buyer
  // transaction-detail seller card all silently showed no rating (#295).
  @JsonKey(name: 'rating')
  final double? averageRating;
  final int totalReviews;
  final int totalCompleted;
  final List<dynamic> verificationBadges;
  final Map<String, dynamic>? user;

  SellerSummary({
    required this.id,
    required this.userId,
    this.businessName,
    this.bio,
    this.profilePhotoUrl,
    this.averageRating,
    this.totalReviews = 0,
    this.totalCompleted = 0,
    this.verificationBadges = const [],
    this.user,
  });

  factory SellerSummary.fromJson(Map<String, dynamic> json) =>
      _$SellerSummaryFromJson(json);
  Map<String, dynamic> toJson() => _$SellerSummaryToJson(this);

  String get displayName {
    if (user != null) {
      return '${user!['firstName'] ?? ''} ${user!['lastName'] ?? ''}'.trim();
    }
    return businessName ?? 'Seller';
  }

  List<String> get badges =>
      verificationBadges.map((e) => e.toString()).toList();
}

@JsonSerializable()
class AcceptOfferResult {
  final Offer offer;
  final Map<String, dynamic> transaction;
  final Map<String, dynamic> conversation;

  AcceptOfferResult({
    required this.offer,
    required this.transaction,
    required this.conversation,
  });

  factory AcceptOfferResult.fromJson(Map<String, dynamic> json) =>
      _$AcceptOfferResultFromJson(json);
  Map<String, dynamic> toJson() => _$AcceptOfferResultToJson(this);

  String get transactionId => transaction['id'] as String;
}

@JsonSerializable()
class CreateOfferInput {
  final String postId;
  final String offerType;
  final double quoteAmount;
  final String? pricingType;
  final double? estimatedHours;
  final String? canStart;
  final String? specificDate;
  final String? completionTime;
  final String? message;
  final List<String> attachments;
  final List<String> photos;
  final String? terms;
  final String? warranty;
  final Map<String, dynamic> categorySpecific;

  CreateOfferInput({
    required this.postId,
    required this.offerType,
    required this.quoteAmount,
    this.pricingType,
    this.estimatedHours,
    this.canStart,
    this.specificDate,
    this.completionTime,
    this.message,
    this.attachments = const [],
    this.photos = const [],
    this.terms,
    this.warranty,
    this.categorySpecific = const {},
  });

  factory CreateOfferInput.fromJson(Map<String, dynamic> json) =>
      _$CreateOfferInputFromJson(json);
  Map<String, dynamic> toJson() => _$CreateOfferInputToJson(this);
}
