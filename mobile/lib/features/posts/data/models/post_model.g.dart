// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'post_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Post _$PostFromJson(Map<String, dynamic> json) => Post(
  id: json['id'] as String,
  buyerId: json['buyerId'] as String,
  categoryId: json['categoryId'] as String,
  subcategoryId: json['subcategoryId'] as String?,
  title: json['title'] as String,
  description: json['description'] as String,
  photos: json['photos'] as List<dynamic>? ?? const [],
  videos: json['videos'] as List<dynamic>? ?? const [],
  budgetMin: (json['budgetMin'] as num?)?.toDouble(),
  budgetMax: (json['budgetMax'] as num?)?.toDouble(),
  budgetType: json['budgetType'] as String? ?? 'range',
  locationAddress: json['locationAddress'] as String?,
  locationCity: json['locationCity'] as String?,
  locationState: json['locationState'] as String?,
  locationZip: json['locationZip'] as String?,
  locationCountry: json['locationCountry'] as String? ?? 'US',
  latitude: (json['latitude'] as num?)?.toDouble(),
  longitude: (json['longitude'] as num?)?.toDouble(),
  urgency: json['urgency'] as String?,
  preferredDate: json['preferredDate'] as String?,
  preferredTime: json['preferredTime'] as String?,
  categorySpecific:
      json['categorySpecific'] as Map<String, dynamic>? ?? const {},
  requirements: json['requirements'] as Map<String, dynamic>? ?? const {},
  marketplaceContext: json['marketplaceContext'] as String?,
  status: json['status'] as String? ?? 'active',
  offerCount: (json['offerCount'] as num?)?.toInt() ?? 0,
  viewCount: (json['viewCount'] as num?)?.toInt() ?? 0,
  extendedCount: (json['extendedCount'] as num?)?.toInt() ?? 0,
  expiresAt: json['expiresAt'] as String?,
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
  distanceMiles: (json['distanceMiles'] as num?)?.toDouble(),
  buyer: json['buyer'] == null
      ? null
      : BuyerSummary.fromJson(json['buyer'] as Map<String, dynamic>),
  category: json['category'] as Map<String, dynamic>?,
  subcategory: json['subcategory'] as Map<String, dynamic>?,
);

Map<String, dynamic> _$PostToJson(Post instance) => <String, dynamic>{
  'id': instance.id,
  'buyerId': instance.buyerId,
  'categoryId': instance.categoryId,
  'subcategoryId': instance.subcategoryId,
  'title': instance.title,
  'description': instance.description,
  'photos': instance.photos,
  'videos': instance.videos,
  'budgetMin': instance.budgetMin,
  'budgetMax': instance.budgetMax,
  'budgetType': instance.budgetType,
  'locationAddress': instance.locationAddress,
  'locationCity': instance.locationCity,
  'locationState': instance.locationState,
  'locationZip': instance.locationZip,
  'locationCountry': instance.locationCountry,
  'latitude': instance.latitude,
  'longitude': instance.longitude,
  'urgency': instance.urgency,
  'preferredDate': instance.preferredDate,
  'preferredTime': instance.preferredTime,
  'categorySpecific': instance.categorySpecific,
  'requirements': instance.requirements,
  'marketplaceContext': instance.marketplaceContext,
  'status': instance.status,
  'offerCount': instance.offerCount,
  'viewCount': instance.viewCount,
  'extendedCount': instance.extendedCount,
  'expiresAt': instance.expiresAt,
  'createdAt': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt.toIso8601String(),
  'distanceMiles': instance.distanceMiles,
  'buyer': instance.buyer,
  'category': instance.category,
  'subcategory': instance.subcategory,
};

BuyerSummary _$BuyerSummaryFromJson(Map<String, dynamic> json) => BuyerSummary(
  id: json['id'] as String,
  firstName: json['firstName'] as String?,
  lastName: json['lastName'] as String?,
  profilePhotoUrl: json['profilePhotoUrl'] as String?,
  rating: (json['rating'] as num?)?.toDouble(),
  totalReviews: (json['totalReviews'] as num?)?.toInt() ?? 0,
  emailVerified: json['emailVerified'] as bool? ?? false,
);

Map<String, dynamic> _$BuyerSummaryToJson(BuyerSummary instance) =>
    <String, dynamic>{
      'id': instance.id,
      'firstName': instance.firstName,
      'lastName': instance.lastName,
      'profilePhotoUrl': instance.profilePhotoUrl,
      'rating': instance.rating,
      'totalReviews': instance.totalReviews,
      'emailVerified': instance.emailVerified,
    };

ParsedPost _$ParsedPostFromJson(Map<String, dynamic> json) => ParsedPost(
  title: json['title'] as String?,
  description: json['description'] as String?,
  categorySlug: json['categorySlug'] as String?,
  subcategorySlug: json['subcategorySlug'] as String?,
  budgetMin: (json['budgetMin'] as num?)?.toDouble(),
  budgetMax: (json['budgetMax'] as num?)?.toDouble(),
  budgetType: json['budgetType'] as String?,
  urgency: json['urgency'] as String?,
  preferredDate: json['preferredDate'] as String?,
  categorySpecific: json['categorySpecific'] as Map<String, dynamic>?,
  requirements: json['requirements'] as Map<String, dynamic>?,
  categoryId: json['categoryId'] as String?,
  subcategoryId: json['subcategoryId'] as String?,
);

Map<String, dynamic> _$ParsedPostToJson(ParsedPost instance) =>
    <String, dynamic>{
      'title': instance.title,
      'description': instance.description,
      'categorySlug': instance.categorySlug,
      'subcategorySlug': instance.subcategorySlug,
      'budgetMin': instance.budgetMin,
      'budgetMax': instance.budgetMax,
      'budgetType': instance.budgetType,
      'urgency': instance.urgency,
      'preferredDate': instance.preferredDate,
      'categorySpecific': instance.categorySpecific,
      'requirements': instance.requirements,
      'categoryId': instance.categoryId,
      'subcategoryId': instance.subcategoryId,
    };
