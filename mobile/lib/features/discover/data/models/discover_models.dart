import '../../../posts/data/models/post_model.dart';

/// One item in the buyer Discover feed (#315): a buyer post plus the pending
/// seller offers competing on it. Offers arrive oldest-first (server-ordered) so
/// the earliest seller keeps the top slot.
///
/// The Discover endpoint spreads the post fields at the top level (PII-redacted
/// via the shared redactor) alongside an `offers` array, so `Post.fromJson`
/// parses the post portion and simply ignores the extra `offers` key.
class DiscoverItem {
  final Post post;
  final List<DiscoverOffer> offers;

  const DiscoverItem({required this.post, required this.offers});

  factory DiscoverItem.fromJson(Map<String, dynamic> json) {
    final rawOffers = (json['offers'] as List?) ?? const [];
    return DiscoverItem(
      post: Post.fromJson(json),
      offers: rawOffers
          .whereType<Map<String, dynamic>>()
          .map(DiscoverOffer.fromJson)
          .toList(),
    );
  }

  int get offerCount => offers.length;
}

/// A pending seller offer attached to a Discover post. Mirrors the trimmed shape
/// the backend serializes in `getDiscoveryFeed` (no buyer PII; only the seller's
/// public business identity).
class DiscoverOffer {
  final String id;
  final String sellerId;
  final String offerType;
  final double quoteAmount;
  final String? message;
  final DateTime? createdAt;
  final DiscoverOfferSeller seller;

  const DiscoverOffer({
    required this.id,
    required this.sellerId,
    required this.offerType,
    required this.quoteAmount,
    required this.seller,
    this.message,
    this.createdAt,
  });

  factory DiscoverOffer.fromJson(Map<String, dynamic> json) {
    return DiscoverOffer(
      id: json['id'] as String? ?? '',
      sellerId: json['sellerId'] as String? ?? '',
      offerType: json['offerType'] as String? ?? '',
      quoteAmount: (json['quoteAmount'] as num?)?.toDouble() ?? 0,
      message: json['message'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      seller: DiscoverOfferSeller.fromJson(
        (json['seller'] as Map<String, dynamic>?) ?? const {},
      ),
    );
  }
}

/// Public seller identity shown on a Discover offer row.
class DiscoverOfferSeller {
  final String id;
  final String? businessName;
  final String? firstName;
  final double? rating;
  final int totalReviews;
  final int totalCompleted;
  final List<dynamic> verificationBadges;
  final String? ratingBadge;

  const DiscoverOfferSeller({
    required this.id,
    this.businessName,
    this.firstName,
    this.rating,
    this.totalReviews = 0,
    this.totalCompleted = 0,
    this.verificationBadges = const [],
    this.ratingBadge,
  });

  factory DiscoverOfferSeller.fromJson(Map<String, dynamic> json) {
    return DiscoverOfferSeller(
      id: json['id'] as String? ?? '',
      businessName: json['businessName'] as String?,
      firstName: json['firstName'] as String?,
      rating: (json['rating'] as num?)?.toDouble(),
      totalReviews: (json['totalReviews'] as num?)?.toInt() ?? 0,
      totalCompleted: (json['totalCompleted'] as num?)?.toInt() ?? 0,
      verificationBadges: (json['verificationBadges'] as List?) ?? const [],
      ratingBadge: json['ratingBadge'] as String?,
    );
  }

  String get displayName => (businessName != null && businessName!.isNotEmpty)
      ? businessName!
      : (firstName ?? 'Seller');
}

/// Args bundle passed to the Seller Offer screen via GoRouter `extra` — the
/// Discover post plus the specific offer the buyer tapped (#315).
class SellerOfferArgs {
  final DiscoverItem item;
  final DiscoverOffer offer;
  const SellerOfferArgs({required this.item, required this.offer});
}
