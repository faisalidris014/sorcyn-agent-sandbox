class SavedSellerUser {
  final String id;
  final String firstName;
  final String lastName;
  final String? profilePhotoUrl;
  final String? locationCity;
  final String? locationState;

  const SavedSellerUser({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.profilePhotoUrl,
    this.locationCity,
    this.locationState,
  });

  factory SavedSellerUser.fromJson(Map<String, dynamic> json) => SavedSellerUser(
        id: json['id'] as String,
        firstName: json['firstName'] as String,
        lastName: json['lastName'] as String,
        profilePhotoUrl: json['profilePhotoUrl'] as String?,
        locationCity: json['locationCity'] as String?,
        locationState: json['locationState'] as String?,
      );

  String get displayName => '$firstName $lastName';
  String get initials =>
      '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'.toUpperCase();
  String? get locationLabel => (locationCity != null && locationState != null)
      ? '$locationCity, $locationState'
      : locationCity ?? locationState;
}

class SavedSellerProfile {
  final String id;
  final String? businessName;
  final String? profilePhotoUrl;
  final String? bio;
  final List<dynamic> categories;
  final double? rating;
  final int totalReviews;
  final int totalCompleted;
  final int verificationTier;
  final List<dynamic> verificationBadges;
  final SavedSellerUser user;

  const SavedSellerProfile({
    required this.id,
    this.businessName,
    this.profilePhotoUrl,
    this.bio,
    this.categories = const [],
    this.rating,
    this.totalReviews = 0,
    this.totalCompleted = 0,
    this.verificationTier = 1,
    this.verificationBadges = const [],
    required this.user,
  });

  factory SavedSellerProfile.fromJson(Map<String, dynamic> json) =>
      SavedSellerProfile(
        id: json['id'] as String,
        businessName: json['businessName'] as String?,
        profilePhotoUrl: json['profilePhotoUrl'] as String?,
        bio: json['bio'] as String?,
        categories: (json['categories'] as List<dynamic>?) ?? [],
        rating: (json['rating'] as num?)?.toDouble(),
        totalReviews: (json['totalReviews'] as num?)?.toInt() ?? 0,
        totalCompleted: (json['totalCompleted'] as num?)?.toInt() ?? 0,
        verificationTier: (json['verificationTier'] as num?)?.toInt() ?? 1,
        verificationBadges: (json['verificationBadges'] as List<dynamic>?) ?? [],
        user: SavedSellerUser.fromJson(json['user'] as Map<String, dynamic>),
      );

  String get displayName =>
      businessName?.isNotEmpty == true ? businessName! : user.displayName;
}

class SavedSellerEntry {
  final DateTime savedAt;
  final SavedSellerProfile seller;

  const SavedSellerEntry({required this.savedAt, required this.seller});

  factory SavedSellerEntry.fromJson(Map<String, dynamic> json) =>
      SavedSellerEntry(
        savedAt: DateTime.parse(json['savedAt'] as String),
        seller: SavedSellerProfile.fromJson(
            json['seller'] as Map<String, dynamic>),
      );
}
