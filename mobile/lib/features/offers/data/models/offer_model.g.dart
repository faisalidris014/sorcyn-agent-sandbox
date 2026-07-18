// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'offer_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Offer _$OfferFromJson(Map<String, dynamic> json) => Offer(
  id: json['id'] as String,
  postId: json['postId'] as String,
  sellerId: json['sellerId'] as String,
  offerType: json['offerType'] as String,
  quoteAmount: (json['quoteAmount'] as num).toDouble(),
  pricingType: json['pricingType'] as String?,
  estimatedHours: (json['estimatedHours'] as num?)?.toDouble(),
  canStart: json['canStart'] as String?,
  specificDate: json['specificDate'] as String?,
  completionTime: json['completionTime'] as String?,
  message: json['message'] as String,
  attachments: json['attachments'] as List<dynamic>? ?? const [],
  photos: json['photos'] as List<dynamic>? ?? const [],
  terms: json['terms'] as String?,
  warranty: json['warranty'] as String?,
  categorySpecific:
      json['categorySpecific'] as Map<String, dynamic>? ?? const {},
  estimatedPayout: (json['estimatedPayout'] as num?)?.toDouble(),
  platformFee: (json['platformFee'] as num?)?.toDouble(),
  status: json['status'] as String? ?? 'pending',
  expiresAt: json['expiresAt'] as String?,
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
  seller: json['seller'] == null
      ? null
      : SellerSummary.fromJson(json['seller'] as Map<String, dynamic>),
  bestMatchScore: (json['bestMatchScore'] as num?)?.toDouble(),
);

Map<String, dynamic> _$OfferToJson(Offer instance) => <String, dynamic>{
  'id': instance.id,
  'postId': instance.postId,
  'sellerId': instance.sellerId,
  'offerType': instance.offerType,
  'quoteAmount': instance.quoteAmount,
  'pricingType': instance.pricingType,
  'estimatedHours': instance.estimatedHours,
  'canStart': instance.canStart,
  'specificDate': instance.specificDate,
  'completionTime': instance.completionTime,
  'message': instance.message,
  'attachments': instance.attachments,
  'photos': instance.photos,
  'terms': instance.terms,
  'warranty': instance.warranty,
  'categorySpecific': instance.categorySpecific,
  'estimatedPayout': instance.estimatedPayout,
  'platformFee': instance.platformFee,
  'status': instance.status,
  'expiresAt': instance.expiresAt,
  'createdAt': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt.toIso8601String(),
  'seller': instance.seller,
  'bestMatchScore': instance.bestMatchScore,
};

SellerSummary _$SellerSummaryFromJson(Map<String, dynamic> json) =>
    SellerSummary(
      id: json['id'] as String,
      userId: json['userId'] as String,
      businessName: json['businessName'] as String?,
      bio: json['bio'] as String?,
      profilePhotoUrl: json['profilePhotoUrl'] as String?,
      averageRating: (json['rating'] as num?)?.toDouble(),
      totalReviews: (json['totalReviews'] as num?)?.toInt() ?? 0,
      totalCompleted: (json['totalCompleted'] as num?)?.toInt() ?? 0,
      verificationBadges:
          json['verificationBadges'] as List<dynamic>? ?? const [],
      user: json['user'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$SellerSummaryToJson(SellerSummary instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'businessName': instance.businessName,
      'bio': instance.bio,
      'profilePhotoUrl': instance.profilePhotoUrl,
      'rating': instance.averageRating,
      'totalReviews': instance.totalReviews,
      'totalCompleted': instance.totalCompleted,
      'verificationBadges': instance.verificationBadges,
      'user': instance.user,
    };

AcceptOfferResult _$AcceptOfferResultFromJson(Map<String, dynamic> json) =>
    AcceptOfferResult(
      offer: Offer.fromJson(json['offer'] as Map<String, dynamic>),
      transaction: json['transaction'] as Map<String, dynamic>,
      conversation: json['conversation'] as Map<String, dynamic>,
    );

Map<String, dynamic> _$AcceptOfferResultToJson(AcceptOfferResult instance) =>
    <String, dynamic>{
      'offer': instance.offer,
      'transaction': instance.transaction,
      'conversation': instance.conversation,
    };

CreateOfferInput _$CreateOfferInputFromJson(Map<String, dynamic> json) =>
    CreateOfferInput(
      postId: json['postId'] as String,
      offerType: json['offerType'] as String,
      quoteAmount: (json['quoteAmount'] as num).toDouble(),
      pricingType: json['pricingType'] as String?,
      estimatedHours: (json['estimatedHours'] as num?)?.toDouble(),
      canStart: json['canStart'] as String?,
      specificDate: json['specificDate'] as String?,
      completionTime: json['completionTime'] as String?,
      message: json['message'] as String?,
      attachments:
          (json['attachments'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      photos:
          (json['photos'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      terms: json['terms'] as String?,
      warranty: json['warranty'] as String?,
      categorySpecific:
          json['categorySpecific'] as Map<String, dynamic>? ?? const {},
    );

Map<String, dynamic> _$CreateOfferInputToJson(CreateOfferInput instance) =>
    <String, dynamic>{
      'postId': instance.postId,
      'offerType': instance.offerType,
      'quoteAmount': instance.quoteAmount,
      'pricingType': instance.pricingType,
      'estimatedHours': instance.estimatedHours,
      'canStart': instance.canStart,
      'specificDate': instance.specificDate,
      'completionTime': instance.completionTime,
      'message': instance.message,
      'attachments': instance.attachments,
      'photos': instance.photos,
      'terms': instance.terms,
      'warranty': instance.warranty,
      'categorySpecific': instance.categorySpecific,
    };
