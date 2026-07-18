import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

import '../theme/app_colors.dart';

String formatCurrency(double amount, {String currency = 'USD'}) {
  final formatter = NumberFormat.currency(symbol: '\$', decimalDigits: 2);
  return formatter.format(amount);
}

String formatBudget({
  double? budgetMin,
  double? budgetMax,
  String? budgetType,
}) {
  if (budgetType == 'free') return 'Free';
  if (budgetMin != null && budgetMax != null) {
    if (budgetMin == budgetMax) return formatCurrency(budgetMin);
    return '${formatCurrency(budgetMin)} - ${formatCurrency(budgetMax)}';
  }
  if (budgetMin != null) return 'From ${formatCurrency(budgetMin)}';
  if (budgetMax != null) return 'Up to ${formatCurrency(budgetMax)}';
  return 'Open budget';
}

String formatRelativeDate(DateTime date) {
  final now = DateTime.now();
  final diff = now.difference(date);

  if (diff.inMinutes < 1) return 'Just now';
  // Use 'min' so "1m ago" is never read as "1 month ago".
  if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  if (diff.inDays < 30) return '${(diff.inDays / 7).floor()}w ago';
  return DateFormat('MMM d, yyyy').format(date);
}

String formatExpiry(String? expiresAt) {
  if (expiresAt == null) return '';
  final date = DateTime.tryParse(expiresAt);
  if (date == null) return '';
  final now = DateTime.now();
  final diff = date.difference(now);
  if (diff.isNegative) return 'Expired';
  if (diff.inHours < 24) return 'Expires in ${diff.inHours}h';
  if (diff.inDays < 7) return 'Expires in ${diff.inDays}d';
  return 'Expires ${DateFormat('MMM d').format(date)}';
}

/// Mirrors backend `posts.schemas.ts` urgency enum.
String formatUrgency(String? urgency) {
  return switch (urgency) {
    'asap' => 'ASAP',
    'within_24_hours' => 'Within 24 hours',
    'within_3_days' => 'Within 3 days',
    'within_1_week' => 'Within 1 week',
    'flexible' => 'Flexible',
    'specific_date' => 'Specific date',
    _ => urgency ?? 'Flexible',
  };
}

Color statusColor(String status) {
  return switch (status) {
    'active' || 'completed' || 'approved' => AppColors.success,
    'pending' || 'in_progress' || 'awaiting_approval' => AppColors.warning,
    'cancelled' || 'expired' || 'rejected' || 'disputed' => AppColors.error,
    'draft' => AppColors.greyMedium,
    _ => AppColors.grey,
  };
}

String formatStatus(String status) {
  return status.replaceAll('_', ' ').split(' ').map((word) {
    if (word.isEmpty) return word;
    return word[0].toUpperCase() + word.substring(1);
  }).join(' ');
}

/// Formats a raw digit string as `$X,XXX` while the user types.
/// Strip formatting before passing to the API with [parseCurrencyInput].
class CurrencyInputFormatter extends TextInputFormatter {
  static final _fmt = NumberFormat('#,###', 'en_US');

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final digits = newValue.text.replaceAll(RegExp(r'[^\d]'), '');
    if (digits.isEmpty) return newValue.copyWith(text: '');

    final number = int.parse(digits);
    final formatted = '\$${_fmt.format(number)}';
    return newValue.copyWith(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

/// Returns the numeric value from a currency-formatted string (e.g. `$20,000`).
double? parseCurrencyInput(String text) {
  final digits = text.replaceAll(RegExp(r'[^\d.]'), '');
  return digits.isEmpty ? null : double.tryParse(digits);
}

/// Converts a numeric value to the display format used by [CurrencyInputFormatter].
String formatCurrencyInput(double value) {
  final fmt = NumberFormat('#,###', 'en_US');
  return '\$${fmt.format(value.toInt())}';
}
