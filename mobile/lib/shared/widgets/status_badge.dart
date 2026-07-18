import 'package:flutter/material.dart';

import '../../core/utils/formatters.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final double fontSize;

  const StatusBadge({
    super.key,
    required this.status,
    this.fontSize = 11,
  });

  @override
  Widget build(BuildContext context) {
    final color = _statusColor(status);
    final isActive = status.toLowerCase() == 'active';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isActive)
            _PulsingDot(color: color)
          else
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: color,
              ),
            ),
          const SizedBox(width: 5),
          Text(
            formatStatus(status),
            style: TextStyle(
              color: color,
              fontSize: fontSize,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Color _statusColor(String status) {
    return switch (status.toLowerCase()) {
      'active' => const Color(0xFF10B981),
      'filled' || 'completed' => const Color(0xFF7C3AED),
      'draft' => const Color(0xFF9CA3AF),
      'archived' => const Color(0xFFF59E0B),
      'expired' || 'cancelled' => const Color(0xFFEF4444),
      'pending' || 'in_progress' => const Color(0xFFF59E0B),
      'counter_offered' => const Color(0xFF2563EB),
      'needs_reconfirmation' => const Color(0xFFD97706),
      _ => const Color(0xFF6B7280),
    };
  }
}

class _PulsingDot extends StatefulWidget {
  final Color color;

  const _PulsingDot({required this.color});

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
    _opacity = Tween<double>(begin: 1.0, end: 0.2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: Container(
        width: 6,
        height: 6,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: widget.color,
        ),
      ),
    );
  }
}
