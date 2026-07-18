import 'package:flutter/material.dart';

class UrgencyChip extends StatelessWidget {
  final String urgency;

  const UrgencyChip({super.key, required this.urgency});

  @override
  Widget build(BuildContext context) {
    final config = _getConfig(urgency);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: config.bgColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: config.borderColor),
      ),
      child: Text(
        config.label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: config.textColor,
        ),
      ),
    );
  }

  static _UrgencyConfig _getConfig(String urgency) {
    return switch (urgency.toLowerCase()) {
      'asap' || 'within_24h' || 'high' => _UrgencyConfig(
          label: '\u{1F534} Urgent',
          textColor: const Color(0xFFDC2626),
          bgColor: const Color(0x14EF4444),
          borderColor: const Color(0x33EF4444),
        ),
      'within_week' || 'medium' => _UrgencyConfig(
          label: '\u{1F7E1} Medium',
          textColor: const Color(0xFFD97706),
          bgColor: const Color(0x14F59E0B),
          borderColor: const Color(0x33F59E0B),
        ),
      _ => _UrgencyConfig(
          label: '\u{1F7E2} Flexible',
          textColor: const Color(0xFF059669),
          bgColor: const Color(0x1410B981),
          borderColor: const Color(0x3310B981),
        ),
    };
  }
}

class _UrgencyConfig {
  final String label;
  final Color textColor;
  final Color bgColor;
  final Color borderColor;

  const _UrgencyConfig({
    required this.label,
    required this.textColor,
    required this.bgColor,
    required this.borderColor,
  });
}
