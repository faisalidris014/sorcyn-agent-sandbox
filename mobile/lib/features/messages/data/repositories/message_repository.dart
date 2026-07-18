import 'package:dio/dio.dart';

import '../../../../core/network/api_response.dart';
import '../../../../core/network/dio_client.dart';
import '../models/conversation_model.dart';
import '../models/message_model.dart';

class MessageRepository {
  Dio get _dio => DioClient.instance;

  Future<({List<Conversation> conversations, PaginationMeta? meta})>
      getConversations({
    String? status,
    int page = 1,
    int limit = 20,
  }) async {
    final response =
        await _dio.get('/messages/conversations', queryParameters: {
      'status': ?status,
      'page': page,
      'limit': limit,
    });
    final data = response.data['data'] as List;
    final conversations = data
        .map((e) => Conversation.fromJson(e as Map<String, dynamic>))
        .toList();
    final meta = response.data['meta'] != null
        ? PaginationMeta.fromJson(
            response.data['meta'] as Map<String, dynamic>)
        : null;
    return (conversations: conversations, meta: meta);
  }

  Future<
      ({
        ConversationDetail conversation,
        List<Message> messages,
        PaginationMeta? meta,
      })> getConversationDetail(
    String conversationId, {
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _dio.get(
      '/messages/conversations/$conversationId',
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>;
    final conversation = ConversationDetail.fromJson(
        data['conversation'] as Map<String, dynamic>);
    final messagesData = data['messages'] as List;
    final messages = messagesData
        .map((e) => Message.fromJson(e as Map<String, dynamic>))
        .toList();
    final meta = data['meta'] != null
        ? PaginationMeta.fromJson(data['meta'] as Map<String, dynamic>)
        : null;
    return (conversation: conversation, messages: messages, meta: meta);
  }

  /// Resolves the current user's conversation for [postId] (created when the
  /// seller submitted an offer). Returns `null` when no thread exists yet (404),
  /// which the caller surfaces as "submit an offer first".
  Future<Conversation?> getConversationByPost(String postId) async {
    try {
      final response =
          await _dio.get('/messages/conversations/by-post/$postId');
      return Conversation.fromJson(
          response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<Message> sendMessage(
    String conversationId,
    String messageText, {
    List<String> attachments = const [],
  }) async {
    final response = await _dio.post(
      '/messages/conversations/$conversationId/messages',
      data: {'messageText': messageText, 'attachments': attachments},
    );
    return Message.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<void> markRead(String conversationId) async {
    await _dio.put('/messages/conversations/$conversationId/mark-read');
  }

  Future<void> markUnread(String conversationId) async {
    await _dio.put('/messages/conversations/$conversationId/mark-unread');
  }

  Future<void> deleteConversation(String conversationId) async {
    await _dio.delete('/messages/conversations/$conversationId');
  }

  Future<void> reportConversation(
      String conversationId, String reason) async {
    await _dio.post(
      '/messages/conversations/$conversationId/report',
      data: {'reason': reason},
    );
  }
}
