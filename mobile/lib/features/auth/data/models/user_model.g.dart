// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

User _$UserFromJson(Map<String, dynamic> json) => User(
  id: json['id'] as String,
  email: json['email'] as String,
  firstName: json['firstName'] as String,
  lastName: json['lastName'] as String,
  accountType: json['accountType'] as String,
  isBusiness: json['isBusiness'] as bool? ?? false,
  ein: json['ein'] as String?,
  emailVerified: json['emailVerified'] as bool,
  phone: json['phone'] as String?,
  phoneVerified: json['phoneVerified'] as bool?,
  profilePhotoUrl: json['profilePhotoUrl'] as String?,
  locationCity: json['locationCity'] as String?,
  locationState: json['locationState'] as String?,
  locationZip: json['locationZip'] as String?,
  locationCountry: json['locationCountry'] as String?,
  latitude: (json['latitude'] as num?)?.toDouble(),
  longitude: (json['longitude'] as num?)?.toDouble(),
  bio: json['bio'] as String?,
  notificationPreferences:
      json['notificationPreferences'] as Map<String, dynamic>?,
  rating: (json['rating'] as num?)?.toDouble(),
  totalReviews: (json['totalReviews'] as num?)?.toInt(),
  totalTransactions: (json['totalTransactions'] as num?)?.toInt(),
  status: json['status'] as String?,
  lastLoginAt: json['lastLoginAt'] == null
      ? null
      : DateTime.parse(json['lastLoginAt'] as String),
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: json['updatedAt'] == null
      ? null
      : DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$UserToJson(User instance) => <String, dynamic>{
  'id': instance.id,
  'email': instance.email,
  'firstName': instance.firstName,
  'lastName': instance.lastName,
  'accountType': instance.accountType,
  'isBusiness': instance.isBusiness,
  'ein': instance.ein,
  'emailVerified': instance.emailVerified,
  'phone': instance.phone,
  'phoneVerified': instance.phoneVerified,
  'profilePhotoUrl': instance.profilePhotoUrl,
  'locationCity': instance.locationCity,
  'locationState': instance.locationState,
  'locationZip': instance.locationZip,
  'locationCountry': instance.locationCountry,
  'latitude': instance.latitude,
  'longitude': instance.longitude,
  'bio': instance.bio,
  'notificationPreferences': instance.notificationPreferences,
  'rating': instance.rating,
  'totalReviews': instance.totalReviews,
  'totalTransactions': instance.totalTransactions,
  'status': instance.status,
  'lastLoginAt': instance.lastLoginAt?.toIso8601String(),
  'createdAt': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt?.toIso8601String(),
};

AuthTokens _$AuthTokensFromJson(Map<String, dynamic> json) => AuthTokens(
  accessToken: json['accessToken'] as String,
  refreshToken: json['refreshToken'] as String,
  expiresIn: (json['expiresIn'] as num).toInt(),
  tokenType: json['tokenType'] as String,
);

Map<String, dynamic> _$AuthTokensToJson(AuthTokens instance) =>
    <String, dynamic>{
      'accessToken': instance.accessToken,
      'refreshToken': instance.refreshToken,
      'expiresIn': instance.expiresIn,
      'tokenType': instance.tokenType,
    };

AuthResponse _$AuthResponseFromJson(Map<String, dynamic> json) => AuthResponse(
  user: User.fromJson(json['user'] as Map<String, dynamic>),
  tokens: AuthTokens.fromJson(json['tokens'] as Map<String, dynamic>),
);

Map<String, dynamic> _$AuthResponseToJson(AuthResponse instance) =>
    <String, dynamic>{'user': instance.user, 'tokens': instance.tokens};
