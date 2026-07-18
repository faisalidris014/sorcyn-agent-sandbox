import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:reverse_marketplace/core/network/api_error_extractor.dart';
import 'package:reverse_marketplace/core/network/api_response.dart';
import 'package:reverse_marketplace/core/network/dio_client.dart';

void main() {
  group('extractApiErrorMessage', () {
    final dummyOptions = RequestOptions(path: '/posts');

    test('reads ApiException wrapped by DioClient interceptor', () {
      final apiError = ApiError(
        type: 'about:blank',
        title: 'ValidationError',
        status: 400,
        detail: 'Request validation failed',
        errors: {
          'urgency': ['Invalid enum value'],
        },
      );
      final dioErr = DioException(
        requestOptions: dummyOptions,
        error: ApiException(apiError),
      );
      expect(extractApiErrorMessage(dioErr), 'Invalid enum value');
    });

    test('parses raw RFC 7807 body when no wrapper present', () {
      final response = Response<Map<String, dynamic>>(
        requestOptions: dummyOptions,
        statusCode: 400,
        data: {
          'success': false,
          'error': {
            'type': 'about:blank',
            'title': 'ValidationError',
            'status': 400,
            'detail': 'Product posts require a condition field',
          },
        },
      );
      final dioErr = DioException(
        requestOptions: dummyOptions,
        response: response,
      );
      expect(
        extractApiErrorMessage(dioErr),
        'Product posts require a condition field',
      );
    });

    test('returns NetworkException message', () {
      final dioErr = DioException(
        requestOptions: dummyOptions,
        error: const NetworkException('Unable to connect.'),
      );
      expect(extractApiErrorMessage(dioErr), 'Unable to connect.');
    });

    test('falls back when nothing parseable', () {
      final dioErr = DioException(requestOptions: dummyOptions);
      expect(
        extractApiErrorMessage(dioErr, fallback: 'fallback'),
        'fallback',
      );
    });

    test('handles bare ApiException (not wrapped in DioException)', () {
      final apiError = ApiError(
        type: 'about:blank',
        title: 'NotFound',
        status: 404,
        detail: 'Category not found',
      );
      expect(
        extractApiErrorMessage(ApiException(apiError)),
        'Category not found',
      );
    });
  });
}
