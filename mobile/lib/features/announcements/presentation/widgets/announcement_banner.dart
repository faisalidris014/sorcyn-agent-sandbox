import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../data/models/announcement_model.dart';
import '../../providers/announcement_provider.dart';

/// Wraps the app's navigator and renders the active announcement banner above
/// every screen. Mounted once in [MaterialApp.builder] so it covers both the
/// bottom-nav shell and any pushed routes on top of it.
class AnnouncementBannerHost extends ConsumerWidget {
  final Widget child;

  const AnnouncementBannerHost({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final announcement = ref.watch(
      announcementProvider.select((s) => s.visible),
    );

    return Column(
      children: [
        if (announcement != null)
          AnnouncementBanner(
            announcement: announcement,
            onDismiss: () => ref
                .read(announcementProvider.notifier)
                .dismiss(announcement.id),
          ),
        Expanded(child: child),
      ],
    );
  }
}

/// The banner UI itself. Severity drives the background colour and icon.
class AnnouncementBanner extends StatelessWidget {
  final Announcement announcement;
  final VoidCallback onDismiss;

  const AnnouncementBanner({
    super.key,
    required this.announcement,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final severity = announcement.severity;
    final dismissLabel =
        AppLocalizations.of(context)?.announcementDismiss ?? 'Dismiss';

    // The coloured background extends up behind the status bar; SafeArea pads
    // the content below the notch. Light status-bar icons stay legible on the
    // colour while the banner is shown.
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Material(
        color: severity.background,
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Icon(severity.icon, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    announcement.message,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      height: 1.35,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Plain InkWell, not IconButton — the banner lives in
                // MaterialApp.builder (above the Navigator's Overlay), and
                // IconButton's tooltip needs an Overlay ancestor it can't find here.
                // Semantics carries the dismiss label for accessibility instead.
                Semantics(
                  button: true,
                  label: dismissLabel,
                  child: InkResponse(
                    onTap: onDismiss,
                    radius: 18,
                    child: const Padding(
                      padding: EdgeInsets.all(7),
                      child: Icon(Icons.close, color: Colors.white, size: 18),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
