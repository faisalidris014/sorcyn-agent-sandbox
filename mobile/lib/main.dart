import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import 'app.dart';
import 'core/config/env_config.dart';

/// Background message handler — must be a top-level function.
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // Background messages are displayed by the OS notification tray automatically.
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Stripe (graceful — works without key in dev)
  if (!kIsWeb && EnvConfig.stripePublishableKey.isNotEmpty) {
    Stripe.publishableKey = EnvConfig.stripePublishableKey;
  }

  // Initialize Firebase (graceful — app works without google-services.json in dev)
  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  } catch (e) {
    if (EnvConfig.isProduction) {
      // Unexpected in a configured build — log loudly so it's visible before Sentry starts
      debugPrint('[Firebase] FATAL: Init failed in production build: $e');
    } else {
      debugPrint('[Firebase] Not configured — push notifications disabled');
    }
  }

  // Initialize Sentry for crash reporting
  const sentryDsn = String.fromEnvironment('SENTRY_DSN', defaultValue: '');
  if (sentryDsn.isNotEmpty) {
    await SentryFlutter.init(
      (options) {
        options.dsn = sentryDsn;
        options.environment = EnvConfig.environment;
        // Phase 4 D-05 — match backend default (0.05) to keep Sentry quota
        // inside Team plan at MVP traffic (RESEARCH Pitfall 6).
        options.tracesSampleRate = EnvConfig.isProduction ? 0.05 : 1.0;
        options.sendDefaultPii = false;
      },
      appRunner: () => runApp(
        const ProviderScope(child: App()),
      ),
    );
  } else {
    runApp(const ProviderScope(child: App()));
  }
}
