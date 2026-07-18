import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/announcement_model.dart';
import '../data/repositories/announcement_repository.dart';

/// How often the app re-polls for active announcements. The acceptance
/// criterion is "Flutter sees it within 60s", so we poll on a 60s cadence.
const _pollInterval = Duration(seconds: 60);

class AnnouncementState {
  final List<Announcement> active;
  final Set<String> dismissedIds;

  const AnnouncementState({
    this.active = const [],
    this.dismissedIds = const {},
  });

  /// The banner to show: the newest active announcement the user hasn't
  /// dismissed this session. Null when there's nothing to show.
  Announcement? get visible {
    for (final a in active) {
      if (!dismissedIds.contains(a.id)) return a;
    }
    return null;
  }

  AnnouncementState copyWith({
    List<Announcement>? active,
    Set<String>? dismissedIds,
  }) {
    return AnnouncementState(
      active: active ?? this.active,
      dismissedIds: dismissedIds ?? this.dismissedIds,
    );
  }
}

class AnnouncementNotifier extends StateNotifier<AnnouncementState> {
  final AnnouncementRepository _repository;
  Timer? _timer;

  AnnouncementNotifier(this._repository) : super(const AnnouncementState()) {
    _fetch();
    _timer = Timer.periodic(_pollInterval, (_) => _fetch());
  }

  Future<void> _fetch() async {
    try {
      final active = await _repository.getActive();
      if (!mounted) return;
      state = state.copyWith(active: active);
    } catch (_) {
      // Banner is best-effort: never surface fetch errors to the user.
      // Keep the last-known state until the next poll succeeds.
    }
  }

  /// Manually refresh (e.g. on app resume). Public wrapper around the poll.
  Future<void> refresh() => _fetch();

  /// Dismiss a banner for the rest of this session. It reappears on next app
  /// open (the provider — and therefore this set — is recreated on restart).
  void dismiss(String id) {
    state = state.copyWith(dismissedIds: {...state.dismissedIds, id});
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

final announcementRepositoryProvider = Provider<AnnouncementRepository>(
  (ref) => AnnouncementRepository(),
);

final announcementProvider =
    StateNotifierProvider<AnnouncementNotifier, AnnouncementState>(
  (ref) => AnnouncementNotifier(ref.watch(announcementRepositoryProvider)),
);
