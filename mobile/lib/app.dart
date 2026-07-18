import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'l10n/app_localizations.dart';

import 'core/config/env_config.dart';
import 'core/providers/app_mode_provider.dart';
import 'core/providers/locale_provider.dart';
import 'core/providers/marketplace_context_provider.dart';
import 'core/providers/push_notification_provider.dart';
import 'core/providers/session_reset_provider.dart';
import 'core/providers/socket_provider.dart';
import 'core/theme/app_theme.dart';
import 'features/announcements/presentation/widgets/announcement_banner.dart';
import 'features/auth/presentation/screens/forgot_password_screen.dart';
import 'features/auth/presentation/screens/login_screen.dart';
import 'features/auth/presentation/screens/register_screen.dart';
import 'features/auth/presentation/screens/reset_password_screen.dart';
import 'features/auth/presentation/screens/verify_email_screen.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/sellers/providers/seller_provider.dart';
import 'features/discover/data/models/discover_models.dart';
import 'features/discover/presentation/screens/discover_post_detail_screen.dart';
import 'features/discover/presentation/screens/discover_screen.dart';
import 'features/discover/presentation/screens/seller_offer_screen.dart';
import 'features/feed/presentation/screens/seller_feed_screen.dart';
import 'features/feed/presentation/screens/seller_post_detail_screen.dart';
import 'features/posts/data/models/post_model.dart';
import 'features/notifications/presentation/screens/notifications_screen.dart';
import 'features/messages/presentation/screens/chat_screen.dart';
import 'features/messages/presentation/screens/conversations_screen.dart';
import 'features/offers/presentation/screens/my_offers_screen.dart';
import 'features/offers/presentation/screens/offer_detail_screen.dart';
import 'features/offers/presentation/screens/post_offers_screen.dart';
import 'features/offers/presentation/screens/submit_offer_screen.dart';
import 'features/posts/presentation/screens/ai_post_creation_screen.dart';
import 'features/posts/presentation/screens/buyer_dashboard_screen.dart';
import 'features/posts/presentation/screens/create_post_method_screen.dart';
import 'features/posts/presentation/screens/manual_post_creation_screen.dart';
import 'features/posts/presentation/screens/my_posts_screen.dart';
import 'features/posts/presentation/screens/post_created_screen.dart';
import 'features/posts/presentation/screens/edit_post_screen.dart';
import 'features/posts/presentation/screens/post_detail_screen.dart';
import 'features/profile/presentation/screens/edit_profile_screen.dart';
import 'features/profile/presentation/screens/payment_methods_screen.dart';
import 'features/profile/presentation/screens/profile_screen.dart';
import 'features/profile/presentation/screens/public_profile_screen.dart';
import 'features/reviews/presentation/screens/submit_review_screen.dart';
import 'features/sellers/presentation/screens/saved_sellers_screen.dart';
import 'features/sellers/presentation/screens/seller_earnings_screen.dart';
import 'features/sellers/presentation/screens/seller_profile_screen.dart';
import 'features/sellers/presentation/screens/seller_profile_setup_screen.dart';
import 'features/sellers/presentation/screens/seller_profile_edit_screen.dart';
import 'features/sellers/presentation/screens/seller_add_category_screen.dart';
import 'features/sellers/presentation/screens/identity_verify_screen.dart';
import 'features/sellers/presentation/screens/payout_setup_screen.dart';
import 'features/sellers/presentation/screens/verification_screen.dart';
import 'features/transactions/presentation/screens/dispute_detail_screen.dart';
import 'features/settings/presentation/screens/help_support_screen.dart';
import 'features/settings/presentation/screens/business_profile_screen.dart';
import 'features/settings/presentation/screens/language_settings_screen.dart';
import 'features/settings/presentation/screens/settings_screen.dart';
import 'features/settings/presentation/screens/upgrade_to_business_screen.dart';
import 'features/transactions/presentation/screens/seller_transaction_detail_screen.dart';
import 'features/transactions/presentation/screens/transaction_detail_screen.dart';
import 'features/transactions/presentation/screens/transactions_screen.dart';
import 'shared/transitions/spring_page_transition.dart';
import 'shared/widgets/bottom_nav_shell.dart';

// Keys for each navigation branch
final _rootNavigatorKey = GlobalKey<NavigatorState>();

// ── Router Provider ──

final routerProvider = Provider<GoRouter>((ref) {
  // DO NOT ref.watch() here — that recreates the entire GoRouter on every
  // state change, destroying the navigation tree and causing infinite rebuilds.
  // Instead, use ref.read() inside redirect (evaluated at redirect time) and
  // ref.listen() + router.refresh() for non-auth providers.

  final router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/login',
    refreshListenable: _AuthRefreshNotifier(ref),
    redirect: (context, state) {
      // Read current auth state at redirect-evaluation time
      final authState = ref.read(authProvider);
      final isInitializing = authState.isInitializing;
      final isAuthenticated = authState.isAuthenticated;
      final needsVerification = authState.needsEmailVerification;

      final currentPath = state.matchedLocation;
      final isOnAuthPage = currentPath == '/login' ||
          currentPath == '/register' ||
          currentPath.startsWith('/auth/');

      // While initializing, don't redirect
      if (isInitializing) return null;

      // Authenticated → redirect away from auth pages
      if (isAuthenticated && isOnAuthPage) return '/dashboard';

      // Needs email verification → force to verify screen
      if (needsVerification && currentPath != '/auth/verify-email') {
        return '/auth/verify-email';
      }

      // Not authenticated → redirect to login (unless already on auth page)
      if (!isAuthenticated && !needsVerification && !isOnAuthPage) {
        return '/login';
      }

      // Seller onboarding gate (cases 1+2): a user in a seller context with no
      // seller profile MUST complete /seller/profile/setup before reaching the
      // app. "Seller context" = a pure seller account, a business account
      // (gated immediately per product decision Q3), or any account currently in
      // seller mode (covers a 'both' user switching to seller). We only act once
      // the profile fetch has resolved (profileLoaded) so a fresh seller isn't
      // bounced mid-load or on a transient error. Without this the backend feed
      // falls open and the new seller sees every category (the case-1 bug).
      if (isAuthenticated && !needsVerification) {
        final user = authState.user;
        final appMode = ref.read(appModeProvider);
        final sellerState = ref.read(sellerProfileProvider);
        final inSellerContext = user != null &&
            (user.accountType == 'seller' ||
                user.isBusiness ||
                appMode == AppMode.seller);
        if (inSellerContext &&
            sellerState.profileLoaded &&
            sellerState.profile == null &&
            currentPath != '/seller/profile/setup') {
          return '/seller/profile/setup';
        }
      }

      return null;
    },
    routes: [
      // Auth routes — pushed onto the navigator (not inside the shell), so they
      // get the locked Sorcyn spring transition (stiffness 320, damping 32).
      GoRoute(
        path: '/login',
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const LoginScreen(),
        ),
      ),
      GoRoute(
        path: '/register',
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const RegisterScreen(),
        ),
      ),
      GoRoute(
        path: '/auth/verify-email',
        pageBuilder: (context, state) {
          final token = state.uri.queryParameters['token'];
          return springPage<void>(
            key: state.pageKey,
            child: VerifyEmailScreen(token: token),
          );
        },
      ),
      GoRoute(
        path: '/auth/forgot-password',
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const ForgotPasswordScreen(),
        ),
      ),
      GoRoute(
        path: '/auth/reset-password',
        pageBuilder: (context, state) {
          final token = state.uri.queryParameters['token'] ?? '';
          return springPage<void>(
            key: state.pageKey,
            child: ResetPasswordScreen(token: token),
          );
        },
      ),

      // Shell route with bottom navigation — IndexedStack, intentionally
      // animation-free between tabs (matches BuyerDashboard.tsx behavior).
      // Routes pushed ON TOP of this shell still use the spring transition.
      // Buyer mode: Dashboard, My Posts, Messages, Profile
      // Seller mode: Feed, My Offers, Messages, Profile
      // Both modes share the same 4-branch shell — the content changes
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return BottomNavShell(navigationShell: navigationShell);
        },
        branches: [
          // Branch 0: Home (buyer) / Feed (seller)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/dashboard',
                builder: (context, state) {
                  return Consumer(
                    builder: (context, ref, _) {
                      final mode = ref.watch(appModeProvider);
                      return mode == AppMode.seller
                          ? const SellerFeedScreen()
                          : const BuyerDashboardScreen();
                    },
                  );
                },
              ),
            ],
          ),
          // Branch 1: Discover (buyer) / My Offers (seller). The buyer's own
          // posts moved to a pushed /my-posts screen (Home "See all" + Profile
          // menu); this tab slot is now the buyer Discover feed — #315.
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/discover',
                builder: (context, state) {
                  return Consumer(
                    builder: (context, ref, _) {
                      final mode = ref.watch(appModeProvider);
                      return mode == AppMode.seller
                          ? const MyOffersScreen()
                          : const DiscoverScreen();
                    },
                  );
                },
              ),
            ],
          ),
          // Branch 2: Messages (shared)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/messages',
                builder: (context, state) =>
                    const ConversationsScreen(),
              ),
            ],
          ),
          // Branch 3: Profile (shared)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),

      // Standalone routes (push on top of shell) — all use the locked Sorcyn
      // spring transition via `springPage()`.

      // My Posts — buyer's own posts, now a pushed full screen reached from the
      // Home "See all" link and the Profile menu (the tab slot became Discover, #315).
      GoRoute(
        path: '/my-posts',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const MyPostsScreen(),
        ),
      ),
      // Discover (#315): buyer-facing read-only post detail + single-offer view,
      // both opened from the Discover feed with the data passed via `extra`.
      GoRoute(
        path: '/discover/posts/:postId',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: DiscoverPostDetailScreen(
            postId: state.pathParameters['postId']!,
            item: state.extra as DiscoverItem?,
          ),
        ),
      ),
      GoRoute(
        path: '/discover/offer',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final args = state.extra;
          return springPage<void>(
            key: state.pageKey,
            child: args is SellerOfferArgs
                ? SellerOfferScreen(args: args)
                : const Scaffold(
                    body: Center(child: Text('Offer unavailable')),
                  ),
          );
        },
      ),
      GoRoute(
        path: '/posts/create',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const CreatePostMethodScreen(),
        ),
      ),
      GoRoute(
        path: '/posts/create/ai',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const AIPostCreationScreen(),
        ),
      ),
      GoRoute(
        path: '/posts/create/manual',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          // `extra` carries a Post to duplicate (from Discover) when present (#315).
          child: ManualPostCreationScreen(duplicateFrom: state.extra as Post?),
        ),
      ),
      GoRoute(
        path: '/posts/created/:postId',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: PostCreatedScreen(
            postId: state.pathParameters['postId']!,
          ),
        ),
      ),
      // Seller view of a buyer's request (read-only + Submit Offer). Distinct from
      // the owner-only PostDetailScreen at /posts/:postId so sellers never get the
      // owner overflow menu / CTA on someone else's post (#300).
      GoRoute(
        path: '/seller/posts/:postId',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: SellerPostDetailScreen(
            postId: state.pathParameters['postId']!,
          ),
        ),
      ),
      GoRoute(
        path: '/posts/:postId/edit',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: EditPostScreen(
            postId: state.pathParameters['postId']!,
          ),
        ),
      ),
      GoRoute(
        path: '/posts/:postId',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: PostDetailScreen(
            postId: state.pathParameters['postId']!,
          ),
        ),
      ),
      GoRoute(
        path: '/posts/:postId/offers',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: PostOffersScreen(
            postId: state.pathParameters['postId']!,
          ),
        ),
      ),
      GoRoute(
        path: '/posts/:postId/submit-offer',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: SubmitOfferScreen(
            postId: state.pathParameters['postId']!,
            postTitle: state.uri.queryParameters['title'],
          ),
        ),
      ),
      GoRoute(
        path: '/offers/:offerId',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: OfferDetailScreen(
            offerId: state.pathParameters['offerId']!,
          ),
        ),
      ),
      GoRoute(
        path: '/transactions',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const TransactionsScreen(),
        ),
      ),
      GoRoute(
        // Seller-side "My Jobs" — a separate entry point from buyer
        // Transactions, both backed by TransactionsScreen (#290).
        path: '/my-jobs',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const TransactionsScreen(isSeller: true),
        ),
      ),
      GoRoute(
        path: '/transactions/:transactionId',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: TransactionDetailScreen(
            transactionId: state.pathParameters['transactionId']!,
          ),
        ),
      ),
      GoRoute(
        path: '/transactions/:transactionId/seller',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: SellerTransactionDetailScreen(
            transactionId: state.pathParameters['transactionId']!,
          ),
        ),
      ),

      // Chat route (full-screen, above bottom nav)
      GoRoute(
        path: '/chat/:conversationId',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: ChatScreen(
            conversationId: state.pathParameters['conversationId']!,
          ),
        ),
      ),

      // Seller standalone routes
      GoRoute(
        path: '/seller/profile/setup',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const SellerProfileSetupScreen(),
        ),
      ),
      GoRoute(
        path: '/seller/profile',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const SellerProfileScreen(),
        ),
      ),
      // #298 — build the missing edit route (the profile edit pencil targets it).
      GoRoute(
        path: '/seller/profile/edit',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const SellerProfileEditScreen(),
        ),
      ),
      // #338 — seller add-category (add-major verification) flow.
      GoRoute(
        path: '/seller/profile/add-category',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const SellerAddCategoryScreen(),
        ),
      ),
      GoRoute(
        path: '/seller/verification',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const VerificationScreen(),
        ),
      ),
      GoRoute(
        path: '/seller/payouts/setup',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const StripeOnboardScreen(),
        ),
      ),
      GoRoute(
        path: '/seller/identity/verify',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const IdentityVerifyScreen(),
        ),
      ),

      // Notifications
      GoRoute(
        path: '/notifications',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const NotificationsScreen(),
        ),
      ),

      // Profile
      GoRoute(
        path: '/profile/edit',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const EditProfileScreen(),
        ),
      ),

      // Reviews
      GoRoute(
        path: '/transactions/:transactionId/review',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: SubmitReviewScreen(
            transactionId: state.pathParameters['transactionId']!,
          ),
        ),
      ),

      // Settings routes
      GoRoute(
        path: '/settings',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const SettingsScreen(),
        ),
      ),
      GoRoute(
        path: '/settings/language',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const LanguageSettingsScreen(),
        ),
      ),
      GoRoute(
        path: '/settings/upgrade-to-business',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const UpgradeToBusinessScreen(),
        ),
      ),
      GoRoute(
        path: '/settings/business-profile',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const BusinessProfileScreen(),
        ),
      ),

      // Saved Sellers
      GoRoute(
        path: '/saved-sellers',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const SavedSellersScreen(),
        ),
      ),

      // New routes — Batch 5
      GoRoute(
        path: '/users/:userId',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: PublicProfileScreen(
            userId: state.pathParameters['userId']!,
          ),
        ),
      ),
      GoRoute(
        path: '/payment-methods',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const PaymentMethodsScreen(),
        ),
      ),
      GoRoute(
        path: '/help',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const HelpSupportScreen(),
        ),
      ),
      GoRoute(
        path: '/seller/earnings',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: const SellerEarningsScreen(),
        ),
      ),
      GoRoute(
        path: '/transactions/:transactionId/dispute',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => springPage<void>(
          key: state.pageKey,
          child: DisputeDetailScreen(
            disputeId: state.pathParameters['transactionId']!,
          ),
        ),
      ),
    ],
  );

  // Trigger redirect re-evaluation when app mode or marketplace context changes
  ref.listen(appModeProvider, (_, _) => router.refresh());
  ref.listen(marketplaceContextProvider, (_, _) => router.refresh());
  // Re-evaluate the seller onboarding gate when "needs setup" flips: the eager
  // loadProfile resolving to null arms it, and createProfile succeeding releases
  // it. Selecting the derived bool avoids a refresh on every seller-state tick.
  ref.listen(
    sellerProfileProvider.select((s) => s.profileLoaded && s.profile == null),
    (_, _) => router.refresh(),
  );

  return router;
});

// Notifier that triggers GoRouter refresh when auth state changes
class _AuthRefreshNotifier extends ChangeNotifier {
  _AuthRefreshNotifier(Ref ref) {
    ref.listen(authProvider, (previous, next) {
      notifyListeners();
    });
  }
}

// ── App Widget ──

class App extends ConsumerWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final locale = ref.watch(localeProvider);
    // Initialize socket connection (auto-connects on auth, disconnects on logout)
    ref.watch(socketProvider);
    // Initialize push notifications (auto-registers on auth)
    ref.watch(pushNotificationProvider);
    // Wipe user-scoped provider state when the signed-in account changes
    ref.watch(sessionResetProvider);

    return MaterialApp.router(
      title: 'Reverse Marketplace',
      theme: AppTheme.lightTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        // Custom error widget for production (replaces red error screen)
        ErrorWidget.builder = (FlutterErrorDetails details) {
          if (EnvConfig.isProduction) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'Something went wrong',
                  style: TextStyle(color: Colors.grey, fontSize: 16),
                ),
              ),
            );
          }
          return ErrorWidget(details.exception);
        };
        return AnnouncementBannerHost(child: child!);
      },
      // i18n support
      locale: locale,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: AppLocalizations.supportedLocales,
    );
  }
}
