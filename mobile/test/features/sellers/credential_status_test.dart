// Unit tests for SellerProfile credential-expiry parsing + the owner-facing
// license/insurance credential status derivation (#382).

import 'package:flutter_test/flutter_test.dart';

import 'package:reverse_marketplace/features/sellers/data/models/seller_profile_model.dart';

SellerProfile _profile({
  bool licenseVerified = false,
  bool insuranceVerified = false,
  String? licenseStatus,
  String? insuranceStatus,
}) {
  final now = DateTime(2026, 1, 1);
  return SellerProfile(
    id: 'seller-1',
    userId: 'user-1',
    licenseVerified: licenseVerified,
    insuranceVerified: insuranceVerified,
    licenseStatus: licenseStatus,
    insuranceStatus: insuranceStatus,
    createdAt: now,
    updatedAt: now,
  );
}

void main() {
  group('SellerProfile credential status (#382)', () {
    test('null status → none', () {
      expect(_profile().licenseCredentialStatus, CredentialStatus.none);
      expect(_profile().insuranceCredentialStatus, CredentialStatus.none);
    });

    test('maps raw backend strings to the enum', () {
      expect(
        _profile(licenseVerified: true, licenseStatus: 'verified')
            .licenseCredentialStatus,
        CredentialStatus.verified,
      );
      expect(
        _profile(licenseVerified: true, licenseStatus: 'expiring')
            .licenseCredentialStatus,
        CredentialStatus.expiring,
      );
      expect(
        _profile(insuranceStatus: 'expired').insuranceCredentialStatus,
        CredentialStatus.expired,
      );
    });

    test('parses expiry + status fields from the GET /sellers/me shape', () {
      final p = SellerProfile.fromJson({
        'id': 'seller-1',
        'userId': 'user-1',
        'serviceRadiusMiles': 25,
        'categories': [],
        'subcategories': [],
        'verificationTier': 3,
        'verificationBadges': ['license_verified'],
        'emailVerified': true,
        'phoneVerified': false,
        'idVerified': false,
        'licenseVerified': true,
        'insuranceVerified': false,
        'backgroundCheckVerified': false,
        'licenseExpiry': '2028-06-01T00:00:00.000Z',
        'insuranceExpiry': null,
        'licenseStatus': 'expiring',
        'insuranceStatus': null,
        'salesTaxVerified': false,
        'stripeOnboardingStatus': 'not_started',
        'stripeChargesEnabled': false,
        'stripePayoutsEnabled': false,
        'profileStrength': 30,
        'totalReviews': 0,
        'totalCompleted': 0,
        'totalActiveOffers': 0,
        'createdAt': '2026-01-01T00:00:00.000Z',
        'updatedAt': '2026-01-01T00:00:00.000Z',
      });
      expect(p.licenseExpiry, DateTime.utc(2028, 6, 1));
      expect(p.insuranceExpiry, isNull);
      expect(p.licenseCredentialStatus, CredentialStatus.expiring);
      expect(p.insuranceCredentialStatus, CredentialStatus.none);
    });
  });

  group('VerificationRequest expiry (#382)', () {
    test('parses expiresAt from JSON', () {
      final r = VerificationRequest.fromJson({
        'id': 'vr-1',
        'verificationType': 'license',
        'tier': 3,
        'status': 'approved',
        'createdAt': '2026-01-01T00:00:00.000Z',
        'expiresAt': '2028-06-01T00:00:00.000Z',
      });
      expect(r.expiresAt, DateTime.utc(2028, 6, 1));
    });

    test('tolerates a missing expiresAt', () {
      final r = VerificationRequest.fromJson({
        'id': 'vr-2',
        'verificationType': 'id',
        'tier': 2,
        'status': 'pending',
        'createdAt': '2026-01-01T00:00:00.000Z',
      });
      expect(r.expiresAt, isNull);
    });
  });
}
