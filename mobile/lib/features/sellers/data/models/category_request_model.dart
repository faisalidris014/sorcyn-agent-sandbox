/// Seller category-access models (#338 / epic #334 Phase 4).
///
/// Hand-rolled `fromJson` (no `@JsonSerializable` / build_runner round-trip),
/// mirroring [StripeIdentitySession] in seller_profile_model.dart. Shapes match
/// the Phase 2 backend endpoints:
///   - GET  /sellers/me/category-requests     → `List<CategoryRequest>`
///   - POST /sellers/me/category-requests      → `CategoryRequestResult`
///   - GET  /sellers/category-requirements     → `CategoryRequirements`
library;

List<String> _stringList(dynamic v) =>
    v is List ? v.map((e) => e.toString()).toList() : const <String>[];

/// A seller's category-access request and its review state.
class CategoryRequest {
  final String id;
  final String majorCategoryId;
  final List<String> subcategoryIds;

  /// Raw backend status: pending | under_review | approved | rejected | expired.
  final String status;

  /// Raw outcome: auto_approve | auto_reject | queue | admin_approved | admin_rejected.
  final String? outcome;
  final String? decisionReason;
  final List<String> requiredDocTypes;
  final DateTime? createdAt;
  final String? reviewedAt;

  CategoryRequest({
    required this.id,
    required this.majorCategoryId,
    this.subcategoryIds = const [],
    this.status = 'pending',
    this.outcome,
    this.decisionReason,
    this.requiredDocTypes = const [],
    this.createdAt,
    this.reviewedAt,
  });

  factory CategoryRequest.fromJson(Map<String, dynamic> json) => CategoryRequest(
        id: json['id'] as String,
        majorCategoryId: json['majorCategoryId'] as String? ?? '',
        subcategoryIds: _stringList(json['subcategoryIds']),
        status: json['status'] as String? ?? 'pending',
        outcome: json['outcome'] as String?,
        decisionReason: json['decisionReason'] as String?,
        requiredDocTypes: _stringList(json['requiredDocTypes']),
        createdAt: json['createdAt'] != null
            ? DateTime.tryParse(json['createdAt'].toString())
            : null,
        reviewedAt: json['reviewedAt']?.toString(),
      );

  bool get isPending => status == 'pending' || status == 'under_review';
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected' || status == 'expired';

  /// A rejected request can be resubmitted; a pending one cannot.
  bool get canResubmit => isRejected;
}

/// Outcome of submitting a category-access request.
class CategoryRequestResult {
  final String id;
  final String status;
  final String outcome;
  final List<String> requiredDocTypes;

  CategoryRequestResult({
    required this.id,
    required this.status,
    required this.outcome,
    this.requiredDocTypes = const [],
  });

  factory CategoryRequestResult.fromJson(Map<String, dynamic> json) =>
      CategoryRequestResult(
        id: json['id'] as String,
        status: json['status'] as String? ?? 'pending',
        outcome: json['outcome'] as String? ?? 'queue',
        requiredDocTypes: _stringList(json['requiredDocTypes']),
      );

  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';
  bool get isPending => !isApproved && !isRejected;
}

/// Per-subcategory verification policy (one row of GET /sellers/category-requirements).
class CategoryRequirement {
  final String subcategoryId;

  /// instant | verify | manual_only.
  final String mode;
  final bool isLicensed;
  final String? licenseAuthority;
  final bool requiresBackgroundCheck;

  /// #381: this subcategory prompts an OPTIONAL insurance certificate.
  final bool recommendsInsurance;

  CategoryRequirement({
    required this.subcategoryId,
    required this.mode,
    this.isLicensed = false,
    this.licenseAuthority,
    this.requiresBackgroundCheck = false,
    this.recommendsInsurance = false,
  });

  factory CategoryRequirement.fromJson(Map<String, dynamic> json) =>
      CategoryRequirement(
        subcategoryId: json['subcategoryId'] as String,
        mode: json['mode'] as String? ?? 'instant',
        isLicensed: json['isLicensed'] as bool? ?? false,
        licenseAuthority: json['licenseAuthority'] as String?,
        requiresBackgroundCheck:
            json['requiresBackgroundCheck'] as bool? ?? false,
        recommendsInsurance: json['recommendsInsurance'] as bool? ?? false,
      );

  bool get isInstant => mode == 'instant';
}

/// Aggregated requirements for a set of requested subcategories.
class CategoryRequirements {
  final List<CategoryRequirement> subcategories;
  final List<String> requiredDocTypes;

  /// #381: optional doc types (currently just `insurance`) — earn a badge if
  /// provided, never gate access.
  final List<String> optionalDocTypes;

  CategoryRequirements({
    this.subcategories = const [],
    this.requiredDocTypes = const [],
    this.optionalDocTypes = const [],
  });

  factory CategoryRequirements.fromJson(Map<String, dynamic> json) =>
      CategoryRequirements(
        subcategories: (json['subcategories'] as List? ?? [])
            .map((e) => CategoryRequirement.fromJson(e as Map<String, dynamic>))
            .toList(),
        requiredDocTypes: _stringList(json['requiredDocTypes']),
        optionalDocTypes: _stringList(json['optionalDocTypes']),
      );

  bool get needsId => requiredDocTypes.contains('id');
  bool get needsLicense => requiredDocTypes.contains('license');
  bool get needsBackgroundCheck => requiredDocTypes.contains('background_check');

  /// #381: whether to prompt the optional insurance-certificate upload.
  bool get recommendsInsurance => optionalDocTypes.contains('insurance');

  /// All selected subs are instant → submitting unlocks immediately.
  bool get allInstant =>
      subcategories.isNotEmpty && subcategories.every((s) => s.isInstant);
}
