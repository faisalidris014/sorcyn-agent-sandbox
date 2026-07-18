// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'message_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Message _$MessageFromJson(Map<String, dynamic> json) => Message(
  id: json['id'] as String,
  conversationId: json['conversationId'] as String,
  senderId: json['senderId'] as String,
  messageText: json['messageText'] as String,
  attachments: json['attachments'] as List<dynamic>? ?? const [],
  read: json['read'] as bool? ?? false,
  readAt: json['readAt'] == null
      ? null
      : DateTime.parse(json['readAt'] as String),
  flagged: json['flagged'] as bool? ?? false,
  sender: MessageSender.fromJson(json['sender'] as Map<String, dynamic>),
  createdAt: DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$MessageToJson(Message instance) => <String, dynamic>{
  'id': instance.id,
  'conversationId': instance.conversationId,
  'senderId': instance.senderId,
  'messageText': instance.messageText,
  'attachments': instance.attachments,
  'read': instance.read,
  'readAt': instance.readAt?.toIso8601String(),
  'flagged': instance.flagged,
  'sender': instance.sender,
  'createdAt': instance.createdAt.toIso8601String(),
};

MessageSender _$MessageSenderFromJson(Map<String, dynamic> json) =>
    MessageSender(
      id: json['id'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      profilePhotoUrl: json['profilePhotoUrl'] as String?,
    );

Map<String, dynamic> _$MessageSenderToJson(MessageSender instance) =>
    <String, dynamic>{
      'id': instance.id,
      'firstName': instance.firstName,
      'lastName': instance.lastName,
      'profilePhotoUrl': instance.profilePhotoUrl,
    };

ConversationDetail _$ConversationDetailFromJson(Map<String, dynamic> json) =>
    ConversationDetail(
      id: json['id'] as String,
      postId: json['postId'] as String?,
      offerId: json['offerId'] as String?,
      status: json['status'] as String,
      isLocked: json['isLocked'] as bool? ?? false,
      participant1: MessageSender.fromJson(
        json['participant1'] as Map<String, dynamic>,
      ),
      participant2: MessageSender.fromJson(
        json['participant2'] as Map<String, dynamic>,
      ),
      post: json['post'] == null
          ? null
          : PostSummary.fromJson(json['post'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$ConversationDetailToJson(ConversationDetail instance) =>
    <String, dynamic>{
      'id': instance.id,
      'postId': instance.postId,
      'offerId': instance.offerId,
      'status': instance.status,
      'isLocked': instance.isLocked,
      'participant1': instance.participant1,
      'participant2': instance.participant2,
      'post': instance.post,
    };

PostSummary _$PostSummaryFromJson(Map<String, dynamic> json) =>
    PostSummary(id: json['id'] as String, title: json['title'] as String);

Map<String, dynamic> _$PostSummaryToJson(PostSummary instance) =>
    <String, dynamic>{'id': instance.id, 'title': instance.title};
