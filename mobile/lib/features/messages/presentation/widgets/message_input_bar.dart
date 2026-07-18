import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

class MessageInputBar extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onSend;
  final ValueChanged<String>? onChanged;
  final bool isSending;

  const MessageInputBar({
    super.key,
    required this.controller,
    required this.onSend,
    this.onChanged,
    this.isSending = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: AppColors.border.withValues(alpha: 0.6)),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            // Attachment button
            GestureDetector(
              onTap: () {
                // Show attachment options
              },
              child: Container(
                width: 38,
                height: 38,
                margin: const EdgeInsets.only(bottom: 3),
                decoration: BoxDecoration(
                  color: AppColors.greyLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.add,
                    size: 20, color: AppColors.grey),
              ),
            ),
            const SizedBox(width: 8),

            // Text input
            Expanded(
              child: Container(
                constraints: const BoxConstraints(maxHeight: 120),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.border, width: 1.5),
                ),
                child: TextField(
                  controller: controller,
                  maxLines: null,
                  textCapitalization: TextCapitalization.sentences,
                  onChanged: onChanged,
                  style: const TextStyle(
                      fontSize: 15, color: AppColors.black),
                  decoration: const InputDecoration(
                    hintText: 'Type a message...',
                    hintStyle: TextStyle(
                        fontSize: 15, color: AppColors.greyMedium),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                    isDense: true,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),

            // Send button
            GestureDetector(
              onTap: isSending ? null : onSend,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                width: 40,
                height: 40,
                margin: const EdgeInsets.only(bottom: 2),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: controller.text.trim().isNotEmpty
                      ? AppColors.primaryGradient
                      : null,
                  color: controller.text.trim().isEmpty
                      ? AppColors.greyLight
                      : null,
                  boxShadow: controller.text.trim().isNotEmpty
                      ? [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Center(
                  child: isSending
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Icon(
                          Icons.arrow_upward,
                          size: 20,
                          color: controller.text.trim().isNotEmpty
                              ? Colors.white
                              : AppColors.greyMedium,
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
