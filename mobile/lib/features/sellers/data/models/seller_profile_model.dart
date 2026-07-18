import 'package:json_annotation/json_annotation.dart';

part 'seller_profile_model.g.dart';

/// UI-facing state of a business account's sales-tax certificate.
enum SalesTaxCertStatus { none, pending, verified, rejected }

/// Owner-facing state of a license/insurance credential (#382). Mirrors the
/// backend's derived `licenseStatus`/`insuranceStatus`. `none` = not earned.
enum CredentialStatus { none, verified, expiring, expired }

CredentialStatus _credentialStatusFrom(String? raw) => switch (raw) {
      'verified' => CredentialStatus.verified,
      'expiring' => CredentialStatus.expiring,
      'expired' => CredentialStatus.expired,
      _ => CredentialStatus.none,
    };

@JsonSerializable()
class SellerProfile {
  final String id;
  final String userId;
  final String? businessName;
  final String? profilePhotoUrl;
  final int serviceRadiusMiles;
  final List<dynamic> categories;
  final List<dynamic> subcategories;
  final String? bio;
  final int? yearsExperience;
  final List<dynamic> portfolioPhotos;
  final String? businessWebsite;
  final Map<String, dynamic>? businessHours;

  // Verification
  final int verificationTier;
  final List<dynamic> verificationBadges;
  final bool emailVerified;
  final bool phoneVerified;
  final bool idVerified;
  final bool licenseVerified;
  final bool insuranceVerified;
  final bool backgroundCheckVerified;

  // Credential expiry + owner-facing derived status (#382, owner view only).
  // `*Status` is one of 'verified' | 'expiring' | 'expired' | null.
  final DateTime? licenseExpiry;
  final DateTime? insuranceExpiry;
  final String? licenseStatus;
  final String? insuranceStatus;

  // Business sales-tax certificate (owner-only — exposed on GET /sellers/me, #228)
  final String? salesTaxCertificateUrl;
  final bool salesTaxVerified;
  final String? salesTaxStatus;
  final String? salesTaxRejectionReason;

  // Stripe
  final String stripeOnboardingStatus;
  final bool stripeChargesEnabled;
  final bool stripePayoutsEnabled;

  // Stats
  final int profileStrength;
  final double? averageRating;
  final int totalReviews;
  final int totalCompleted;
  final int totalActiveOffers;
  final double? acceptanceRate;
  final double? responseTimeHours;
  final String? ratingBadge;

  final DateTime createdAt;
  final DateTime updatedAt;

  SellerProfile({
    required this.id,
    required this.userId,
    this.businessName,
    this.profilePhotoUrl,
    this.serviceRadiusMiles = 25,
    this.categories = const [],
    this.subcategories = const [],
    this.bio,
    this.yearsExperience,
    this.portfolioPhotos = const [],
    this.businessWebsite,
    this.businessHours,
    this.verificationTier = 1,
    this.verificationBadges = const [],
    this.emailVerified = false,
    this.phoneVerified = false,
    this.idVerified = false,
    this.licenseVerified = false,
    this.insuranceVerified = false,
    this.backgroundCheckVerified = false,
    this.licenseExpiry,
    this.insuranceExpiry,
    this.licenseStatus,
    this.insuranceStatus,
    this.salesTaxCertificateUrl,
    this.salesTaxVerified = false,
    this.salesTaxStatus,
    this.salesTaxRejectionReason,
    this.stripeOnboardingStatus = 'not_started',
    this.stripeChargesEnabled = false,
    this.stripePayoutsEnabled = false,
    this.profileStrength = 0,
    this.averageRating,
    this.totalReviews = 0,
    this.totalCompleted = 0,
    this.totalActiveOffers = 0,
    this.acceptanceRate,
    this.responseTimeHours,
    this.ratingBadge,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SellerProfile.fromJson(Map<String, dynamic> json) =>
      _$SellerProfileFromJson(json);
  Map<String, dynamic> toJson() => _$SellerProfileToJson(this);

  bool get isStripeOnboarded => stripeOnboardingStatus == 'completed';
  bool get canAcceptPaidOffers => stripeChargesEnabled;

  bool get hasSalesTaxCertificate =>
      salesTaxCertificateUrl != null && salesTaxCertificateUrl!.isNotEmpty;

  /// Display state for the sales-tax certificate, collapsing the raw
  /// verification status into the three UI states the cert screen renders.
  /// `under_review`/`expired` fold into [SalesTaxCertStatus.pending] since the
  /// user's only action in those cases is to wait or re-upload.
  SalesTaxCertStatus get salesTaxCertStatus {
    if (!hasSalesTaxCertificate) return SalesTaxCertStatus.none;
    if (salesTaxVerified) return SalesTaxCertStatus.verified;
    return switch (salesTaxStatus) {
      'approved' => SalesTaxCertStatus.verified,
      'rejected' => SalesTaxCertStatus.rejected,
      _ => SalesTaxCertStatus.pending,
    };
  }

  /// Owner-facing credential status (#382), collapsing the raw backend string
  /// into an enum the verification UI renders (renew prompt on expiring/expired).
  CredentialStatus get licenseCredentialStatus =>
      _credentialStatusFrom(licenseStatus);
  CredentialStatus get insuranceCredentialStatus =>
      _credentialStatusFrom(insuranceStatus);

  List<String> get badges =>
      verificationBadges.map((e) => e.toString()).toList();

  /// True when the seller holds at least one identity/credential verification
  /// (#245). Email verification is required just to use the app, so it does NOT
  /// count here — the Profile "Verification" badge must reflect real seller
  /// identity verification, not `emailVerified`.
  bool get hasIdentityVerification =>
      idVerified || licenseVerified || insuranceVerified || backgroundCheckVerified;

  List<String> get categoryIds =>
      categories.map((e) => e.toString()).toList();

  List<String> get portfolioUrls =>
      portfolioPhotos.map((e) => e.toString()).toList();

  String get ratingDisplay {
    if (averageRating == null) return 'No ratings';
    return averageRating!.toStringAsFixed(1);
  }

  String get formattedBadge {
    return switch (ratingBadge) {
      'top_rated' => 'Top Rated',
      'highly_rated' => 'Highly Rated',
      'good' => 'Good',
      '5_star_legend' => '5-Star Legend',
      _ => '',
    };
  }
}

@JsonSerializable()
class VerificationRequest {
  final String id;
  final String verificationType;
  final int tier;
  final String status;
  final DateTime createdAt;
  final String? reviewedAt;
  final String? rejectionReason;
  final DateTime? expiresAt;

  VerificationRequest({
    required this.id,
    required this.verificationType,
    required this.tier,
    required this.status,
    required this.createdAt,
    this.reviewedAt,
    this.rejectionReason,
    this.expiresAt,
  });

  factory VerificationRequest.fromJson(Map<String, dynamic> json) =>
      _$VerificationRequestFromJson(json);
  Map<String, dynamic> toJson() => _$VerificationRequestToJson(this);

  bool get isPending => status == 'pending';
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';

  String get typeDisplay {
    return switch (verificationType) {
      'id' => 'Government ID',
      'ein' => 'Business EIN',
      'sales_tax' => 'Sales Tax Certificate',
      'license' => 'Professional License',
      'insurance' => 'Insurance Certificate',
      'background_check' => 'Background Check',
      _ => _humanize(verificationType),
    };
  }

  /// Fallback so an unmapped verification type never renders as a raw enum
  /// (e.g. `foo_bar` → `Foo Bar`).
  static String _humanize(String raw) => raw
      .split('_')
      .where((w) => w.isNotEmpty)
      .map((w) => '${w[0].toUpperCase()}${w.substring(1)}')
      .join(' ');
}

@JsonSerializable()
class StripeStatus {
  final bool onboarded;
  final bool chargesEnabled;
  final bool payoutsEnabled;
  final String? accountId;

  StripeStatus({
    required this.onboarded,
    required this.chargesEnabled,
    required this.payoutsEnabled,
    this.accountId,
  });

  factory StripeStatus.fromJson(Map<String, dynamic> json) =>
      _$StripeStatusFromJson(json);
  Map<String, dynamic> toJson() => _$StripeStatusToJson(this);
}

@JsonSerializable()
class StripeOnboardingResult {
  final String url;
  final String accountId;

  StripeOnboardingResult({required this.url, required this.accountId});

  factory StripeOnboardingResult.fromJson(Map<String, dynamic> json) =>
      _$StripeOnboardingResultFromJson(json);
  Map<String, dynamic> toJson() => _$StripeOnboardingResultToJson(this);
}

/// Stripe Identity verification session — returned by
/// `POST /api/v1/sellers/identity/verify`.
///
/// Hand-rolled (no `@JsonSerializable`) so this class does not require a
/// `build_runner` round-trip; mirrors [StripeOnboardingResult] shape.
/// Backend returns `{ sessionId, url }`; tolerates `id` as a fallback for
/// the session identifier (per Stripe's raw `VerificationSession` shape).
class StripeIdentitySession {
  final String url;
  final String sessionId;

  StripeIdentitySession({required this.url, required this.sessionId});

  factory StripeIdentitySession.fromJson(Map<String, dynamic> json) =>
      StripeIdentitySession(
        url: json['url'] as String,
        sessionId: (json['sessionId'] ?? json['id']) as String,
      );
}
