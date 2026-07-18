import 'package:dio/dio.dart';

import '../../../../core/network/api_response.dart';
import '../../../../core/network/dio_client.dart';
import '../models/transaction_model.dart';

class TransactionRepository {
  Dio get _dio => DioClient.instance;

  Future<({List<Transaction> transactions, PaginationMeta? meta})>
      getMyTransactions({
    String role = 'buyer',
    String? status,
    int page = 1,
    int limit = 20,
    String sort = 'newest',
  }) async {
    final response =
        await _dio.get('/transactions/my-transactions', queryParameters: {
      'role': role,
      'status': ?status,
      'page': page,
      'limit': limit,
      'sort': sort,
    });
    final data = response.data['data'] as List;
    final transactions = data
        .map((e) => Transaction.fromJson(e as Map<String, dynamic>))
        .toList();
    final meta = response.data['meta'] != null
        ? PaginationMeta.fromJson(
            response.data['meta'] as Map<String, dynamic>)
        : null;
    return (transactions: transactions, meta: meta);
  }

  Future<Transaction> getTransactionById(String transactionId) async {
    final response = await _dio.get('/transactions/$transactionId');
    return Transaction.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }

  Future<void> approveTransaction(
    String transactionId, {
    List<String>? completionPhotos,
    String? note,
  }) async {
    await _dio.post('/transactions/$transactionId/approve', data: {
      'completionPhotos': completionPhotos ?? [],
      'note': ?note,
    });
  }

  Future<void> requestChanges(
      String transactionId, String reason) async {
    await _dio.post('/transactions/$transactionId/request-changes', data: {
      'reason': reason,
    });
  }

  Future<void> cancelTransaction(
      String transactionId, String reason) async {
    await _dio.put('/transactions/$transactionId/cancel', data: {
      'reason': reason,
    });
  }

  // ── Seller methods ──

  Future<Transaction> updateTransactionStatus(
    String transactionId, {
    required String status,
    String? scheduledDate,
    String? scheduledTime,
    String? specialInstructions,
    String? trackingNumber,
    String? carrier,
    String? estimatedDeliveryDate,
    String? meetupLocation,
    String? meetupDate,
    String? meetupTime,
    String? note,
  }) async {
    final response =
        await _dio.put('/transactions/$transactionId/status', data: {
      'status': status,
      'scheduledDate': ?scheduledDate,
      'scheduledTime': ?scheduledTime,
      'specialInstructions': ?specialInstructions,
      'trackingNumber': ?trackingNumber,
      'carrier': ?carrier,
      'estimatedDeliveryDate': ?estimatedDeliveryDate,
      'meetupLocation': ?meetupLocation,
      'meetupDate': ?meetupDate,
      'meetupTime': ?meetupTime,
      'note': ?note,
    });
    return Transaction.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }

  Future<Transaction> markComplete(
    String transactionId, {
    required List<String> afterPhotos,
    List<String>? beforePhotos,
    String? workSummary,
    String? completionNotes,
  }) async {
    final response =
        await _dio.post('/transactions/$transactionId/mark-complete', data: {
      'afterPhotos': afterPhotos,
      'beforePhotos': ?beforePhotos,
      'workSummary': ?workSummary,
      'completionNotes': ?completionNotes,
    });
    return Transaction.fromJson(
        response.data['data'] as Map<String, dynamic>);
  }
}
