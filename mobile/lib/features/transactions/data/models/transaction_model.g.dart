// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transaction_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Transaction _$TransactionFromJson(Map<String, dynamic> json) => Transaction(
  id: json['id'] as String,
  postId: json['postId'] as String,
  offerId: json['offerId'] as String,
  buyerId: json['buyerId'] as String,
  sellerId: json['sellerId'] as String,
  transactionType: json['transactionType'] as String,
  quoteAmount: (json['quoteAmount'] as num).toDouble(),
  buyerFee: (json['buyerFee'] as num?)?.toDouble(),
  stripeFee: (json['stripeFee'] as num?)?.toDouble(),
  totalCharged: (json['totalCharged'] as num?)?.toDouble(),
  platformFee: (json['platformFee'] as num?)?.toDouble(),
  sellerPayoutAmount: (json['sellerPayoutAmount'] as num?)?.toDouble(),
  currency: json['currency'] as String? ?? 'USD',
  shippingCost: (json['shippingCost'] as num?)?.toDouble(),
  stripePaymentIntentId: json['stripePaymentIntentId'] as String?,
  escrowStatus: json['escrowStatus'] as String? ?? 'none',
  autoReleaseAt: json['autoReleaseAt'] as String?,
  status: json['status'] as String? ?? 'in_progress',
  beforePhotos: json['beforePhotos'] as List<dynamic>? ?? const [],
  progressPhotos: json['progressPhotos'] as List<dynamic>? ?? const [],
  afterPhotos: json['afterPhotos'] as List<dynamic>? ?? const [],
  completionNotes: json['completionNotes'] as String?,
  workSummary: json['workSummary'] as String?,
  completedAt: json['completedAt'] as String?,
  trackingNumber: json['trackingNumber'] as String?,
  carrier: json['carrier'] as String?,
  estimatedDeliveryDate: json['estimatedDeliveryDate'] as String?,
  meetupLocation: json['meetupLocation'] as String?,
  meetupDate: json['meetupDate'] as String?,
  meetupTime: json['meetupTime'] as String?,
  timeline: json['timeline'] as List<dynamic>? ?? const [],
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
  post: json['post'] as Map<String, dynamic>?,
  seller: json['seller'] == null
      ? null
      : SellerSummary.fromJson(json['seller'] as Map<String, dynamic>),
  offer: json['offer'] as Map<String, dynamic>?,
);

Map<String, dynamic> _$TransactionToJson(Transaction instance) =>
    <String, dynamic>{
      'id': instance.id,
      'postId': instance.postId,
      'offerId': instance.offerId,
      'buyerId': instance.buyerId,
      'sellerId': instance.sellerId,
      'transactionType': instance.transactionType,
      'quoteAmount': instance.quoteAmount,
      'buyerFee': instance.buyerFee,
      'stripeFee': instance.stripeFee,
      'totalCharged': instance.totalCharged,
      'platformFee': instance.platformFee,
      'sellerPayoutAmount': instance.sellerPayoutAmount,
      'currency': instance.currency,
      'shippingCost': instance.shippingCost,
      'stripePaymentIntentId': instance.stripePaymentIntentId,
      'escrowStatus': instance.escrowStatus,
      'autoReleaseAt': instance.autoReleaseAt,
      'status': instance.status,
      'beforePhotos': instance.beforePhotos,
      'progressPhotos': instance.progressPhotos,
      'afterPhotos': instance.afterPhotos,
      'completionNotes': instance.completionNotes,
      'workSummary': instance.workSummary,
      'completedAt': instance.completedAt,
      'trackingNumber': instance.trackingNumber,
      'carrier': instance.carrier,
      'estimatedDeliveryDate': instance.estimatedDeliveryDate,
      'meetupLocation': instance.meetupLocation,
      'meetupDate': instance.meetupDate,
      'meetupTime': instance.meetupTime,
      'timeline': instance.timeline,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'post': instance.post,
      'seller': instance.seller?.toJson(),
      'offer': instance.offer,
    };

TimelineEvent _$TimelineEventFromJson(Map<String, dynamic> json) =>
    TimelineEvent(
      event: json['event'] as String,
      timestamp: json['timestamp'] as String,
      actorId: json['actorId'] as String?,
      note: json['note'] as String?,
    );

Map<String, dynamic> _$TimelineEventToJson(TimelineEvent instance) =>
    <String, dynamic>{
      'event': instance.event,
      'timestamp': instance.timestamp,
      'actorId': instance.actorId,
      'note': instance.note,
    };
