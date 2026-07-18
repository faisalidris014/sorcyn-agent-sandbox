// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AppNotification _$AppNotificationFromJson(Map<String, dynamic> json) =>
    AppNotification(
      id: json['id'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      message: json['message'] as String,
      data: json['data'] as Map<String, dynamic>?,
      actionUrl: json['actionUrl'] as String?,
      read: json['read'] as bool,
      readAt: json['readAt'] == null
          ? null
          : DateTime.parse(json['readAt'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$AppNotificationToJson(AppNotification instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': instance.type,
      'title': instance.title,
      'message': instance.message,
      'data': instance.data,
      'actionUrl': instance.actionUrl,
      'read': instance.read,
      'readAt': instance.readAt?.toIso8601String(),
      'createdAt': instance.createdAt.toIso8601String(),
    };
