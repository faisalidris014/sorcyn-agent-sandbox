// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'seller_profile_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SellerProfile _$SellerProfileFromJson(
  Map<String, dynamic> json,
) => SellerProfile(
  id: json['id'] as String,
  userId: json['userId'] as String,
  businessName: json['businessName'] as String?,
  profilePhotoUrl: json['profilePhotoUrl'] as String?,
  serviceRadiusMiles: (json['serviceRadiusMiles'] as num?)?.toInt() ?? 25,
  categories: json['categories'] as List<dynamic>? ?? const [],
  subcategories: json['subcategories'] as List<dynamic>? ?? const [],
  bio: json['bio'] as String?,
  yearsExperience: (json['yearsExperience'] as num?)?.toInt(),
  portfolioPhotos: json['portfolioPhotos'] as List<dynamic>? ?? const [],
  businessWebsite: json['businessWebsite'] as String?,
  businessHours: json['businessHours'] as Map<String, dynamic>?,
  verificationTier: (json['verificationTier'] as num?)?.toInt() ?? 1,
  verificationBadges: json['verificationBadges'] as List<dynamic>? ?? const [],
  emailVerified: json['emailVerified'] as bool? ?? false,
  phoneVerified: json['phoneVerified'] as bool? ?? false,
  idVerified: json['idVerified'] as bool? ?? false,
  licenseVerified: json['licenseVerified'] as bool? ?? false,
  insuranceVerified: json['insuranceVerified'] as bool? ?? false,
  backgroundCheckVerified: json['backgroundCheckVerified'] as bool? ?? false,
  licenseExpiry: json['licenseExpiry'] == null
      ? null
      : DateTime.parse(json['licenseExpiry'] as String),
  insuranceExpiry: json['insuranceExpiry'] == null
      ? null
      : DateTime.parse(json['insuranceExpiry'] as String),
  licenseStatus: json['licenseStatus'] as String?,
  insuranceStatus: json['insuranceStatus'] as String?,
  salesTaxCertificateUrl: json['salesTaxCertificateUrl'] as String?,
  salesTaxVerified: json['salesTaxVerified'] as bool? ?? false,
  salesTaxStatus: json['salesTaxStatus'] as String?,
  salesTaxRejectionReason: json['salesTaxRejectionReason'] as String?,
  stripeOnboardingStatus:
      json['stripeOnboardingStatus'] as String? ?? 'not_started',
  stripeChargesEnabled: json['stripeChargesEnabled'] as bool? ?? false,
  stripePayoutsEnabled: json['stripePayoutsEnabled'] as bool? ?? false,
  profileStrength: (json['profileStrength'] as num?)?.toInt() ?? 0,
  averageRating: (json['averageRating'] as num?)?.toDouble(),
  totalReviews: (json['totalReviews'] as num?)?.toInt() ?? 0,
  totalCompleted: (json['totalCompleted'] as num?)?.toInt() ?? 0,
  totalActiveOffers: (json['totalActiveOffers'] as num?)?.toInt() ?? 0,
  acceptanceRate: (json['acceptanceRate'] as num?)?.toDouble(),
  responseTimeHours: (json['responseTimeHours'] as num?)?.toDouble(),
  ratingBadge: json['ratingBadge'] as String?,
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$SellerProfileToJson(SellerProfile instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'businessName': instance.businessName,
      'profilePhotoUrl': instance.profilePhotoUrl,
      'serviceRadiusMiles': instance.serviceRadiusMiles,
      'categories': instance.categories,
      'subcategories': instance.subcategories,
      'bio': instance.bio,
      'yearsExperience': instance.yearsExperience,
      'portfolioPhotos': instance.portfolioPhotos,
      'businessWebsite': instance.businessWebsite,
      'businessHours': instance.businessHours,
      'verificationTier': instance.verificationTier,
      'verificationBadges': instance.verificationBadges,
      'emailVerified': instance.emailVerified,
      'phoneVerified': instance.phoneVerified,
      'idVerified': instance.idVerified,
      'licenseVerified': instance.licenseVerified,
      'insuranceVerified': instance.insuranceVerified,
      'backgroundCheckVerified': instance.backgroundCheckVerified,
      'licenseExpiry': instance.licenseExpiry?.toIso8601String(),
      'insuranceExpiry': instance.insuranceExpiry?.toIso8601String(),
      'licenseStatus': instance.licenseStatus,
      'insuranceStatus': instance.insuranceStatus,
      'salesTaxCertificateUrl': instance.salesTaxCertificateUrl,
      'salesTaxVerified': instance.salesTaxVerified,
      'salesTaxStatus': instance.salesTaxStatus,
      'salesTaxRejectionReason': instance.salesTaxRejectionReason,
      'stripeOnboardingStatus': instance.stripeOnboardingStatus,
      'stripeChargesEnabled': instance.stripeChargesEnabled,
      'stripePayoutsEnabled': instance.stripePayoutsEnabled,
      'profileStrength': instance.profileStrength,
      'averageRating': instance.averageRating,
      'totalReviews': instance.totalReviews,
      'totalCompleted': instance.totalCompleted,
      'totalActiveOffers': instance.totalActiveOffers,
      'acceptanceRate': instance.acceptanceRate,
      'responseTimeHours': instance.responseTimeHours,
      'ratingBadge': instance.ratingBadge,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

VerificationRequest _$VerificationRequestFromJson(Map<String, dynamic> json) =>
    VerificationRequest(
      id: json['id'] as String,
      verificationType: json['verificationType'] as String,
      tier: (json['tier'] as num).toInt(),
      status: json['status'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      reviewedAt: json['reviewedAt'] as String?,
      rejectionReason: json['rejectionReason'] as String?,
      expiresAt: json['expiresAt'] == null
          ? null
          : DateTime.parse(json['expiresAt'] as String),
    );

Map<String, dynamic> _$VerificationRequestToJson(
  VerificationRequest instance,
) => <String, dynamic>{
  'id': instance.id,
  'verificationType': instance.verificationType,
  'tier': instance.tier,
  'status': instance.status,
  'createdAt': instance.createdAt.toIso8601String(),
  'reviewedAt': instance.reviewedAt,
  'rejectionReason': instance.rejectionReason,
  'expiresAt': instance.expiresAt?.toIso8601String(),
};

StripeStatus _$StripeStatusFromJson(Map<String, dynamic> json) => StripeStatus(
  onboarded: json['onboarded'] as bool,
  chargesEnabled: json['chargesEnabled'] as bool,
  payoutsEnabled: json['payoutsEnabled'] as bool,
  accountId: json['accountId'] as String?,
);

Map<String, dynamic> _$StripeStatusToJson(StripeStatus instance) =>
    <String, dynamic>{
      'onboarded': instance.onboarded,
      'chargesEnabled': instance.chargesEnabled,
      'payoutsEnabled': instance.payoutsEnabled,
      'accountId': instance.accountId,
    };

StripeOnboardingResult _$StripeOnboardingResultFromJson(
  Map<String, dynamic> json,
) => StripeOnboardingResult(
  url: json['url'] as String,
  accountId: json['accountId'] as String,
);

Map<String, dynamic> _$StripeOnboardingResultToJson(
  StripeOnboardingResult instance,
) => <String, dynamic>{'url': instance.url, 'accountId': instance.accountId};
