import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../data/models/message_model.dart';

class MessageBubble extends StatelessWidget {
  final Message message;
  final bool isOwn;
  final bool isOptimistic;
  final bool showTimestamp;

  const MessageBubble({
    super.key,
    required this.message,
    required this.isOwn,
    this.isOptimistic = false,
    this.showTimestamp = true,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Column(
        crossAxisAlignment:
            isOwn ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment:
                isOwn ? MainAxisAlignment.end : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (!isOwn) ...[
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppColors.primaryGradient,
                  ),
                  child: Center(
                    child: Text(
                      message.sender.firstName.isNotEmpty
                          ? message.sender.firstName[0].toUpperCase()
                          : '?',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              Flexible(
                child: Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.72,
                  ),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    gradient: isOwn
                        ? const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              Color(0xFF7C3AED),
                              Color(0xFFA855F7),
                            ],
                          )
                        : null,
                    color: isOwn ? null : const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: Radius.circular(isOwn ? 18 : 4),
                      bottomRight: Radius.circular(isOwn ? 4 : 18),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        message.messageText,
                        style: TextStyle(
                          fontSize: 15,
                          color: isOwn ? Colors.white : AppColors.black,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            formatRelativeDate(message.createdAt),
                            style: TextStyle(
                              fontSize: 10,
                              color: isOwn
                                  ? Colors.white.withValues(alpha: 0.7)
                                  : AppColors.greyMedium,
                            ),
                          ),
                          if (isOptimistic) ...[
                            const SizedBox(width: 4),
                            SizedBox(
                              width: 10,
                              height: 10,
                              child: CircularProgressIndicator(
                                strokeWidth: 1.5,
                                color: isOwn
                                    ? Colors.white.withValues(alpha: 0.7)
                                    : AppColors.greyMedium,
                              ),
                            ),
                          ] else if (isOwn) ...[
                            const SizedBox(width: 4),
                            Icon(
                              Icons.done_all,
                              size: 12,
                              color: Colors.white.withValues(alpha: 0.7),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Date separator pill between message groups
class DateSeparator extends StatelessWidget {
  final String label;

  const DateSeparator({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 12),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.greyLight,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: AppColors.grey,
          ),
        ),
      ),
    );
  }
}

/// Typing indicator with bouncing dots
class TypingIndicator extends StatefulWidget {
  final String userName;

  const TypingIndicator({super.key, required this.userName});

  @override
  State<TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<TypingIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 36, bottom: 6),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(18).copyWith(
                bottomLeft: const Radius.circular(4),
              ),
            ),
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, _) {
                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: List.generate(3, (i) {
                    final delay = i * 0.2;
                    final t = (_controller.value - delay).clamp(0.0, 1.0);
                    final bounce =
                        (t < 0.5 ? t * 2 : 2 - t * 2) * 4;
                    return Container(
                      margin: EdgeInsets.only(right: i < 2 ? 4 : 0),
                      child: Transform.translate(
                        offset: Offset(0, -bounce),
                        child: Container(
                          width: 7,
                          height: 7,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.greyMedium
                                .withValues(alpha: 0.6 + t * 0.4),
                          ),
                        ),
                      ),
                    );
                  }),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
