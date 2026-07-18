import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../../features/discover/providers/discover_provider.dart';
import '../../features/feed/providers/feed_provider.dart';
import '../../features/messages/providers/chat_provider.dart';
import '../../features/messages/providers/conversations_provider.dart';
import '../../features/notifications/providers/notification_provider.dart';
import '../../features/offers/providers/offer_provider.dart';
import '../../features/posts/providers/post_provider.dart';
import '../../features/reviews/providers/review_provider.dart';
import '../../features/sellers/providers/saved_sellers_provider.dart';
import '../../features/sellers/providers/seller_provider.dart';
import '../../features/transactions/providers/transaction_provider.dart';
import 'app_mode_provider.dart';
import 'marketplace_context_provider.dart';

/// Every provider that holds data fetched (or persisted) for the signed-in
/// user. A provider missing from this list leaks its state into the next
/// account that signs in on the same device (the "seller sees the buyer's
/// My Posts" bug). When adding a new user-scoped provider, register it here.
///
/// Deliberately excluded: categoryTreeProvider (public catalog data) and
/// localeProvider (device preference, not account data).
///
/// `appModeProvider` is also excluded from this list — it is NOT invalidated.
/// Invalidating it would recreate the notifier, which reloads the previous
/// session's device-stored mode, so a seller-only account would still land on
/// the buyer dashboard (issue #178). Instead the listener below drives it from
/// the new user's `accountType`.
final List<ProviderOrFamily> userScopedProviders = [
  postsProvider,
  postDetailProvider,
  feedProvider,
  discoverProvider,
  offersProvider,
  offerDetailProvider,
  myOffersProvider,
  conversationsProvider,
  chatProvider,
  notificationsProvider,
  notificationUnreadCountProvider,
  transactionsProvider,
  transactionDetailProvider,
  reviewSubmitProvider,
  savedSellersProvider,
  sellerProfileProvider,
  marketplaceContextProvider,
];

/// Wipes all user-scoped state whenever the authenticated user changes:
/// logout, account switch, or a fresh login. Without this, StateNotifiers
/// keep the previous account's data in memory and screens with
/// load-if-empty guards (e.g. the buyer dashboard) never refetch.
///
/// Same lifecycle pattern as `socketProvider`: listens to [authProvider]
/// and is activated once by `ref.watch` in `App.build`.
final sessionResetProvider = Provider<void>((ref) {
  ref.listen<AuthState>(authProvider, (previous, next) {
    // Initial build of authProvider (previous == null) is not a user change.
    if (previous == null) return;
    final prevId = previous.user?.id;
    final nextId = next.user?.id;
    if (prevId == nextId) return;
    for (final provider in userScopedProviders) {
      ref.invalidate(provider);
    }
    // App mode is account-type driven (see userScopedProviders note): set it
    // from the new user instead of letting it reload stale device storage.
    final nextUser = next.user;
    if (nextUser == null) {
      ref.read(appModeProvider.notifier).reset();
    } else {
      ref.read(appModeProvider.notifier).applyAccountType(nextUser.accountType);
      // Eagerly resolve the seller profile so the onboarding gate (app.dart
      // redirect) has a definitive profileLoaded state to read. Only for users
      // who can have a seller profile — buyers never hit the gate. Fires on
      // fresh login, account switch, and cold-start session restore (authProvider
      // ._init completes after this listener attaches).
      if (nextUser.isSeller || nextUser.isBusiness) {
        ref.read(sellerProfileProvider.notifier).loadProfile();
      }
    }
  });
});
