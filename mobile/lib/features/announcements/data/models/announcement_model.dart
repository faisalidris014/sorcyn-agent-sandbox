import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// Severity of an operator announcement banner. Drives the banner colours.
enum AnnouncementSeverity {
  info,
  warning,
  critical;

  static AnnouncementSeverity fromString(String? value) {
    switch (value) {
      case 'warning':
        return AnnouncementSeverity.warning;
      case 'critical':
        return AnnouncementSeverity.critical;
      case 'info':
      default:
        return AnnouncementSeverity.info;
    }
  }

  /// Background tint for the banner.
  Color get background {
    switch (this) {
      case AnnouncementSeverity.info:
        return AppColors.primary;
      case AnnouncementSeverity.warning:
        return AppColors.warning;
      case AnnouncementSeverity.critical:
        return AppColors.error;
    }
  }

  /// Leading icon for the banner.
  IconData get icon {
    switch (this) {
      case AnnouncementSeverity.info:
        return Icons.campaign_outlined;
      case AnnouncementSeverity.warning:
        return Icons.warning_amber_rounded;
      case AnnouncementSeverity.critical:
        return Icons.error_outline;
    }
  }
}

/// A single operator announcement returned by GET /announcements/active.
class Announcement {
  final String id;
  final String message;
  final AnnouncementSeverity severity;
  final DateTime? startsAt;
  final DateTime? endsAt;

  const Announcement({
    required this.id,
    required this.message,
    required this.severity,
    this.startsAt,
    this.endsAt,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      id: json['id'] as String,
      message: json['message'] as String,
      severity: AnnouncementSeverity.fromString(json['severity'] as String?),
      startsAt: _parseDate(json['startsAt']),
      endsAt: _parseDate(json['endsAt']),
    );
  }

  static DateTime? _parseDate(dynamic value) {
    if (value is String && value.isNotEmpty) {
      return DateTime.tryParse(value);
    }
    return null;
  }
}
