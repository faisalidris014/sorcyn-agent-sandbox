import 'package:flutter_test/flutter_test.dart';
import 'package:reverse_marketplace/features/offers/data/models/offer_model.dart';

/// Regression for #295: buyer transaction-detail showed a hardcoded
/// "4.8 · 23 reviews" placeholder rating.
///
/// The shared `SellerSummary` model parsed the JSON key `averageRating`, but the
/// backend (offers endpoint `offers.service.ts` and transactions endpoint
/// `transactions.service.ts`) serializes the seller rating as `rating`. As a
/// result `averageRating` was ALWAYS null wherever `SellerSummary` is used —
/// offer cards, compare/accept modals, offer detail, and the buyer
/// transaction-detail seller card. The field is now mapped via
/// `@JsonKey(name: 'rating')`. These tests lock the mapping in place.
void main() {
  group('SellerSummary.fromJson rating mapping', () {
    // Exact seller shape emitted by GET /transactions/:id and the offers
    // endpoint (see SELLER_SUMMARY_SELECT in transactions.service.ts).
    Map<String, dynamic> sellerJson({Object? rating, int totalReviews = 0}) => {
          'id': '11111111-1111-1111-1111-111111111111',
          'userId': '22222222-2222-2222-2222-222222222222',
          'businessName': 'Acme Plumbing',
          'rating': rating,
          'totalReviews': totalReviews,
          'totalCompleted': 5,
          'verificationBadges': <dynamic>[],
          'user': {'firstName': 'Jane', 'lastName': 'Doe'},
        };

    test('maps the backend `rating` key onto averageRating', () {
      final seller = SellerSummary.fromJson(sellerJson(rating: 4.8, totalReviews: 23));

      expect(seller.averageRating, 4.8);
      expect(seller.totalReviews, 23);
    });

    test('null rating parses as null (empty-state path)', () {
      final seller = SellerSummary.fromJson(sellerJson(rating: null));

      expect(seller.averageRating, isNull);
      expect(seller.totalReviews, 0);
    });

    test('integer rating from JSON coerces to double', () {
      final seller = SellerSummary.fromJson(sellerJson(rating: 5, totalReviews: 1));

      expect(seller.averageRating, 5.0);
      expect(seller.totalReviews, 1);
    });

    test('Offer.sellerRating reads through the mapped field', () {
      final offer = Offer.fromJson({
        'id': 'o1',
        'postId': 'p1',
        'sellerId': 's1',
        'offerType': 'service',
        'quoteAmount': 100,
        'message': 'I can help with this job today.',
        'attachments': <dynamic>[],
        'categorySpecific': <String, dynamic>{},
        'status': 'pending',
        'createdAt': '2026-06-22T00:00:00.000Z',
        'updatedAt': '2026-06-22T00:00:00.000Z',
        'seller': sellerJson(rating: 4.2, totalReviews: 9),
      });

      expect(offer.sellerRating, 4.2);
    });
  });
}
