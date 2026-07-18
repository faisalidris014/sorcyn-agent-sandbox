// #381 — the optional-insurance data path: CategoryRequirements must parse
// `optionalDocTypes` and expose `recommendsInsurance`, which gates the optional
// insurance-certificate section on the seller add-category screen. Per-row
// `recommendsInsurance` is also parsed for completeness.

import 'package:flutter_test/flutter_test.dart';

import 'package:reverse_marketplace/features/sellers/data/models/category_request_model.dart';

void main() {
  group('CategoryRequirements optional insurance (#381)', () {
    test('parses optionalDocTypes and recommendsInsurance getter', () {
      final reqs = CategoryRequirements.fromJson({
        'subcategories': [
          {
            'subcategoryId': 'sub-1',
            'mode': 'instant',
            'isLicensed': false,
            'requiresBackgroundCheck': false,
            'recommendsInsurance': true,
          },
        ],
        'requiredDocTypes': ['id'],
        'optionalDocTypes': ['insurance'],
      });

      expect(reqs.optionalDocTypes, ['insurance']);
      expect(reqs.recommendsInsurance, isTrue);
      expect(reqs.subcategories.single.recommendsInsurance, isTrue);
      // Insurance is optional — it must not appear in required docs.
      expect(reqs.needsLicense, isFalse);
      expect(reqs.requiredDocTypes, ['id']);
    });

    test('no optionalDocTypes → recommendsInsurance is false', () {
      final reqs = CategoryRequirements.fromJson({
        'subcategories': [
          {'subcategoryId': 'sub-1', 'mode': 'instant'},
        ],
        'requiredDocTypes': ['id'],
      });

      expect(reqs.optionalDocTypes, isEmpty);
      expect(reqs.recommendsInsurance, isFalse);
      expect(reqs.subcategories.single.recommendsInsurance, isFalse);
    });

    test('defaults are safe when the field is absent (backward compatible)', () {
      // A pre-#381 backend response with no optionalDocTypes key must not throw.
      final reqs = CategoryRequirements.fromJson({
        'subcategories': [],
        'requiredDocTypes': ['id', 'license'],
      });
      expect(reqs.recommendsInsurance, isFalse);
      expect(reqs.needsLicense, isTrue);
    });
  });
}
