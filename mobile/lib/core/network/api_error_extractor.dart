import 'package:dio/dio.dart';

import 'api_response.dart';
import 'dio_client.dart';

/// Pulls a human-readable message from any thrown error from a Dio call.
///
/// The dio interceptor in [DioClient] already wraps backend RFC 7807 errors
/// as [ApiException], so prefer that. Falls back to parsing the response body
/// directly, then network/auth exceptions, then [fallback].
String extractApiErrorMessage(Object error,
    {String fallback = 'Something went wrong. Please try again.'}) {
  if (error is DioException) {
    final inner = error.error;
    if (inner is ApiException) return inner.error.userMessage;
    if (inner is NetworkException) return inner.message;
    if (inner is AuthExpiredException) return inner.toString();

    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final raw = data['error'];
      if (raw is Map<String, dynamic>) {
        return ApiError.fromJson(raw).userMessage;
      }
    }
    if (error.message != null && error.message!.isNotEmpty) {
      return error.message!;
    }
  }
  if (error is ApiException) return error.error.userMessage;
  if (error is NetworkException) return error.message;
  return fallback;
}
