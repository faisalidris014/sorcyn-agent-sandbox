import 'package:dio/dio.dart';
import 'package:logger/logger.dart';
import 'package:sentry_dio/sentry_dio.dart' as sentry_dio;

import '../config/app_config.dart';
import '../config/env_config.dart';
import '../storage/secure_storage.dart';
import 'api_response.dart';

final _logger = Logger(printer: PrettyPrinter(methodCount: 0));

class DioClient {
  static Dio? _dio;

  /// Called after a silent token refresh succeeds. Wired up by SocketNotifier
  /// so the socket reconnects with the new token before the old one is revoked.
  static void Function()? onTokenRefreshed;

  static Dio get instance {
    _dio ??= _createDio();
    return _dio!;
  }

  static Dio _createDio() {
    final dio = Dio(
      BaseOptions(
        baseUrl: EnvConfig.apiBaseUrl,
        connectTimeout: AppConfig.connectTimeout,
        receiveTimeout: AppConfig.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add Sentry breadcrumbs for HTTP requests
    dio.addSentry();

    dio.interceptors.addAll([
      _AuthInterceptor(dio),
      if (!EnvConfig.isProduction) _LoggingInterceptor(),
    ]);

    return dio;
  }

  static void reset() {
    _dio?.close();
    _dio = null;
  }

  DioClient._();
}

// ── Auth Interceptor (Token Injection + Refresh on 401) ──

class _AuthInterceptor extends Interceptor {
  final Dio _dio;
  bool _isRefreshing = false;

  _AuthInterceptor(this._dio);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final accessToken = await SecureStorage.read(AppConfig.accessTokenKey);
    if (accessToken != null) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }

    // Send locale for i18n (Accept-Language header)
    final lang = await SecureStorage.read('preferred_language') ?? 'en';
    options.headers['Accept-Language'] = lang;

    // Send marketplace context header
    final ctx = await SecureStorage.read('marketplace_context') ?? 'b2c';
    options.headers['X-Marketplace-Context'] = ctx;

    // Fastify's JSON body parser rejects requests with `Content-Type:
    // application/json` and an empty body (HTTP 415). Our base options always
    // set that content type, so every no-body POST/PUT/PATCH would 415. Send
    // an empty JSON object instead — valid JSON, harmless to handlers that
    // expect no body, fixes the entire bug class at one site.
    final method = options.method.toUpperCase();
    final needsBody = method == 'POST' || method == 'PUT' || method == 'PATCH';
    if (needsBody && options.data == null) {
      options.data = const <String, dynamic>{};
    }

    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final isAuthPath = err.requestOptions.path.contains('/auth/');
    if (err.response?.statusCode == 401 && !_isRefreshing && !isAuthPath) {
      _isRefreshing = true;
      try {
        final refreshToken =
            await SecureStorage.read(AppConfig.refreshTokenKey);
        if (refreshToken == null) {
          _isRefreshing = false;
          return _handleAuthFailure(err, handler);
        }

        // Use a fresh Dio instance to avoid interceptor loop
        final freshDio = Dio(BaseOptions(
          baseUrl: EnvConfig.apiBaseUrl,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ));

        final response = await freshDio.post(
          '/auth/refresh',
          data: {'refreshToken': refreshToken},
        );

        final data = response.data['data'] as Map<String, dynamic>;
        final newAccessToken = data['accessToken'] as String;
        final newRefreshToken = data['refreshToken'] as String;

        await SecureStorage.write(AppConfig.accessTokenKey, newAccessToken);
        await SecureStorage.write(AppConfig.refreshTokenKey, newRefreshToken);

        _isRefreshing = false;
        DioClient.onTokenRefreshed?.call();

        // Retry original request with new token
        final opts = err.requestOptions;
        opts.headers['Authorization'] = 'Bearer $newAccessToken';
        final retryResponse = await _dio.fetch(opts);
        return handler.resolve(retryResponse);
      } catch (e) {
        _isRefreshing = false;
        await SecureStorage.deleteAll();
        return _handleAuthFailure(err, handler);
      }
    }

    // Parse API error response
    if (err.response != null && err.response!.data is Map) {
      final data = err.response!.data as Map<String, dynamic>;
      if (data['error'] != null) {
        final apiError =
            ApiError.fromJson(data['error'] as Map<String, dynamic>);
        return handler.reject(DioException(
          requestOptions: err.requestOptions,
          response: err.response,
          error: ApiException(apiError),
          type: err.type,
        ));
      }
    }

    // Network errors
    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout) {
      return handler.reject(DioException(
        requestOptions: err.requestOptions,
        error: const NetworkException('Connection timeout. Please try again.'),
        type: err.type,
      ));
    }

    if (err.type == DioExceptionType.connectionError) {
      // In non-production builds, surface the actual base URL we couldn't
      // reach plus the realistic dev cause (backend not running). The
      // generic user-friendly string stays for production.
      final NetworkException message = EnvConfig.isProduction
          ? const NetworkException(
              'Unable to connect. Check your internet connection.')
          : NetworkException(
              'Cannot reach API at ${err.requestOptions.baseUrl}. '
              'Is the backend running? (cd backend && npm run dev)');
      return handler.reject(DioException(
        requestOptions: err.requestOptions,
        error: message,
        type: err.type,
      ));
    }

    handler.next(err);
  }

  void _handleAuthFailure(
    DioException err,
    ErrorInterceptorHandler handler,
  ) {
    handler.reject(DioException(
      requestOptions: err.requestOptions,
      response: err.response,
      error: const AuthExpiredException(),
      type: err.type,
    ));
  }
}

// ── Logging Interceptor (Dev Only) ──

class _LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    _logger.d('-> ${options.method} ${options.path}');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    _logger.i('<- ${response.statusCode} ${response.requestOptions.path}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    _logger.e(
        '<- ${err.response?.statusCode ?? 'ERR'} ${err.requestOptions.path}');
    handler.next(err);
  }
}

// ── Custom Exceptions ──

class ApiException implements Exception {
  final ApiError error;

  const ApiException(this.error);

  @override
  String toString() => error.userMessage;
}

class NetworkException implements Exception {
  final String message;

  const NetworkException(this.message);

  @override
  String toString() => message;
}

class AuthExpiredException implements Exception {
  const AuthExpiredException();

  @override
  String toString() => 'Session expired. Please log in again.';
}
