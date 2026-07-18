import 'dart:async';

import 'package:logger/logger.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../config/app_config.dart';
import '../config/env_config.dart';
import '../storage/secure_storage.dart';

final _logger = Logger(printer: PrettyPrinter(methodCount: 0));

class SocketClient {
  static SocketClient? _instance;
  io.Socket? _socket;
  bool _isConnected = false;
  Timer? _heartbeatTimer;

  // Stream controllers for broadcasting events to providers
  final _messageController = StreamController<Map<String, dynamic>>.broadcast();
  final _notificationController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _typingStartController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _typingStopController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _messagesReadController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _connectionController = StreamController<bool>.broadcast();

  // Public event streams
  Stream<Map<String, dynamic>> get onNewMessage => _messageController.stream;
  Stream<Map<String, dynamic>> get onNotification =>
      _notificationController.stream;
  Stream<Map<String, dynamic>> get onTypingStart =>
      _typingStartController.stream;
  Stream<Map<String, dynamic>> get onTypingStop =>
      _typingStopController.stream;
  Stream<Map<String, dynamic>> get onMessagesRead =>
      _messagesReadController.stream;
  Stream<bool> get onConnectionChange => _connectionController.stream;

  bool get isConnected => _isConnected;

  SocketClient._();

  static SocketClient get instance {
    _instance ??= SocketClient._();
    return _instance!;
  }

  /// Connect to the Socket.IO server with the current JWT token.
  Future<void> connect() async {
    if (_isConnected && _socket != null) return;

    // Defensive: cancel any prior heartbeat before starting a new connection.
    // Without this, every reconnect leaked a Timer.periodic and the server
    // received N heartbeats every 4 minutes after N reconnects.
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;

    final token = await SecureStorage.read(AppConfig.accessTokenKey);
    if (token == null) return;

    // Derive socket URL from API base URL (strip /api/v1 suffix)
    final baseUrl = EnvConfig.apiBaseUrl.replaceAll('/api/v1', '');

    try {
      // Don't auto-connect — set up listeners first to catch errors
      _socket = io.io(
        baseUrl,
        io.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .setAuth({'token': token})
            .disableAutoConnect()
            .enableReconnection()
            .setReconnectionDelay(1000)
            .setReconnectionAttempts(5)
            .build(),
      );

      _socket!.onConnect((_) {
        _logger.d('[Socket] Connected');
        _isConnected = true;
        _connectionController.add(true);
      });

      _socket!.onDisconnect((_) {
        _logger.d('[Socket] Disconnected');
        _isConnected = false;
        _connectionController.add(false);
      });

      _socket!.onConnectError((err) {
        _logger.w('[Socket] Connection error: $err');
        _isConnected = false;
        _connectionController.add(false);
      });

      _socket!.onReconnect((_) {
        _logger.d('[Socket] Reconnected');
        _isConnected = true;
        _connectionController.add(true);
      });

      // Register event listeners
      _socket!.on('new_message', (data) {
        if (data is Map<String, dynamic>) {
          _messageController.add(data);
        }
      });

      _socket!.on('notification', (data) {
        if (data is Map<String, dynamic>) {
          _notificationController.add(data);
        }
      });

      _socket!.on('typing_start', (data) {
        if (data is Map<String, dynamic>) {
          _typingStartController.add(data);
        }
      });

      _socket!.on('typing_stop', (data) {
        if (data is Map<String, dynamic>) {
          _typingStopController.add(data);
        }
      });

      _socket!.on('messages_read', (data) {
        if (data is Map<String, dynamic>) {
          _messagesReadController.add(data);
        }
      });

      // Heartbeat every 4 minutes to refresh presence TTL (5 min on server).
      // Stored so disconnect()/reconnect() can cancel it.
      _heartbeatTimer = Timer.periodic(const Duration(minutes: 4), (_) {
        if (_isConnected) _socket?.emit('heartbeat');
      });

      // Now connect after all listeners are registered
      _socket!.connect();
    } catch (e) {
      _logger.e('[Socket] Failed to initialize: $e');
      _isConnected = false;
      _connectionController.add(false);
    }
  }

  /// Reconnect with a fresh token (e.g., after token refresh).
  Future<void> reconnect() async {
    disconnect();
    await connect();
  }

  /// Disconnect from the server.
  void disconnect() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
    _connectionController.add(false);
  }

  /// Join a conversation room to receive real-time messages.
  void joinConversation(String conversationId) {
    _socket?.emit('join_conversation', conversationId);
  }

  /// Leave a conversation room.
  void leaveConversation(String conversationId) {
    _socket?.emit('leave_conversation', conversationId);
  }

  /// Emit typing start event.
  void emitTypingStart(String conversationId) {
    _socket?.emit('typing_start', conversationId);
  }

  /// Emit typing stop event.
  void emitTypingStop(String conversationId) {
    _socket?.emit('typing_stop', conversationId);
  }

  /// Clean up all resources.
  void dispose() {
    disconnect();
    _messageController.close();
    _notificationController.close();
    _typingStartController.close();
    _typingStopController.close();
    _messagesReadController.close();
    _connectionController.close();
    _instance = null;
  }
}
