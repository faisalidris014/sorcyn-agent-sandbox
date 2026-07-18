import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../services/push_notification_service.dart';

/// Manages push notification lifecycle tied to auth state.
/// Auto-initializes on login, handles foreground messages.
class PushNotificationNotifier extends StateNotifier<bool> {
  final Ref _ref;
  StreamSubscription? _foregroundSub;
  StreamSubscription? _tapSub;

  PushNotificationNotifier(this._ref) : super(false) {
    _ref.listen(authProvider, (previous, next) {
      if (next.isAuthenticated && !(previous?.isAuthenticated ?? false)) {
        _initialize();
      }
      if (next.isLoggedOut && !(previous?.isLoggedOut ?? false)) {
        _cleanup();
      }
    });

    // If already authenticated when provider is created
    if (_ref.read(authProvider).isAuthenticated) {
      _initialize();
    }
  }

  Future<void> _initialize() async {
    try {
      await PushNotificationService.instance.initialize();

      if (!PushNotificationService.instance.isAvailable) return;

      state = true;

      // Listen for foreground messages to show in-app
      _foregroundSub?.cancel();
      _foregroundSub = PushNotificationService.instance.onForegroundMessage
          .listen(_handleForegroundMessage);

      // Handle notification taps that open the app
      _tapSub?.cancel();
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // Check if app was opened from a terminated state notification
      final initialMessage =
          await FirebaseMessaging.instance.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationTap(initialMessage);
      }
    } catch (_) {
      // Push is non-critical — don't crash the app
      state = false;
    }
  }

  void _handleForegroundMessage(RemoteMessage message) {
    // Foreground messages are received here.
    // The notification provider (Phase D) will listen to
    // PushNotificationService.onForegroundMessage to refresh the list.
    // For now, we just log it — the notification bell will pick it up.
  }

  void _handleNotificationTap(RemoteMessage message) {
    // Navigate to the relevant screen based on notification data.
    // The actionUrl in data payload maps to a GoRouter path.
    final actionUrl = message.data['actionUrl'] as String?;
    if (actionUrl != null && actionUrl.isNotEmpty) {
      // Navigation is handled by the notification screen tap handlers
      // since we don't have router access here in the provider.
      // The app.dart onMessageOpenedApp handler could be added if needed.
    }
  }

  void _cleanup() {
    _foregroundSub?.cancel();
    _tapSub?.cancel();
    state = false;
  }

  @override
  void dispose() {
    _cleanup();
    super.dispose();
  }
}

final pushNotificationProvider =
    StateNotifierProvider<PushNotificationNotifier, bool>((ref) {
  return PushNotificationNotifier(ref);
});
