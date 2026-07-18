import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// Per-day availability editor that emits the `businessHours` shape the backend
/// accepts (`createSellerProfileSchema`/`updateSellerProfileSchema`): a map
/// keyed by `mon`..`sun` where each open day is `{ "open": "HH:MM", "close":
/// "HH:MM" }`. Closed days are simply absent from the emitted map (absence ==
/// closed on read-back). Replaces the old hardcoded "Mon-Fri, 9am-5pm" stub.
class BusinessHoursEditor extends StatefulWidget {
  final Map<String, dynamic>? initial;
  final ValueChanged<Map<String, dynamic>> onChanged;

  /// When [initial] is null, controls the starting state: setup defaults to
  /// Mon–Fri open (a sensible new-profile starting point); edit passes false so
  /// a profile that never had hours isn't silently given defaults on save.
  final bool defaultWeekdaysOpen;

  const BusinessHoursEditor({
    super.key,
    this.initial,
    required this.onChanged,
    this.defaultWeekdaysOpen = true,
  });

  @override
  State<BusinessHoursEditor> createState() => _BusinessHoursEditorState();
}

class _BusinessHoursEditorState extends State<BusinessHoursEditor> {
  // Ordered Mon→Sun with display labels.
  static const _days = <(String, String)>[
    ('mon', 'Monday'),
    ('tue', 'Tuesday'),
    ('wed', 'Wednesday'),
    ('thu', 'Thursday'),
    ('fri', 'Friday'),
    ('sat', 'Saturday'),
    ('sun', 'Sunday'),
  ];

  late Map<String, _DayHours> _hours;

  @override
  void initState() {
    super.initState();
    _hours = {for (final d in _days) d.$1: _parseDay(d.$1, widget.initial)};
    // Surface the initial computed hours to the parent so a user who never
    // touches the editor still submits the defaults (Mon–Fri 09:00–17:00).
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _emit();
    });
  }

  /// Parse a single day from an incoming businessHours map. A day is OPEN when
  /// it's present and not explicitly `closed: true`. Weekdays default to open
  /// 09:00–17:00, weekends to closed — matching the old static display.
  _DayHours _parseDay(String key, Map<String, dynamic>? src) {
    final weekday = key != 'sat' && key != 'sun';
    final raw = src?[key];
    if (raw is Map) {
      final closed = raw['closed'] == true;
      return _DayHours(
        open: !closed,
        openTime: _parseTime(raw['open']) ?? const TimeOfDay(hour: 9, minute: 0),
        closeTime:
            _parseTime(raw['close']) ?? const TimeOfDay(hour: 17, minute: 0),
      );
    }
    // No entry for this day. When an initial map was supplied, absence means
    // closed; with no map at all, fall back to the weekday default (only when
    // the caller opted into it — setup yes, edit no).
    final defaultOpen = src == null ? (widget.defaultWeekdaysOpen && weekday) : false;
    return _DayHours(
      open: defaultOpen,
      openTime: const TimeOfDay(hour: 9, minute: 0),
      closeTime: const TimeOfDay(hour: 17, minute: 0),
    );
  }

  TimeOfDay? _parseTime(dynamic hhmm) {
    if (hhmm is! String) return null;
    final parts = hhmm.split(':');
    if (parts.length != 2) return null;
    final h = int.tryParse(parts[0]);
    final m = int.tryParse(parts[1]);
    if (h == null || m == null || h < 0 || h > 23 || m < 0 || m > 59) {
      return null;
    }
    return TimeOfDay(hour: h, minute: m);
  }

  String _hhmm(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  void _emit() {
    final map = <String, dynamic>{};
    for (final entry in _hours.entries) {
      final d = entry.value;
      if (d.open) {
        map[entry.key] = {'open': _hhmm(d.openTime), 'close': _hhmm(d.closeTime)};
      }
    }
    widget.onChanged(map);
  }

  Future<void> _pickTime(String key, {required bool isOpen}) async {
    final current = _hours[key]!;
    final picked = await showTimePicker(
      context: context,
      initialTime: isOpen ? current.openTime : current.closeTime,
    );
    if (picked == null) return;
    setState(() {
      _hours[key] = current.copyWith(
        openTime: isOpen ? picked : current.openTime,
        closeTime: isOpen ? current.closeTime : picked,
      );
    });
    _emit();
  }

  void _toggleDay(String key, bool open) {
    setState(() => _hours[key] = _hours[key]!.copyWith(open: open));
    _emit();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Availability',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.black,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border, width: 1.5),
          ),
          child: Column(
            children: [
              for (var i = 0; i < _days.length; i++)
                _dayRow(_days[i].$1, _days[i].$2, last: i == _days.length - 1),
            ],
          ),
        ),
      ],
    );
  }

  Widget _dayRow(String key, String label, {required bool last}) {
    final d = _hours[key]!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        border: last
            ? null
            : const Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 84,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.black,
              ),
            ),
          ),
          Expanded(
            child: d.open
                ? Row(
                    children: [
                      _timeChip(_hhmm(d.openTime),
                          () => _pickTime(key, isOpen: true)),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 6),
                        child: Text('–',
                            style: TextStyle(color: AppColors.greyMedium)),
                      ),
                      _timeChip(_hhmm(d.closeTime),
                          () => _pickTime(key, isOpen: false)),
                    ],
                  )
                : const Text(
                    'Closed',
                    style: TextStyle(fontSize: 13, color: AppColors.greyMedium),
                  ),
          ),
          Switch.adaptive(
            value: d.open,
            activeTrackColor: AppColors.primary,
            onChanged: (v) => _toggleDay(key, v),
          ),
        ],
      ),
    );
  }

  Widget _timeChip(String text, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.border),
        ),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.black,
          ),
        ),
      ),
    );
  }
}

class _DayHours {
  final bool open;
  final TimeOfDay openTime;
  final TimeOfDay closeTime;

  const _DayHours({
    required this.open,
    required this.openTime,
    required this.closeTime,
  });

  _DayHours copyWith({bool? open, TimeOfDay? openTime, TimeOfDay? closeTime}) {
    return _DayHours(
      open: open ?? this.open,
      openTime: openTime ?? this.openTime,
      closeTime: closeTime ?? this.closeTime,
    );
  }
}
