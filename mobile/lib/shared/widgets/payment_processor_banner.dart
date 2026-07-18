import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Shows the payment-processor outage banner (RUNBOOK_OPS.md §2 / issue #84).
///
/// [message] is the server-supplied, user-safe copy — it never names the
/// processor. [queued] selects the tone: amber/info when the offer was saved and
/// payment was queued for retry, warning when a high-value attempt was blocked.
///
/// Uses a [MaterialBanner] (persistent until dismissed) rather than a transient
/// SnackBar so the user has time to read what happened to their payment.
void showPaymentProcessorBanner(
  BuildContext context,
  String message, {
  required bool queued,
}) {
  final messenger = ScaffoldMessenger.of(context);
  final accent = queued ? AppColors.info : AppColors.warning;

  messenger.clearMaterialBanners();
  messenger.showMaterialBanner(
    MaterialBanner(
      backgroundColor: accent.withValues(alpha: 0.08),
      leading: Icon(
        queued ? Icons.schedule_outlined : Icons.pause_circle_outline,
        color: accent,
      ),
      content: Text(
        message,
        style: const TextStyle(
          fontSize: 13.5,
          height: 1.35,
          color: AppColors.black,
          fontWeight: FontWeight.w500,
        ),
      ),
      actions: [
        TextButton(
          onPressed: messenger.clearMaterialBanners,
          child: Text(
            queued ? 'Got it' : 'Dismiss',
            style: TextStyle(color: accent, fontWeight: FontWeight.w700),
          ),
        ),
      ],
    ),
  );
}
