import 'package:json_annotation/json_annotation.dart';

part 'message_model.g.dart';

@JsonSerializable()
class Message {
  final String id;
  final String conversationId;
  final String senderId;
  final String messageText;
  final List<dynamic> attachments;
  final bool read;
  final DateTime? readAt;
  final bool flagged;
  final MessageSender sender;
  final DateTime createdAt;

  Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.messageText,
    this.attachments = const [],
    this.read = false,
    this.readAt,
    this.flagged = false,
    required this.sender,
    required this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) =>
      _$MessageFromJson(json);
  Map<String, dynamic> toJson() => _$MessageToJson(this);

  List<String> get attachmentUrls =>
      attachments.map((e) => e.toString()).toList();
}

@JsonSerializable()
class MessageSender {
  final String id;
  final String firstName;
  final String lastName;
  final String? profilePhotoUrl;

  MessageSender({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.profilePhotoUrl,
  });

  factory MessageSender.fromJson(Map<String, dynamic> json) =>
      _$MessageSenderFromJson(json);
  Map<String, dynamic> toJson() => _$MessageSenderToJson(this);

  String get fullName => '$firstName $lastName';
}

@JsonSerializable()
class ConversationDetail {
  final String id;
  final String? postId;
  final String? offerId;
  final String status;
  @JsonKey(defaultValue: false)
  final bool isLocked;
  final MessageSender participant1;
  final MessageSender participant2;
  final PostSummary? post;

  ConversationDetail({
    required this.id,
    this.postId,
    this.offerId,
    required this.status,
    this.isLocked = false,
    required this.participant1,
    required this.participant2,
    this.post,
  });

  factory ConversationDetail.fromJson(Map<String, dynamic> json) =>
      _$ConversationDetailFromJson(json);
  Map<String, dynamic> toJson() => _$ConversationDetailToJson(this);
}

@JsonSerializable()
class PostSummary {
  final String id;
  final String title;

  PostSummary({required this.id, required this.title});

  factory PostSummary.fromJson(Map<String, dynamic> json) =>
      _$PostSummaryFromJson(json);
  Map<String, dynamic> toJson() => _$PostSummaryToJson(this);
}
