// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'conversation_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Conversation _$ConversationFromJson(Map<String, dynamic> json) => Conversation(
  id: json['id'] as String,
  postId: json['postId'] as String?,
  offerId: json['offerId'] as String?,
  status: json['status'] as String,
  isLocked: json['isLocked'] as bool? ?? false,
  otherParticipant: OtherParticipant.fromJson(
    json['otherParticipant'] as Map<String, dynamic>,
  ),
  otherRole: json['otherRole'] as String?,
  unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
  deal: json['deal'] == null
      ? null
      : ConversationDeal.fromJson(json['deal'] as Map<String, dynamic>),
  lastMessage: json['lastMessage'] == null
      ? null
      : LastMessagePreview.fromJson(
          json['lastMessage'] as Map<String, dynamic>,
        ),
  lastMessageAt: json['lastMessageAt'] == null
      ? null
      : DateTime.parse(json['lastMessageAt'] as String),
  createdAt: DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$ConversationToJson(Conversation instance) =>
    <String, dynamic>{
      'id': instance.id,
      'postId': instance.postId,
      'offerId': instance.offerId,
      'status': instance.status,
      'isLocked': instance.isLocked,
      'otherParticipant': instance.otherParticipant,
      'otherRole': instance.otherRole,
      'unreadCount': instance.unreadCount,
      'deal': instance.deal,
      'lastMessage': instance.lastMessage,
      'lastMessageAt': instance.lastMessageAt?.toIso8601String(),
      'createdAt': instance.createdAt.toIso8601String(),
    };

ConversationDeal _$ConversationDealFromJson(Map<String, dynamic> json) =>
    ConversationDeal(
      photoUrl: json['photoUrl'] as String?,
      amount: (json['amount'] as num?)?.toDouble(),
      state:
          $enumDecodeNullable(
            _$DealStateEnumMap,
            json['state'],
            unknownValue: DealState.none,
          ) ??
          DealState.none,
      progress: (json['progress'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$ConversationDealToJson(ConversationDeal instance) =>
    <String, dynamic>{
      'photoUrl': instance.photoUrl,
      'amount': instance.amount,
      'state': _$DealStateEnumMap[instance.state]!,
      'progress': instance.progress,
    };

const _$DealStateEnumMap = {
  DealState.newOffer: 'new_offer',
  DealState.offerSent: 'offer_sent',
  DealState.inEscrow: 'in_escrow',
  DealState.completed: 'completed',
  DealState.none: 'none',
};

OtherParticipant _$OtherParticipantFromJson(Map<String, dynamic> json) =>
    OtherParticipant(
      id: json['id'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      profilePhotoUrl: json['profilePhotoUrl'] as String?,
    );

Map<String, dynamic> _$OtherParticipantToJson(OtherParticipant instance) =>
    <String, dynamic>{
      'id': instance.id,
      'firstName': instance.firstName,
      'lastName': instance.lastName,
      'profilePhotoUrl': instance.profilePhotoUrl,
    };

LastMessagePreview _$LastMessagePreviewFromJson(Map<String, dynamic> json) =>
    LastMessagePreview(
      text: json['text'] as String,
      sentAt: DateTime.parse(json['sentAt'] as String),
      isOwn: json['isOwn'] as bool,
    );

Map<String, dynamic> _$LastMessagePreviewToJson(LastMessagePreview instance) =>
    <String, dynamic>{
      'text': instance.text,
      'sentAt': instance.sentAt.toIso8601String(),
      'isOwn': instance.isOwn,
    };
