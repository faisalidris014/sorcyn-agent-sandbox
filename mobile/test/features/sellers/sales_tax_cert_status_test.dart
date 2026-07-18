// Unit tests for SellerProfile.salesTaxCertStatus — the derivation that drives
// the Business Profile / Sales-Tax Certificate screen badge (#229).

import 'package:flutter_test/flutter_test.dart';

import 'package:reverse_marketplace/features/sellers/data/models/seller_profile_model.dart';

SellerProfile _profile({
  String? salesTaxCertificateUrl,
  bool salesTaxVerified = false,
  String? salesTaxStatus,
  String? salesTaxRejectionReason,
}) {
  final now = DateTime(2026, 1, 1);
  return SellerProfile(
    id: 'seller-1',
    userId: 'user-1',
    salesTaxCertificateUrl: salesTaxCertificateUrl,
    salesTaxVerified: salesTaxVerified,
    salesTaxStatus: salesTaxStatus,
    salesTaxRejectionReason: salesTaxRejectionReason,
    createdAt: now,
    updatedAt: now,
  );
}

void main() {
  group('SellerProfile.salesTaxCertStatus', () {
    test('no cert → none', () {
      expect(_profile().salesTaxCertStatus, SalesTaxCertStatus.none);
      expect(_profile(salesTaxCertificateUrl: '').salesTaxCertStatus,
          SalesTaxCertStatus.none);
      expect(_profile().hasSalesTaxCertificate, isFalse);
    });

    test('cert with pending status → pending', () {
      final p = _profile(
        salesTaxCertificateUrl: 'https://r2.example.com/cert.png',
        salesTaxStatus: 'pending',
      );
      expect(p.salesTaxCertStatus, SalesTaxCertStatus.pending);
      expect(p.hasSalesTaxCertificate, isTrue);
    });

    test('under_review and expired fold into pending', () {
      expect(
        _profile(
          salesTaxCertificateUrl: 'https://r2.example.com/cert.png',
          salesTaxStatus: 'under_review',
        ).salesTaxCertStatus,
        SalesTaxCertStatus.pending,
      );
      expect(
        _profile(
          salesTaxCertificateUrl: 'https://r2.example.com/cert.png',
          salesTaxStatus: 'expired',
        ).salesTaxCertStatus,
        SalesTaxCertStatus.pending,
      );
    });

    test('salesTaxVerified flag wins → verified', () {
      final p = _profile(
        salesTaxCertificateUrl: 'https://r2.example.com/cert.png',
        salesTaxVerified: true,
        salesTaxStatus: 'approved',
      );
      expect(p.salesTaxCertStatus, SalesTaxCertStatus.verified);
    });

    test('approved status (flag not yet set) → verified', () {
      final p = _profile(
        salesTaxCertificateUrl: 'https://r2.example.com/cert.png',
        salesTaxStatus: 'approved',
      );
      expect(p.salesTaxCertStatus, SalesTaxCertStatus.verified);
    });

    test('rejected status → rejected, with reason retained', () {
      final p = _profile(
        salesTaxCertificateUrl: 'https://r2.example.com/cert.png',
        salesTaxStatus: 'rejected',
        salesTaxRejectionReason: 'Certificate is expired',
      );
      expect(p.salesTaxCertStatus, SalesTaxCertStatus.rejected);
      expect(p.salesTaxRejectionReason, 'Certificate is expired');
    });

    test('parses sales-tax fields from JSON (GET /sellers/me shape)', () {
      final p = SellerProfile.fromJson({
        'id': 'seller-1',
        'userId': 'user-1',
        'serviceRadiusMiles': 25,
        'categories': [],
        'subcategories': [],
        'verificationTier': 1,
        'verificationBadges': [],
        'emailVerified': true,
        'phoneVerified': false,
        'idVerified': false,
        'licenseVerified': false,
        'insuranceVerified': false,
        'backgroundCheckVerified': false,
        'salesTaxCertificateUrl': 'https://r2.example.com/cert.png',
        'salesTaxVerified': false,
        'salesTaxStatus': 'rejected',
        'salesTaxRejectionReason': 'Blurry scan',
        'stripeOnboardingStatus': 'not_started',
        'stripeChargesEnabled': false,
        'stripePayoutsEnabled': false,
        'profileStrength': 10,
        'totalReviews': 0,
        'totalCompleted': 0,
        'totalActiveOffers': 0,
        'createdAt': '2026-01-01T00:00:00.000Z',
        'updatedAt': '2026-01-01T00:00:00.000Z',
      });
      expect(p.salesTaxCertificateUrl, 'https://r2.example.com/cert.png');
      expect(p.salesTaxCertStatus, SalesTaxCertStatus.rejected);
      expect(p.salesTaxRejectionReason, 'Blurry scan');
    });
  });
}
