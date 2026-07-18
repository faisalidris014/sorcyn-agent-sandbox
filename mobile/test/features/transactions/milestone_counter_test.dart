import 'package:flutter_test/flutter_test.dart';
import 'package:reverse_marketplace/features/transactions/data/models/transaction_model.dart';

/// Regression for #318 — the seller "My Jobs" card milestone counter exceeding
/// the total (e.g. "9 / 6 milestones") and overfilling the progress bar.
///
/// The old getters counted EVERY timeline event as a "done" milestone against a
/// hardcoded total of 6, so any job with more than 6 timeline events overflowed.
/// The counter is now derived from the current status's position in the
/// transaction's canonical lifecycle, so it is inherently bounded.
Transaction _txn({
  required String type,
  required String status,
  List<Map<String, dynamic>> timeline = const [],
}) {
  return Transaction.fromJson({
    'id': 't1',
    'postId': 'p1',
    'offerId': 'o1',
    'buyerId': 'b1',
    'sellerId': 's1',
    'transactionType': type,
    'quoteAmount': 100,
    'status': status,
    'timeline': timeline,
    'createdAt': '2026-06-22T10:00:00.000Z',
    'updatedAt': '2026-06-22T10:00:00.000Z',
  });
}

/// Builds a timeline longer than the fixed total, mirroring the real flow that
/// triggered the bug (created → scheduled → on_the_way → started → completed →
/// awaiting_approval → …).
List<Map<String, dynamic>> _events(int n) => List.generate(
      n,
      (i) => {'event': 'e$i', 'timestamp': ''},
    );

void main() {
  group('Transaction milestone counter (#318)', () {
    test('done never exceeds total even with a long timeline', () {
      // The exact scenario from the bug report: many timeline events.
      final txn = _txn(
        type: 'service',
        status: 'completed',
        timeline: _events(9),
      );

      expect(txn.milestonesTotal, 6);
      expect(txn.milestonesDone, lessThanOrEqualTo(txn.milestonesTotal));
      expect(txn.milestonesDone, 6);
    });

    test('progress fraction stays within [0, 1]', () {
      final txn = _txn(
        type: 'service',
        status: 'completed',
        timeline: _events(20),
      );
      expect(txn.milestoneProgress, lessThanOrEqualTo(1.0));
      expect(txn.milestoneProgress, greaterThanOrEqualTo(0.0));
      expect(txn.milestoneProgress, 1.0);
    });

    test('service lifecycle maps status to a stable position', () {
      expect(_txn(type: 'service', status: 'in_progress').milestonesDone, 1);
      expect(_txn(type: 'service', status: 'scheduled').milestonesDone, 2);
      expect(_txn(type: 'service', status: 'on_the_way').milestonesDone, 3);
      expect(_txn(type: 'service', status: 'started').milestonesDone, 4);
      expect(
          _txn(type: 'service', status: 'awaiting_approval').milestonesDone, 5);
      expect(_txn(type: 'service', status: 'completed').milestonesDone, 6);
    });

    test('shipped lifecycle has its own stage set', () {
      final txn = _txn(type: 'product_shipped', status: 'shipped');
      expect(txn.milestonesTotal, 7);
      expect(txn.milestonesDone, 3);
    });

    test('local lifecycle has 7 stages (incl. qr_scanned + meetup_complete)',
        () {
      final txn =
          _txn(type: 'product_local_cash', status: 'meetup_scheduled');
      expect(txn.milestonesTotal, 7);
      expect(txn.milestonesDone, 3);
    });

    test('approved counts as the final milestone', () {
      final txn = _txn(type: 'service', status: 'approved');
      expect(txn.milestonesDone, txn.milestonesTotal);
    });

    test('changes_requested regresses to the completable work stage', () {
      final txn = _txn(type: 'service', status: 'changes_requested');
      // "started" is stage 4 of the service lifecycle.
      expect(txn.milestonesDone, 4);
      expect(txn.milestonesDone, lessThan(txn.milestonesTotal));
    });

    test('off-lifecycle status (cancelled) falls back to a clamped count', () {
      final txn = _txn(
        type: 'service',
        status: 'cancelled',
        timeline: _events(9),
      );
      expect(txn.milestonesDone, lessThanOrEqualTo(txn.milestonesTotal));
      expect(txn.milestonesDone, 6);
    });

    test('off-lifecycle status with a short timeline is not overstated', () {
      final txn = _txn(
        type: 'service',
        status: 'disputed',
        timeline: _events(2),
      );
      expect(txn.milestonesDone, 2);
    });
  });

  /// #376 — five enum statuses (delivered, qr_scanned, meetup_complete,
  /// pending_start, in_progress_milestone) previously had no slot in their
  /// type's lifecycle, so they fell through to the guarded timeline-count
  /// fallback and showed an approximate position. Each must now resolve to an
  /// exact lifecycle slot, without regressing the #318 overflow guarantee.
  group('exact lifecycle slots for previously-unmapped statuses (#376)', () {
    test('shipped: delivered is slot 5 of 7', () {
      final txn = _txn(type: 'product_shipped', status: 'delivered');
      expect(txn.milestonesTotal, 7);
      expect(txn.milestonesDone, 5);
    });

    test('local: qr_scanned is slot 4 of 7', () {
      final txn = _txn(type: 'product_local_platform', status: 'qr_scanned');
      expect(txn.milestonesTotal, 7);
      expect(txn.milestonesDone, 4);
    });

    test('local: meetup_complete is slot 5 of 7', () {
      final txn = _txn(type: 'product_local_cash', status: 'meetup_complete');
      expect(txn.milestonesDone, 5);
    });

    test('job_milestone gets its own branch (not the service default): '
        'pending_start is slot 2 of 8', () {
      final txn = _txn(type: 'job_milestone', status: 'pending_start');
      expect(txn.milestonesTotal, 8);
      expect(txn.milestonesDone, 2);
    });

    test('job_milestone: in_progress_milestone is slot 6 of 8', () {
      final txn = _txn(type: 'job_milestone', status: 'in_progress_milestone');
      expect(txn.milestonesDone, 6);
    });

    test('job_milestone keeps its live service statuses exact (the backend '
        'advances it through SERVICE_STATUSES — no regression)', () {
      expect(
          _txn(type: 'job_milestone', status: 'scheduled').milestonesDone, 3);
      expect(
          _txn(type: 'job_milestone', status: 'on_the_way').milestonesDone, 4);
      expect(_txn(type: 'job_milestone', status: 'started').milestonesDone, 5);
    });

    test('the 5 statuses resolve to their slot, not the timeline fallback', () {
      // A timeline whose length differs from the true slot would betray a
      // fallback (which returns min(count, total)); the exact slot must win.
      expect(
        _txn(type: 'product_shipped', status: 'delivered', timeline: _events(2))
            .milestonesDone,
        5,
      );
      expect(
        _txn(
          type: 'product_local_platform',
          status: 'qr_scanned',
          timeline: _events(7),
        ).milestonesDone,
        4,
      );
      expect(
        _txn(
          type: 'product_local_cash',
          status: 'meetup_complete',
          timeline: _events(2),
        ).milestonesDone,
        5,
      );
      expect(
        _txn(
          type: 'job_milestone',
          status: 'pending_start',
          timeline: _events(8),
        ).milestonesDone,
        2,
      );
      expect(
        _txn(
          type: 'job_milestone',
          status: 'in_progress_milestone',
          timeline: _events(3),
        ).milestonesDone,
        6,
      );
    });

    test('newly-added statuses never overflow their total (#318 preserved)',
        () {
      for (final tc in <List<String>>[
        ['product_shipped', 'delivered'],
        ['product_local_platform', 'qr_scanned'],
        ['product_local_cash', 'meetup_complete'],
        ['job_milestone', 'pending_start'],
        ['job_milestone', 'in_progress_milestone'],
      ]) {
        final txn = _txn(type: tc[0], status: tc[1], timeline: _events(20));
        expect(txn.milestonesDone, lessThanOrEqualTo(txn.milestonesTotal),
            reason: '${tc[0]}/${tc[1]} must stay clamped');
        expect(txn.milestoneProgress, lessThanOrEqualTo(1.0));
      }
    });

    test('changes_requested lands on the last work stage for every type', () {
      // `lifecycle[length - 3]` = the completable work stage right before
      // awaiting_approval/completed. It shifted for shipped/local/job_milestone
      // when the lists grew (#376); pin the new landings so it can't drift.
      expect(
          _txn(type: 'product_shipped', status: 'changes_requested')
              .milestonesDone,
          5); // delivered
      expect(
          _txn(type: 'product_local_cash', status: 'changes_requested')
              .milestonesDone,
          5); // meetup_complete
      expect(
          _txn(type: 'job_milestone', status: 'changes_requested')
              .milestonesDone,
          6); // in_progress_milestone
      // service (unchanged length) still lands on started (slot 4).
      expect(
          _txn(type: 'service', status: 'changes_requested').milestonesDone, 4);
    });
  });
}
