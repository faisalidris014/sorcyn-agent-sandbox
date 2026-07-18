import 'package:json_annotation/json_annotation.dart';

part 'post_model.g.dart';

@JsonSerializable()
class Post {
  final String id;
  final String buyerId;
  final String categoryId;
  final String? subcategoryId;
  final String title;
  final String description;
  final List<dynamic> photos;
  final List<dynamic> videos;
  final double? budgetMin;
  final double? budgetMax;
  final String budgetType;
  final String? locationAddress;
  final String? locationCity;
  final String? locationState;
  final String? locationZip;
  final String locationCountry;
  final double? latitude;
  final double? longitude;
  final String? urgency;
  final String? preferredDate;
  final String? preferredTime;
  final Map<String, dynamic> categorySpecific;
  final Map<String, dynamic> requirements;
  final String? marketplaceContext;
  final String status;
  final int offerCount;
  final int viewCount;
  final int extendedCount;
  final String? expiresAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Computed by backend when lat/lng provided (rounded to 0.1 mi)
  final double? distanceMiles;

  // Nested relations (from API includes)
  final BuyerSummary? buyer;
  final Map<String, dynamic>? category;
  final Map<String, dynamic>? subcategory;

  Post({
    required this.id,
    required this.buyerId,
    required this.categoryId,
    this.subcategoryId,
    required this.title,
    required this.description,
    this.photos = const [],
    this.videos = const [],
    this.budgetMin,
    this.budgetMax,
    this.budgetType = 'range',
    this.locationAddress,
    this.locationCity,
    this.locationState,
    this.locationZip,
    this.locationCountry = 'US',
    this.latitude,
    this.longitude,
    this.urgency,
    this.preferredDate,
    this.preferredTime,
    this.categorySpecific = const {},
    this.requirements = const {},
    this.marketplaceContext,
    this.status = 'active',
    this.offerCount = 0,
    this.viewCount = 0,
    this.extendedCount = 0,
    this.expiresAt,
    required this.createdAt,
    required this.updatedAt,
    this.distanceMiles,
    this.buyer,
    this.category,
    this.subcategory,
  });

  factory Post.fromJson(Map<String, dynamic> json) => _$PostFromJson(json);
  Map<String, dynamic> toJson() => _$PostToJson(this);

  String get categoryName => category?['name'] as String? ?? '';
  String get subcategoryName => subcategory?['name'] as String? ?? '';

  bool get isActive => status == 'active';
  bool get isDraft => status == 'draft';
  bool get isFilled => status == 'filled';
  bool get isExpired => status == 'expired';
  bool get isCancelled => status == 'cancelled';
  bool get canEdit => isDraft || isActive;
  bool get canDelete => isDraft || isActive || isFilled || isExpired || isCancelled;
  bool get canExtend => isActive && extendedCount < 1;
  bool get canRepost => isFilled || isExpired || isCancelled;
  bool get hasOffers => offerCount > 0;

  List<String> get photoUrls =>
      photos.map((e) => e.toString()).toList();

  List<String> get videoUrls =>
      videos.map((e) => e.toString()).toList();
}

/// Lightweight buyer summary embedded on post responses (feed, post detail).
///
/// The API returns only a partial buyer object
/// (`id, firstName, lastName, profilePhotoUrl, rating, totalReviews, emailVerified`).
/// Parsing it with the full shared `User` model crashed on its non-null
/// `email`/`accountType`/`createdAt` fields, blanking the seller feed — the same
/// class of bug as the `SellerSummary` fixes in #289/#296. Keep every field here
/// nullable/defaulted so a partial payload never throws.
@JsonSerializable()
class BuyerSummary {
  final String id;
  final String? firstName;
  final String? lastName;
  final String? profilePhotoUrl;
  final double? rating;
  final int totalReviews;
  final bool emailVerified;

  BuyerSummary({
    required this.id,
    this.firstName,
    this.lastName,
    this.profilePhotoUrl,
    this.rating,
    this.totalReviews = 0,
    this.emailVerified = false,
  });

  factory BuyerSummary.fromJson(Map<String, dynamic> json) =>
      _$BuyerSummaryFromJson(json);
  Map<String, dynamic> toJson() => _$BuyerSummaryToJson(this);

  String get displayName =>
      '${firstName ?? ''} ${lastName ?? ''}'.trim();
}

@JsonSerializable()
class ParsedPost {
  final String? title;
  final String? description;
  final String? categorySlug;
  final String? subcategorySlug;
  final double? budgetMin;
  final double? budgetMax;
  final String? budgetType;
  final String? urgency;
  final String? preferredDate;
  final Map<String, dynamic>? categorySpecific;
  final Map<String, dynamic>? requirements;
  final String? categoryId;
  final String? subcategoryId;

  ParsedPost({
    this.title,
    this.description,
    this.categorySlug,
    this.subcategorySlug,
    this.budgetMin,
    this.budgetMax,
    this.budgetType,
    this.urgency,
    this.preferredDate,
    this.categorySpecific,
    this.requirements,
    this.categoryId,
    this.subcategoryId,
  });

  factory ParsedPost.fromJson(Map<String, dynamic> json) =>
      _$ParsedPostFromJson(json);
  Map<String, dynamic> toJson() => _$ParsedPostToJson(this);
}
