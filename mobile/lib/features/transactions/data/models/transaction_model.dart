import 'package:json_annotation/json_annotation.dart';

import '../../../offers/data/models/offer_model.dart';

part 'transaction_model.g.dart';

@JsonSerializable(explicitToJson: true)
class Transaction {
  final String id;
  final String postId;
  final String offerId;
  final String buyerId;
  final String sellerId;
  final String transactionType;
  final double quoteAmount;
  final double? buyerFee;
  final double? stripeFee;
  final double? totalCharged;
  final double? platformFee;
  final double? sellerPayoutAmount;
  final String currency;
  final double? shippingCost;
  final String? stripePaymentIntentId;
  final String escrowStatus;
  final String? autoReleaseAt;
  final String status;
  final List<dynamic> beforePhotos;
  final List<dynamic> progressPhotos;
  final List<dynamic> afterPhotos;
  final String? completionNotes;
  final String? workSummary;
  final String? completedAt;
  final String? trackingNumber;
  final String? carrier;
  final String? estimatedDeliveryDate;
  final String? meetupLocation;
  final String? meetupDate;
  final String? meetupTime;
  final List<dynamic> timeline;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Nested
  final Map<String, dynamic>? post;
  final SellerSummary? seller;
  final Map<String, dynamic>? offer;

  Transaction({
    required this.id,
    required this.postId,
    required this.offerId,
    required this.buyerId,
    required this.sellerId,
    required this.transactionType,
    required this.quoteAmount,
    this.buyerFee,
    this.stripeFee,
    this.totalCharged,
    this.platformFee,
    this.sellerPayoutAmount,
    this.currency = 'USD',
    this.shippingCost,
    this.stripePaymentIntentId,
    this.escrowStatus = 'none',
    this.autoReleaseAt,
    this.status = 'in_progress',
    this.beforePhotos = const [],
    this.progressPhotos = const [],
    this.afterPhotos = const [],
    this.completionNotes,
    this.workSummary,
    this.completedAt,
    this.trackingNumber,
    this.carrier,
    this.estimatedDeliveryDate,
    this.meetupLocation,
    this.meetupDate,
    this.meetupTime,
    this.timeline = const [],
    required this.createdAt,
    required this.updatedAt,
    this.post,
    this.seller,
    this.offer,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) =>
      _$TransactionFromJson(json);
  Map<String, dynamic> toJson() => _$TransactionToJson(this);

  String get postTitle => post?['title'] as String? ?? '';
  String get sellerName => seller?.displayName ?? 'Seller';
  double get buyerTotal => totalCharged ?? quoteAmount;

  bool get isInProgress => status == 'in_progress';
  bool get isAwaitingApproval => status == 'awaiting_approval';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';

  bool get canApprove => isAwaitingApproval;
  bool get canCancel =>
      !isCompleted && !isCancelled && status != 'disputed';

  List<TimelineEvent> get timelineEvents {
    return timeline.map((e) {
      if (e is Map<String, dynamic>) {
        return TimelineEvent.fromJson(e);
      }
      return TimelineEvent(event: e.toString(), timestamp: '');
    }).toList();
  }

  int get changeRequestCount {
    return timelineEvents
        .where((e) => e.event == 'changes_requested')
        .length;
  }

  bool get canRequestChanges =>
      isAwaitingApproval && changeRequestCount < 2;

  /// Canonical lifecycle stages per transaction type, used for the seller
  /// "My Jobs" milestone counter. The counter reflects how far a job has
  /// progressed through its lifecycle, NOT the raw number of timeline events —
  /// the latter grows unbounded (created, scheduled, on_the_way, started,
  /// completed, awaiting_approval, …) and pushed the "N / total" display and
  /// progress bar past 100% (e.g. "9 / 6 milestones"). See #318.
  List<String> get _milestoneLifecycle {
    return switch (transactionType) {
      'product_shipped' => const [
          'in_progress',
          'preparing_shipment',
          'shipped',
          'in_transit',
          'delivered',
          'awaiting_approval',
          'completed',
        ],
      'product_local_cash' || 'product_local_platform' => const [
          'in_progress',
          'pending_meetup',
          'meetup_scheduled',
          // QR scan at pickup precedes the meetup being marked complete
          // (PRD §8.3: "Meetup Scheduled → QR Code Generated → Scanned at
          // Pickup"). The Prisma enum happens to declare meetup_complete
          // first, but that is declaration order, not lifecycle order.
          'qr_scanned',
          'meetup_complete',
          'awaiting_approval',
          'completed',
        ],
      // job_milestone advances through the service work statuses
      // (scheduled / on_the_way / started) because the backend routes it
      // through SERVICE_STATUSES in validateStatusTransition — so those must
      // stay enumerated here or live milestone jobs would hit the fallback.
      // It also carries two milestone-only enum statuses (pending_start,
      // in_progress_milestone) that the enum defines but no handler currently
      // writes — mapping them keeps the counter exact if a future milestone
      // flow or seed ever sets them (#376).
      'job_milestone' => const [
          'in_progress',
          'pending_start',
          'scheduled',
          'on_the_way',
          'started',
          'in_progress_milestone',
          'awaiting_approval',
          'completed',
        ],
      // service and any unknown type
      _ => const [
          'in_progress',
          'scheduled',
          'on_the_way',
          'started',
          'awaiting_approval',
          'completed',
        ],
    };
  }

  int get milestonesTotal => _milestoneLifecycle.length;

  /// Milestones reached so far, always clamped to [0, milestonesTotal] so the
  /// counter can never exceed the total or overfill the progress bar (#318).
  int get milestonesDone {
    final lifecycle = _milestoneLifecycle;

    // Normalize branch/terminal statuses onto a canonical lifecycle position.
    final normalized = switch (status) {
      // Buyer approved & funds released == final milestone.
      'approved' => 'completed',
      // Buyer asked for changes: the job regresses to the completable "work"
      // stage 3 back from the end — started (service), delivered (shipped),
      // meetup_complete (local), or in_progress_milestone (job_milestone).
      'changes_requested' => lifecycle[lifecycle.length - 3],
      _ => status,
    };

    final index = lifecycle.indexOf(normalized);
    if (index >= 0) {
      return index + 1;
    }
    // Off-lifecycle status (cancelled, disputed, or an unknown value): fall
    // back to a guarded count so the bar still renders without overflowing.
    final count = timelineEvents.length;
    return count < milestonesTotal ? count : milestonesTotal;
  }

  /// Progress fraction for the milestone bar, clamped to [0, 1] (#318).
  double get milestoneProgress {
    final total = milestonesTotal;
    if (total <= 0) return 0;
    return (milestonesDone / total).clamp(0.0, 1.0);
  }
}

@JsonSerializable()
class TimelineEvent {
  final String event;
  final String timestamp;
  final String? actorId;
  final String? note;

  TimelineEvent({
    required this.event,
    required this.timestamp,
    this.actorId,
    this.note,
  });

  factory TimelineEvent.fromJson(Map<String, dynamic> json) =>
      _$TimelineEventFromJson(json);
  Map<String, dynamic> toJson() => _$TimelineEventToJson(this);

  DateTime? get dateTime => DateTime.tryParse(timestamp);

  String get displayEvent {
    return switch (event) {
      'created' => 'Transaction created',
      'payment_held' => 'Payment held in escrow',
      'scheduled' => 'Work scheduled',
      'on_the_way' => 'Seller on the way',
      'started' => 'Work started',
      'completed' => 'Work marked complete',
      'awaiting_approval' => 'Awaiting your approval',
      'changes_requested' => 'Changes requested',
      'approved' => 'Approved & payment released',
      'cancelled' => 'Transaction cancelled',
      'preparing_shipment' => 'Preparing shipment',
      'shipped' => 'Item shipped',
      'in_transit' => 'In transit',
      'delivered' => 'Delivered',
      'pending_meetup' => 'Meetup pending',
      'meetup_scheduled' => 'Meetup scheduled',
      _ => event.replaceAll('_', ' '),
    };
  }
}
