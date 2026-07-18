import 'package:json_annotation/json_annotation.dart';

part 'notification_model.g.dart';

@JsonSerializable()
class AppNotification {
  final String id;
  final String type;
  final String title;
  final String message;
  final Map<String, dynamic>? data;
  final String? actionUrl;
  final bool read;
  final DateTime? readAt;
  final DateTime createdAt;

  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    this.data,
    this.actionUrl,
    required this.read,
    this.readAt,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      _$AppNotificationFromJson(json);
  Map<String, dynamic> toJson() => _$AppNotificationToJson(this);
}
