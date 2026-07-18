import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

/// Reproduces the auth interceptor's empty-body backfill in isolation so the
/// test does not depend on SecureStorage. The auth interceptor in the real
/// client adds the same logic — see `dio_client.dart` `_AuthInterceptor`.
class _EmptyBodyInterceptor extends Interceptor {
  @override
  void onRequest(
      RequestOptions options, RequestInterceptorHandler handler) {
    final method = options.method.toUpperCase();
    final needsBody =
        method == 'POST' || method == 'PUT' || method == 'PATCH';
    if (needsBody && options.data == null) {
      options.data = const <String, dynamic>{};
    }
    handler.next(options);
  }
}

void main() {
  group('Empty-body interceptor (HTTP 415 prevention)', () {
    late RequestOptions captured;

    Dio buildDio() {
      final dio = Dio(BaseOptions(
        headers: {'Content-Type': 'application/json'},
      ));
      dio.interceptors.add(_EmptyBodyInterceptor());
      dio.interceptors.add(InterceptorsWrapper(
        onRequest: (options, handler) {
          captured = options;
          handler.resolve(Response(
            requestOptions: options,
            statusCode: 200,
            data: {'success': true},
          ));
        },
      ));
      return dio;
    }

    test('POST with no body gets {} attached', () async {
      final dio = buildDio();
      await dio.post('/posts/123/extend');
      expect(captured.data, const <String, dynamic>{});
    });

    test('PUT with no body gets {} attached', () async {
      final dio = buildDio();
      await dio.put('/notifications/abc/read');
      expect(captured.data, const <String, dynamic>{});
    });

    test('PATCH with no body gets {} attached', () async {
      final dio = buildDio();
      await dio.patch('/whatever');
      expect(captured.data, const <String, dynamic>{});
    });

    test('POST with explicit body is left untouched', () async {
      final dio = buildDio();
      await dio.post('/posts', data: {'title': 'hello'});
      expect(captured.data, {'title': 'hello'});
    });

    test('GET is not modified (no Content-Type concern)', () async {
      final dio = buildDio();
      await dio.get('/posts/feed');
      expect(captured.data, isNull);
    });

    test('DELETE is not modified', () async {
      final dio = buildDio();
      await dio.delete('/posts/123');
      expect(captured.data, isNull);
    });
  });
}
