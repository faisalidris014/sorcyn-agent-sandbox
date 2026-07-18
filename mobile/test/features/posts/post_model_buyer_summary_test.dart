import 'package:flutter_test/flutter_test.dart';
import 'package:reverse_marketplace/features/posts/data/models/post_model.dart';

/// Regression for the seller "Find Work" feed showing 0 results.
///
/// The feed (`GET /posts/feed`) embeds a PARTIAL buyer object
/// (`id, firstName, lastName, profilePhotoUrl, rating, totalReviews, emailVerified`)
/// with no `email` / `accountType` / `createdAt`. Parsing it with the full shared
/// `User` model threw "type 'Null' is not a subtype of type 'String'", which blew
/// up the whole `data.map(Post.fromJson)` and blanked the feed — the same class of
/// bug as the SellerSummary fixes in #289/#296. `Post.buyer` is now a `BuyerSummary`.
void main() {
  group('Post.fromJson with partial feed buyer', () {
    // Exact shape returned by GET /api/v1/posts/feed (verified against the live API).
    final feedJson = {
      'id': 'de28d2b8-962a-4e40-a174-6fd8b8560fc7',
      'buyerId': '9f4bac96-fe1c-4952-9ae8-9efbf88b3a6a',
      'categoryId': '7b69df37-1b0d-490a-bc68-8efb8541a96e',
      'subcategoryId': '60445911-01a1-4424-9ea2-8bd282a16c2e',
      'title': 'Clothing test post 1',
      'description': 'Looking for a gently used item, local pickup in Dallas.',
      'photos': <dynamic>[],
      'videos': <dynamic>[],
      'budgetMin': null,
      'budgetMax': null,
      'budgetType': null,
      'locationCity': 'Dallas',
      'locationState': 'TX',
      'latitude': null,
      'longitude': null,
      'urgency': null,
      'categorySpecific': {'condition': 'good'},
      'requirements': <String, dynamic>{},
      'marketplaceContext': 'b2c',
      'status': 'active',
      'offerCount': 0,
      'viewCount': 0,
      'expiresAt': '2026-07-14T10:59:54.883Z',
      'publicAfter': null,
      'extendedCount': 0,
      'createdAt': '2026-06-14T10:59:54.884Z',
      'updatedAt': '2026-06-14T10:59:54.920Z',
      'category': {'id': '7b69df37', 'slug': 'products', 'name': 'Products'},
      'subcategory': {'id': '60445911', 'slug': 'clothing', 'name': 'Clothing & Accessories'},
      // Partial buyer summary — the field that used to crash the parse.
      'buyer': {
        'id': '9f4bac96-fe1c-4952-9ae8-9efbf88b3a6a',
        'firstName': 'Test',
        'lastName': 'BothRoles',
        'profilePhotoUrl': null,
        'rating': null,
        'totalReviews': 0,
        'emailVerified': true,
      },
    };

    test('does not throw and parses the buyer summary', () {
      final post = Post.fromJson(feedJson);

      expect(post.id, 'de28d2b8-962a-4e40-a174-6fd8b8560fc7');
      expect(post.buyer, isNotNull);
      expect(post.buyer!.firstName, 'Test');
      expect(post.buyer!.lastName, 'BothRoles');
      expect(post.buyer!.displayName, 'Test BothRoles');
      expect(post.buyer!.rating, isNull);
      expect(post.buyer!.totalReviews, 0);
      expect(post.buyer!.emailVerified, true);
    });

    test('tolerates a buyer object missing optional fields', () {
      final json = Map<String, dynamic>.from(feedJson)
        ..['buyer'] = {'id': 'abc'};

      final post = Post.fromJson(json);
      expect(post.buyer!.id, 'abc');
      expect(post.buyer!.firstName, isNull);
      expect(post.buyer!.totalReviews, 0);
      expect(post.buyer!.emailVerified, false);
    });

    test('handles a null buyer', () {
      final json = Map<String, dynamic>.from(feedJson)..['buyer'] = null;
      final post = Post.fromJson(json);
      expect(post.buyer, isNull);
    });
  });
}
