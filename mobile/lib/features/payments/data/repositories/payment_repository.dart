import 'package:dio/dio.dart';

import '../../../../core/network/dio_client.dart';
import '../models/payment_intent_model.dart';

/// Raised when the payment processor is in degrade mode (RUNBOOK_OPS.md §2 /
/// issue #84). [message] is the server-supplied, user-safe copy (it never names
/// the processor). [queued] is true when the offer was saved and the payment was
/// queued for retry (HTTP 202), false when the attempt was blocked outright
/// (HTTP 503, high-value transactions).
class PaymentProcessorUnavailableException implements Exception {
  final String message;
  final bool queued;

  const PaymentProcessorUnavailableException(this.message, {required this.queued});

  @override
  String toString() => 'PaymentProcessorUnavailableException($message, queued: $queued)';
}

class PaymentRepository {
  Dio get _dio => DioClient.instance;

  /// Create a payment intent for a transaction.
  ///
  /// Returns the client secret needed to confirm payment. During a payment-
  /// processor outage this may instead throw [PaymentProcessorUnavailableException]:
  /// queued=true (HTTP 202, sub-threshold — offer saved, payment deferred) or
  /// queued=false (HTTP 503, high-value — blocked, retry later).
  Future<PaymentIntentResult> createPaymentIntent(String transactionId) async {
    try {
      final response = await _dio.post('/payments/create-intent', data: {
        'transactionId': transactionId,
      });

      // Degrade mode, sub-threshold: offer saved, payment queued for retry (202).
      if (response.statusCode == 202) {
        final data = response.data['data'] as Map<String, dynamic>?;
        throw PaymentProcessorUnavailableException(
          (data?['message'] as String?) ?? _fallbackQueuedMessage,
          queued: true,
        );
      }

      return PaymentIntentResult.fromJson(
        response.data['data'] as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      // Degrade mode, high-value: acceptance blocked (503).
      if (e.response?.statusCode == 503) {
        final error = e.response?.data is Map<String, dynamic>
            ? (e.response!.data as Map<String, dynamic>)['error'] as Map<String, dynamic>?
            : null;
        throw PaymentProcessorUnavailableException(
          (error?['detail'] as String?) ?? _fallbackBlockedMessage,
          queued: false,
        );
      }
      rethrow;
    }
  }

  /// Request a refund for a transaction payment.
  Future<void> refundPayment(String transactionId, {String? reason}) async {
    try {
      await _dio.post('/payments/refund', data: {
        'transactionId': transactionId,
        'reason': ?reason,
      });
    } on DioException catch (e) {
      if (e.response?.statusCode == 503) {
        final error = e.response?.data is Map<String, dynamic>
            ? (e.response!.data as Map<String, dynamic>)['error'] as Map<String, dynamic>?
            : null;
        throw PaymentProcessorUnavailableException(
          (error?['detail'] as String?) ?? _fallbackBlockedMessage,
          queued: false,
        );
      }
      rethrow;
    }
  }

  // Network-failure fallbacks mirroring RUNBOOK_OPS.md §2 copy (server normally
  // supplies the message; these only show if the body is missing/unparseable).
  static const _fallbackQueuedMessage =
      'Our payment processor is currently unavailable. Your offer is saved — '
      "we'll process your payment once our payment processor is back online.";
  static const _fallbackBlockedMessage =
      "We're currently experiencing an outage with our payment processor. "
      'Please try again shortly or contact support.';
}
