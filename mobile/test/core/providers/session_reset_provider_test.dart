import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:reverse_marketplace/core/providers/app_mode_provider.dart';
import 'package:reverse_marketplace/core/providers/session_reset_provider.dart';
import 'package:reverse_marketplace/features/auth/data/models/user_model.dart';
import 'package:reverse_marketplace/features/auth/data/repositories/auth_repository.dart';
import 'package:reverse_marketplace/features/auth/providers/auth_provider.dart';
import 'package:reverse_marketplace/features/messages/providers/conversations_provider.dart';
import 'package:reverse_marketplace/features/offers/providers/offer_provider.dart';
import 'package:reverse_marketplace/features/posts/providers/post_provider.dart';

/// Avoids platform-channel calls (SecureStorage, Dio) in AuthNotifier._init.
class _FakeAuthRepository extends AuthRepository {
  @override
  Future<bool> isLoggedIn() async => false;

  @override
  Future<void> logout() async {}
}

/// Lets tests drive auth transitions directly, without the network/push
/// side effects of the real login()/logout() methods.
class _TestAuthNotifier extends AuthNotifier {
  _TestAuthNotifier() : super(_FakeAuthRepository());

  void setUser(User? user) {
    state = AuthState(user: user, isInitializing: false);
  }
}

User _user(String id, {String accountType = 'both'}) => User(
      id: id,
      email: '$id@test.com',
      firstName: 'Test',
      lastName: 'User',
      accountType: accountType,
      emailVerified: true,
      createdAt: DateTime(2026, 1, 1),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // Stateful in-memory stand-in for secure storage so tests can seed a
  // previous session's persisted app_mode and observe writes.
  late Map<String, String> storage;

  setUp(() {
    storage = <String, String>{};
    // AppModeNotifier reads secure storage on creation; stub the plugin
    // channel so invalidating it inside a plain test doesn't throw.
    const channel =
        MethodChannel('plugins.it_nomads.com/flutter_secure_storage');
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
      switch (call.method) {
        case 'read':
          return storage[call.arguments['key'] as String];
        case 'readAll':
          return Map<String, String>.from(storage);
        case 'write':
          storage[call.arguments['key'] as String] =
              call.arguments['value'] as String;
          return null;
        case 'delete':
          storage.remove(call.arguments['key'] as String);
          return null;
        default:
          return null;
      }
    });
  });

  late _TestAuthNotifier authNotifier;
  late ProviderContainer container;

  Future<void> setUpContainer() async {
    authNotifier = _TestAuthNotifier();
    container = ProviderContainer(overrides: [
      authProvider.overrideWith((ref) => authNotifier),
    ]);
    addTearDown(container.dispose);
    // Let AuthNotifier._init settle before driving transitions.
    await Future<void>.delayed(const Duration(milliseconds: 20));
    // Activate the listener, as App.build does in production.
    container.read(sessionResetProvider);
  }

  test('logout resets user-scoped providers', () async {
    await setUpContainer();
    authNotifier.setUser(_user('user-a'));

    final posts = container.read(postsProvider.notifier);
    final myOffers = container.read(myOffersProvider.notifier);
    final conversations = container.read(conversationsProvider.notifier);

    authNotifier.setUser(null);

    expect(container.read(postsProvider.notifier), isNot(same(posts)));
    expect(container.read(myOffersProvider.notifier), isNot(same(myOffers)));
    expect(container.read(conversationsProvider.notifier),
        isNot(same(conversations)));
  });

  test('switching directly to another account resets providers', () async {
    await setUpContainer();
    authNotifier.setUser(_user('user-a'));

    final posts = container.read(postsProvider.notifier);

    authNotifier.setUser(_user('user-b'));

    expect(container.read(postsProvider.notifier), isNot(same(posts)));
  });

  test('same-user state updates do not reset providers', () async {
    await setUpContainer();
    authNotifier.setUser(_user('user-a'));

    final posts = container.read(postsProvider.notifier);

    // e.g. refreshCurrentUser() re-emitting the same user
    authNotifier.setUser(_user('user-a'));

    expect(container.read(postsProvider.notifier), same(posts));
  });

  test('app mode falls back to buyer after logout', () async {
    await setUpContainer();
    authNotifier.setUser(_user('user-a'));
    // Let the login-driven mode resolution settle before toggling manually.
    await Future<void>.delayed(const Duration(milliseconds: 20));

    await container.read(appModeProvider.notifier).setMode(AppMode.seller);
    expect(container.read(appModeProvider), AppMode.seller);

    authNotifier.setUser(null);
    await Future<void>.delayed(const Duration(milliseconds: 20));

    expect(container.read(appModeProvider), AppMode.buyer);
  });

  test('seller-only account forces seller mode despite stored buyer', () async {
    // A previous session persisted buyer mode on this device.
    storage['app_mode'] = 'buyer';
    await setUpContainer();

    authNotifier.setUser(_user('seller-only', accountType: 'seller'));
    await Future<void>.delayed(const Duration(milliseconds: 20));

    expect(container.read(appModeProvider), AppMode.seller);
  });

  test('buyer-only account forces buyer mode despite stored seller', () async {
    storage['app_mode'] = 'seller';
    await setUpContainer();

    authNotifier.setUser(_user('buyer-only', accountType: 'buyer'));
    await Future<void>.delayed(const Duration(milliseconds: 20));

    expect(container.read(appModeProvider), AppMode.buyer);
  });

  test('both account restores saved seller preference on login', () async {
    storage['app_mode'] = 'seller';
    await setUpContainer();

    authNotifier.setUser(_user('both-user', accountType: 'both'));
    await Future<void>.delayed(const Duration(milliseconds: 20));

    expect(container.read(appModeProvider), AppMode.seller);
  });

  test('account switch from buyer to seller-only flips mode to seller',
      () async {
    storage['app_mode'] = 'buyer';
    await setUpContainer();

    // Buyer-only signs in first and lands in buyer mode.
    authNotifier.setUser(_user('buyer', accountType: 'buyer'));
    await Future<void>.delayed(const Duration(milliseconds: 20));
    expect(container.read(appModeProvider), AppMode.buyer);

    // Seller-only signs in next — must not inherit the buyer mode.
    authNotifier.setUser(_user('seller', accountType: 'seller'));
    await Future<void>.delayed(const Duration(milliseconds: 20));
    expect(container.read(appModeProvider), AppMode.seller);
  });
}
