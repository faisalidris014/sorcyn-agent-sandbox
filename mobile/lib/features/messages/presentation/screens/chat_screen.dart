import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../widgets/chat_post_banner.dart';
import '../widgets/message_bubble.dart';
import '../widgets/message_input_bar.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String conversationId;

  const ChatScreen({super.key, required this.conversationId});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _scrollController = ScrollController();
  final _textController = TextEditingController();
  Timer? _typingDebounce;
  ChatNotifier? _chatNotifier;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _textController.addListener(() => setState(() {}));
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _chatNotifier = ref.read(chatProvider(widget.conversationId).notifier);
      _chatNotifier!.loadConversation();
      _chatNotifier!.startSocketListening();
      _chatNotifier!.startPolling();
    });
  }

  @override
  void dispose() {
    _chatNotifier?.stopPolling();
    _chatNotifier?.onUserStoppedTyping();
    _typingDebounce?.cancel();
    _scrollController.dispose();
    _textController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels <= 200) {
      ref.read(chatProvider(widget.conversationId).notifier).loadMoreMessages();
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _sendMessage() {
    final text = _textController.text.trim();
    if (text.isEmpty) return;
    // Backend rejects sends on a locked thread with 409; guard here too so a stale UI
    // can't fire a doomed request.
    if (ref.read(chatProvider(widget.conversationId)).conversation?.isLocked ??
        false) {
      return;
    }
    ref.read(chatProvider(widget.conversationId).notifier).sendMessage(text);
    _textController.clear();
    _typingDebounce?.cancel();
    Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
  }

  void _onTextChanged(String text) {
    final notifier = ref.read(chatProvider(widget.conversationId).notifier);
    _typingDebounce?.cancel();
    if (text.isNotEmpty) {
      notifier.onUserTyping();
      _typingDebounce = Timer(const Duration(seconds: 3), () {
        notifier.onUserStoppedTyping();
      });
    } else {
      notifier.onUserStoppedTyping();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(chatProvider(widget.conversationId));
    final currentUserId = ref.watch(authProvider).user?.id ?? '';
    // Once the transaction completes the thread is read-only (#305): keep history
    // visible but replace the composer with a notice.
    final isLocked = state.conversation?.isLocked ?? false;

    // Auto-scroll on new messages
    ref.listen(chatProvider(widget.conversationId), (prev, next) {
      if (prev != null && next.messages.length > prev.messages.length) {
        Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
      }
    });

    // Determine the other participant's name
    String otherName = 'Chat';
    String? otherInitial;
    if (state.conversation != null) {
      final isP1 = state.conversation!.participant1.id == currentUserId;
      final other = isP1
          ? state.conversation!.participant2
          : state.conversation!.participant1;
      otherName = other.fullName;
      otherInitial = other.firstName.isNotEmpty
          ? other.firstName[0].toUpperCase()
          : '?';
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(64),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(
              bottom: BorderSide(
                  color: AppColors.border.withValues(alpha: 0.5)),
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              child: Row(
                children: [
                  // Back button
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: AppColors.border, width: 1.5),
                        color: AppColors.surfaceVariant,
                      ),
                      child: const Icon(Icons.arrow_back_ios_new,
                          size: 14, color: AppColors.black),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // Avatar
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppColors.primaryGradient,
                    ),
                    child: Center(
                      child: Text(
                        otherInitial ?? '?',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // Name + status
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          otherName,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.black,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Row(
                          children: [
                            Container(
                              width: 7,
                              height: 7,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Color(0xFF10B981),
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Text(
                              'Online',
                              style: TextStyle(
                                fontSize: 11,
                                color: Color(0xFF10B981),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // More options
                  GestureDetector(
                    onTap: () {
                      // Show options menu
                    },
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: AppColors.border, width: 1.5),
                        color: AppColors.surfaceVariant,
                      ),
                      child: const Icon(Icons.more_vert,
                          size: 16, color: AppColors.grey),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.error != null && state.messages.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(state.error!,
                          style: const TextStyle(color: AppColors.grey)),
                      const SizedBox(height: 8),
                      GestureDetector(
                        onTap: () => ref
                            .read(chatProvider(widget.conversationId)
                                .notifier)
                            .loadConversation(),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color:
                                AppColors.primary.withValues(alpha: 0.06),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Text(
                            'Retry',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              : Column(
                  children: [
                    // Post context banner — hero-photo deal card (#402)
                    if (state.conversation?.postId != null)
                      ChatPostBanner(
                        conversation: state.conversation!,
                        currentUserId: currentUserId,
                      ),

                    // Loading more indicator
                    if (state.isLoadingMore)
                      const LinearProgressIndicator(
                        minHeight: 2,
                        color: AppColors.primary,
                        backgroundColor: AppColors.greyLight,
                      ),

                    // Messages
                    Expanded(
                      child: state.messages.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.chat_bubble_outline,
                                      size: 40,
                                      color: AppColors.greyMedium
                                          .withValues(alpha: 0.5)),
                                  const SizedBox(height: 12),
                                  const Text(
                                    'Start the conversation!',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: AppColors.greyMedium,
                                    ),
                                  ),
                                ],
                              ),
                            )
                          : ListView.builder(
                              controller: _scrollController,
                              padding: const EdgeInsets.fromLTRB(
                                  16, 12, 16, 8),
                              itemCount: state.messages.length,
                              itemBuilder: (context, index) {
                                final message = state.messages[index];
                                final isOwn =
                                    message.senderId == currentUserId;
                                final isOptimistic = state
                                    .optimisticMessageIds
                                    .contains(message.id);
                                return MessageBubble(
                                  message: message,
                                  isOwn: isOwn,
                                  isOptimistic: isOptimistic,
                                );
                              },
                            ),
                    ),

                    // Typing indicator
                    if (state.isOtherTyping)
                      TypingIndicator(
                        userName: state.typingUserName ?? otherName,
                      ),

                    // Input bar — replaced by a read-only notice once the thread is locked
                    if (isLocked)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
                        decoration: BoxDecoration(
                          color: AppColors.greyLight.withValues(alpha: 0.5),
                          border: Border(
                            top: BorderSide(
                                color: AppColors.border.withValues(alpha: 0.5)),
                          ),
                        ),
                        child: SafeArea(
                          top: false,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.lock_outline,
                                  size: 16, color: AppColors.greyMedium),
                              const SizedBox(width: 8),
                              const Flexible(
                                child: Text(
                                  'This conversation is closed because the transaction is complete.',
                                  style: TextStyle(
                                    fontSize: 12.5,
                                    color: AppColors.greyMedium,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    else
                      MessageInputBar(
                        controller: _textController,
                        onSend: _sendMessage,
                        onChanged: _onTextChanged,
                        isSending: state.isSending,
                      ),
                  ],
                ),
    );
  }
}
