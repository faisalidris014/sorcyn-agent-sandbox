import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

Future<bool> showConfirmationDialog(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'Confirm',
  String cancelLabel = 'Cancel',
  Color? confirmColor,
  bool isDestructive = false,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => _ConfirmationDialog(
      title: title,
      message: message,
      confirmLabel: confirmLabel,
      cancelLabel: cancelLabel,
      confirmColor:
          confirmColor ?? (isDestructive ? AppColors.error : AppColors.primary),
    ),
  );
  return result ?? false;
}

class _ConfirmationDialog extends StatefulWidget {
  final String title;
  final String message;
  final String confirmLabel;
  final String cancelLabel;
  final Color confirmColor;

  const _ConfirmationDialog({
    required this.title,
    required this.message,
    required this.confirmLabel,
    required this.cancelLabel,
    required this.confirmColor,
  });

  @override
  State<_ConfirmationDialog> createState() => _ConfirmationDialogState();
}

class _ConfirmationDialogState extends State<_ConfirmationDialog> {
  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.title),
      content: Text(widget.message),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: Text(widget.cancelLabel),
        ),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(true),
          style: FilledButton.styleFrom(
            backgroundColor: widget.confirmColor,
          ),
          child: Text(widget.confirmLabel),
        ),
      ],
    );
  }
}
