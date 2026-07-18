import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../network/dio_client.dart';
import '../network/socket_client.dart';

/// Manages Socket.IO lifecycle: connect on auth, disconnect on logout.
class SocketNotifier extends StateNotifier<bool> {
  final Ref _ref;
  StreamSubscription<bool>? _connectionSub;

  SocketNotifier(this._ref) : super(false) {
    _listenToAuth();
  }

  void _listenToAuth() {
    _ref.listen(authProvider, (previous, next) {
      final wasAuthenticated = previous?.isAuthenticated ?? false;
      final isAuthenticated = next.isAuthenticated;

      if (!wasAuthenticated && isAuthenticated) {
        _connect();
      } else if (wasAuthenticated && !isAuthenticated) {
        _disconnect();
      }
    });

    // Connect immediately if already authenticated
    final authState = _ref.read(authProvider);
    if (authState.isAuthenticated) {
      _connect();
    }
  }

  Future<void> _connect() async {
    final socket = SocketClient.instance;
    _connectionSub?.cancel();
    _connectionSub = socket.onConnectionChange.listen((connected) {
      if (mounted) state = connected;
    });
    // Reconnect the socket whenever the Dio interceptor silently rotates the
    // access token (401 → refresh → new token saved). Without this, the socket
    // keeps the original token baked into its auth option; when it eventually
    // reconnects (network flap) it hands the revoked token back and the server
    // rejects it with "Token has been revoked".
    DioClient.onTokenRefreshed = () => socket.reconnect();
    await socket.connect();
  }

  void _disconnect() {
    _connectionSub?.cancel();
    DioClient.onTokenRefreshed = null;
    SocketClient.instance.disconnect();
    if (mounted) state = false;
  }

  @override
  void dispose() {
    _connectionSub?.cancel();
    super.dispose();
  }
}

/// Provides socket connection status. Automatically connects/disconnects
/// based on auth state.
final socketProvider = StateNotifierProvider<SocketNotifier, bool>((ref) {
  return SocketNotifier(ref);
});
