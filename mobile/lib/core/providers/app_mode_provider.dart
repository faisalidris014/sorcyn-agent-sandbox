import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/secure_storage.dart';

enum AppMode { buyer, seller }

const _storageKey = 'app_mode';

class AppModeNotifier extends StateNotifier<AppMode> {
  AppModeNotifier() : super(AppMode.buyer) {
    _restoreFromStorage();
  }

  /// True once an explicit mode has been applied (manual toggle or
  /// account-type resolution on login). Guards the async startup restore from
  /// clobbering a mode that was set before secure storage resolved.
  bool _explicitlySet = false;

  Future<void> _restoreFromStorage() async {
    final mode = await _readStoredMode();
    if (_explicitlySet) return;
    state = mode;
  }

  Future<AppMode> _readStoredMode() async {
    final saved = await SecureStorage.read(_storageKey);
    return saved == 'seller' ? AppMode.seller : AppMode.buyer;
  }

  Future<void> setMode(AppMode mode) async {
    _explicitlySet = true;
    state = mode;
    await SecureStorage.write(_storageKey, mode.name);
  }

  Future<void> toggle() async {
    final newMode =
        state == AppMode.buyer ? AppMode.seller : AppMode.buyer;
    await setMode(newMode);
  }

  /// Sets the active mode from the authenticated user's account type so a
  /// seller- or buyer-only account never inherits a previous session's stored
  /// mode (issue #178). 'both' accounts keep their saved preference.
  Future<void> applyAccountType(String accountType) async {
    if (accountType == 'seller') {
      await setMode(AppMode.seller);
    } else if (accountType == 'buyer') {
      await setMode(AppMode.buyer);
    } else {
      // 'both' — restore the user's saved preference.
      _explicitlySet = true;
      state = await _readStoredMode();
    }
  }

  /// Logout: drop back to the default mode. The persisted preference is kept
  /// so a 'both' account restores it on next login.
  void reset() {
    _explicitlySet = false;
    state = AppMode.buyer;
  }
}

final appModeProvider =
    StateNotifierProvider<AppModeNotifier, AppMode>((ref) {
  return AppModeNotifier();
});
