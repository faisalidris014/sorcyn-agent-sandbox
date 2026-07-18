import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/app_colors.dart';

class AppInputField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final IconData? prefixIcon;
  final Widget? suffixWidget;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final bool obscureText;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onChanged;
  final bool autofocus;
  final bool showClearButton;
  final VoidCallback? onClear;
  final List<TextInputFormatter>? inputFormatters;

  const AppInputField({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    this.prefixIcon,
    this.suffixWidget,
    this.keyboardType,
    this.textInputAction,
    this.obscureText = false,
    this.validator,
    this.onChanged,
    this.autofocus = false,
    this.showClearButton = false,
    this.onClear,
    this.inputFormatters,
  });

  @override
  State<AppInputField> createState() => _AppInputFieldState();
}

class _AppInputFieldState extends State<AppInputField> {
  bool _focused = false;
  String? _errorText;

  void _validate(String? value) {
    if (widget.validator != null) {
      setState(() {
        _errorText = widget.validator!(value);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasError = _errorText != null && _errorText!.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Label
        Text(
          widget.label,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.black,
          ),
        ),
        const SizedBox(height: 8),

        // Input container
        Focus(
          onFocusChange: (focused) => setState(() => _focused = focused),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            height: 52,
            decoration: BoxDecoration(
              color: _focused
                  ? AppColors.inputFocusedBg
                  : AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: hasError
                    ? AppColors.error
                    : _focused
                        ? AppColors.primary
                        : AppColors.border,
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                if (widget.prefixIcon != null) ...[
                  const SizedBox(width: 16),
                  AnimatedDefaultTextStyle(
                    duration: const Duration(milliseconds: 180),
                    style: TextStyle(
                      color: _focused ? AppColors.primary : AppColors.greyMedium,
                    ),
                    child: Icon(
                      widget.prefixIcon,
                      size: 18,
                      color:
                          _focused ? AppColors.primary : AppColors.greyMedium,
                    ),
                  ),
                  const SizedBox(width: 12),
                ] else
                  const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: widget.controller,
                    keyboardType: widget.keyboardType,
                    textInputAction: widget.textInputAction,
                    obscureText: widget.obscureText,
                    autofocus: widget.autofocus,
                    inputFormatters: widget.inputFormatters,
                    onChanged: (v) {
                      widget.onChanged?.call(v);
                      if (_errorText != null) _validate(v);
                    },
                    validator: (v) {
                      final error = widget.validator?.call(v);
                      WidgetsBinding.instance.addPostFrameCallback((_) {
                        if (mounted) setState(() => _errorText = error);
                      });
                      return error;
                    },
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      color: AppColors.black,
                    ),
                    decoration: InputDecoration(
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      errorBorder: InputBorder.none,
                      focusedErrorBorder: InputBorder.none,
                      hintText: widget.hint,
                      hintStyle: GoogleFonts.inter(
                        fontSize: 15,
                        color: AppColors.greyMedium,
                      ),
                      contentPadding: EdgeInsets.zero,
                      isDense: true,
                      errorStyle: const TextStyle(height: 0, fontSize: 0),
                      filled: false,
                    ),
                  ),
                ),
                if (widget.showClearButton &&
                    widget.controller.text.isNotEmpty) ...[
                  GestureDetector(
                    onTap: () {
                      widget.controller.clear();
                      widget.onClear?.call();
                      widget.onChanged?.call('');
                    },
                    child: Container(
                      width: 18,
                      height: 18,
                      decoration: const BoxDecoration(
                        color: AppColors.greyMedium,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.close, size: 10, color: Colors.white),
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                if (widget.suffixWidget != null) ...[
                  widget.suffixWidget!,
                  const SizedBox(width: 12),
                ] else
                  const SizedBox(width: 16),
              ],
            ),
          ),
        ),

        // Error text
        if (hasError) ...[
          const SizedBox(height: 6),
          Text(
            _errorText!,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppColors.error,
            ),
          ),
        ],
      ],
    );
  }
}
