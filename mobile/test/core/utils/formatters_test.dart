import 'package:flutter_test/flutter_test.dart';

import 'package:reverse_marketplace/core/utils/formatters.dart';

void main() {
  group('formatUrgency (mirrors backend posts.schemas.ts urgency enum)', () {
    test('maps every backend value to a human-readable label', () {
      expect(formatUrgency('asap'), 'ASAP');
      expect(formatUrgency('within_24_hours'), 'Within 24 hours');
      expect(formatUrgency('within_3_days'), 'Within 3 days');
      expect(formatUrgency('within_1_week'), 'Within 1 week');
      expect(formatUrgency('flexible'), 'Flexible');
      expect(formatUrgency('specific_date'), 'Specific date');
    });

    test('null defaults to Flexible', () {
      expect(formatUrgency(null), 'Flexible');
    });

    test('unknown values pass through (do not crash)', () {
      expect(formatUrgency('something_new'), 'something_new');
    });
  });

  group('formatRelativeDate', () {
    test('uses "min" for minutes so "1m" is not read as "1 month"', () {
      final date = DateTime.now().subtract(const Duration(minutes: 1));
      expect(formatRelativeDate(date), '1 min ago');
    });

    test('uses "h" / "d" / "w" for larger units', () {
      final hourAgo = DateTime.now().subtract(const Duration(hours: 3));
      expect(formatRelativeDate(hourAgo), '3h ago');

      final dayAgo = DateTime.now().subtract(const Duration(days: 2));
      expect(formatRelativeDate(dayAgo), '2d ago');

      final weekAgo = DateTime.now().subtract(const Duration(days: 14));
      expect(formatRelativeDate(weekAgo), '2w ago');
    });

    test('"Just now" for sub-minute', () {
      expect(
        formatRelativeDate(DateTime.now().subtract(const Duration(seconds: 30))),
        'Just now',
      );
    });
  });
}
