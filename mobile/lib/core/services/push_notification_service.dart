import 'dart:async';

import 'package:dio/dio.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:logger/logger.dart';

import '../config/env_config.dart';
import '../storage/secure_storage.dart';
import '../config/app_config.dart';

final _logger = Logger(printer: PrettyPrinter(methodCount: 0));

class PushNotificationService {
  static PushNotificationService? _instance;
  StreamSubscription? _tokenRefreshSub;

  // Stream for foreground notifications (consumed by providers)
  final _foregroundController =
      StreamController<RemoteMessage>.broadcast();
  Stream<RemoteMessage> get onForegroundMessage =>
      _foregroundController.stream;

  PushNotificationService._();

  static PushNotificationService get instance {
    _instance ??= PushNotificationService._();
    return _instance!;
  }

  /// Whether Firebase initialized successfully — false in local dev without config files.
  bool get isAvailable => Firebase.apps.isNotEmpty;

  /// Initialize push notifications: request permissions, get token, listen for refreshes.
  Future<void> initialize() async {
    if (!isAvailable) {
      _logger.w('[Push] Skipping — Firebase not initialized');
      return;
    }
    try {
      final messaging = FirebaseMessaging.instance;

      // Request permission (iOS requires explicit prompt)
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (settings.authorizationStatus == AuthorizationStatus.denied) {
        _logger.w('[Push] Notification permission denied');
        return;
      }

      _logger.d('[Push] Permission: ${settings.authorizationStatus}');

      // Get initial token and register
      await registerToken();

      // Listen for token refreshes
      _tokenRefreshSub?.cancel();
      _tokenRefreshSub = messaging.onTokenRefresh.listen((newToken) {
        _logger.d('[Push] Token refreshed');
        _registerTokenWithBackend(newToken);
      });

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen((message) {
        _logger.d('[Push] Foreground message: ${message.notification?.title}');
        _foregroundController.add(message);
      });
    } catch (e) {
      // Graceful failure — push is non-critical
      _logger.e('[Push] Initialization failed: $e');
    }
  }

  /// Get current FCM token and register it with the backend.
  Future<void> registerToken() async {
    if (!isAvailable) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _registerTokenWithBackend(token);
      }
    } catch (e) {
      _logger.e('[Push] Failed to get/register token: $e');
    }
  }

  /// Clear the FCM token on the backend (called on logout).
  Future<void> clearToken() async {
    try {
      final accessToken =
          await SecureStorage.read(AppConfig.accessTokenKey);
      if (accessToken == null) return;

      final dio = Dio(BaseOptions(
        baseUrl: EnvConfig.apiBaseUrl,
        headers: {'Authorization': 'Bearer $accessToken'},
        connectTimeout: const Duration(seconds: 5),
        receiveTimeout: const Duration(seconds: 5),
      ));

      await dio.put('/users/me/fcm-token', data: {'fcmToken': ''});
    } catch (_) {
      // Best-effort — don't block logout on failure
    }
  }

  Future<void> _registerTokenWithBackend(String fcmToken) async {
    try {
      final accessToken =
          await SecureStorage.read(AppConfig.accessTokenKey);
      if (accessToken == null) return;

      // Use a fresh Dio instance to avoid circular dependency with DioClient
      final dio = Dio(BaseOptions(
        baseUrl: EnvConfig.apiBaseUrl,
        headers: {'Authorization': 'Bearer $accessToken'},
        connectTimeout: const Duration(seconds: 5),
        receiveTimeout: const Duration(seconds: 5),
      ));

      await dio.put('/users/me/fcm-token', data: {'fcmToken': fcmToken});
      _logger.d('[Push] Token registered with backend');
    } catch (e) {
      _logger.e('[Push] Failed to register token: $e');
    }
  }

  void dispose() {
    _tokenRefreshSub?.cancel();
    _foregroundController.close();
    _instance = null;
  }
}
