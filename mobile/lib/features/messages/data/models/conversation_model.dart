import 'package:json_annotation/json_annotation.dart';

part 'conversation_model.g.dart';

@JsonSerializable()
class Conversation {
  final String id;
  final String? postId;
  final String? offerId;
  final String status;
  @JsonKey(defaultValue: false)
  final bool isLocked;
  final OtherParticipant otherParticipant;
  /// The other participant's role in this thread ('buyer' or 'seller'),
  /// used by the Buyers/Sellers inbox filter.
  final String? otherRole;
  final int unreadCount;
  final ConversationDeal? deal;
  final LastMessagePreview? lastMessage;
  final DateTime? lastMessageAt;
  final DateTime createdAt;

  Conversation({
    required this.id,
    this.postId,
    this.offerId,
    required this.status,
    this.isLocked = false,
    required this.otherParticipant,
    this.otherRole,
    this.unreadCount = 0,
    this.deal,
    this.lastMessage,
    this.lastMessageAt,
    required this.createdAt,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) =>
      _$ConversationFromJson(json);
  Map<String, dynamic> toJson() => _$ConversationToJson(this);

  bool get hasUnread => unreadCount > 0;
}

/// Deal context for the inbox row: listing photo, agreed amount, escrow state,
/// and a 0..1 ring progress. Mirrors the backend `deriveDeal` output.
enum DealState {
  @JsonValue('new_offer')
  newOffer,
  @JsonValue('offer_sent')
  offerSent,
  @JsonValue('in_escrow')
  inEscrow,
  @JsonValue('completed')
  completed,
  @JsonValue('none')
  none,
}

@JsonSerializable()
class ConversationDeal {
  final String? photoUrl;
  final double? amount;
  @JsonKey(unknownEnumValue: DealState.none, defaultValue: DealState.none)
  final DealState state;
  final double? progress;

  ConversationDeal({
    this.photoUrl,
    this.amount,
    this.state = DealState.none,
    this.progress,
  });

  factory ConversationDeal.fromJson(Map<String, dynamic> json) =>
      _$ConversationDealFromJson(json);
  Map<String, dynamic> toJson() => _$ConversationDealToJson(this);
}

@JsonSerializable()
class OtherParticipant {
  final String id;
  final String firstName;
  final String lastName;
  final String? profilePhotoUrl;

  OtherParticipant({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.profilePhotoUrl,
  });

  factory OtherParticipant.fromJson(Map<String, dynamic> json) =>
      _$OtherParticipantFromJson(json);
  Map<String, dynamic> toJson() => _$OtherParticipantToJson(this);

  String get fullName => '$firstName $lastName';
}

@JsonSerializable()
class LastMessagePreview {
  final String text;
  final DateTime sentAt;
  final bool isOwn;

  LastMessagePreview({
    required this.text,
    required this.sentAt,
    required this.isOwn,
  });

  factory LastMessagePreview.fromJson(Map<String, dynamic> json) =>
      _$LastMessagePreviewFromJson(json);
  Map<String, dynamic> toJson() => _$LastMessagePreviewToJson(this);
}
