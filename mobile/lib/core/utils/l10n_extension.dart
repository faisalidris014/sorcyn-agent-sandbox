import 'package:flutter/widgets.dart';
import '../../l10n/app_localizations.dart';

/// Convenience extension to access AppLocalizations from BuildContext.
///
/// Usage: `context.l10n.myPosts` instead of `AppLocalizations.of(context)!.myPosts`
extension L10nExtension on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this)!;
}
