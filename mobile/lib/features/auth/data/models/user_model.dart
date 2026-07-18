import 'package:json_annotation/json_annotation.dart';

part 'user_model.g.dart';

@JsonSerializable()
class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String accountType;
  @JsonKey(defaultValue: false)
  final bool isBusiness;
  final String? ein;
  final bool emailVerified;
  final String? phone;
  final bool? phoneVerified;
  final String? profilePhotoUrl;
  final String? locationCity;
  final String? locationState;
  final String? locationZip;
  final String? locationCountry;
  final double? latitude;
  final double? longitude;
  final String? bio;
  final Map<String, dynamic>? notificationPreferences;
  final double? rating;
  final int? totalReviews;
  final int? totalTransactions;
  final String? status;
  final DateTime? lastLoginAt;
  final DateTime createdAt;
  final DateTime? updatedAt;

  User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.accountType,
    this.isBusiness = false,
    this.ein,
    required this.emailVerified,
    this.phone,
    this.phoneVerified,
    this.profilePhotoUrl,
    this.locationCity,
    this.locationState,
    this.locationZip,
    this.locationCountry,
    this.latitude,
    this.longitude,
    this.bio,
    this.notificationPreferences,
    this.rating,
    this.totalReviews,
    this.totalTransactions,
    this.status,
    this.lastLoginAt,
    required this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);

  String get fullName => '$firstName $lastName';
  bool get isBuyer => accountType == 'buyer' || accountType == 'both';
  bool get isSeller => accountType == 'seller' || accountType == 'both';
}

@JsonSerializable()
class AuthTokens {
  final String accessToken;
  final String refreshToken;
  final int expiresIn;
  final String tokenType;

  AuthTokens({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresIn,
    required this.tokenType,
  });

  factory AuthTokens.fromJson(Map<String, dynamic> json) =>
      _$AuthTokensFromJson(json);
  Map<String, dynamic> toJson() => _$AuthTokensToJson(this);
}

@JsonSerializable()
class AuthResponse {
  final User user;
  final AuthTokens tokens;

  AuthResponse({required this.user, required this.tokens});

  factory AuthResponse.fromJson(Map<String, dynamic> json) =>
      _$AuthResponseFromJson(json);
  Map<String, dynamic> toJson() => _$AuthResponseToJson(this);
}
