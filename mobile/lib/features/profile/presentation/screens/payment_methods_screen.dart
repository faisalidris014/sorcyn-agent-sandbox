import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../../../shared/widgets/styled_app_bar.dart';

class PaymentMethodsScreen extends StatefulWidget {
  const PaymentMethodsScreen({super.key});

  @override
  State<PaymentMethodsScreen> createState() => _PaymentMethodsScreenState();
}

class _PaymentMethodsScreenState extends State<PaymentMethodsScreen> {
  String _selectedCard = 'card_1';
  bool _applePay = true;
  bool _googlePay = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Payment Methods',
        onBack: () => Navigator.of(context).pop(),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),

            const _SectionLabel('SAVED CARDS'),

            // Card 1
            _CardItem(
              brand: 'Visa',
              last4: '4242',
              expiry: '08/26',
              isDefault: true,
              isSelected: _selectedCard == 'card_1',
              onTap: () => setState(() => _selectedCard = 'card_1'),
            ),
            const SizedBox(height: 8),

            // Card 2
            _CardItem(
              brand: 'Mastercard',
              last4: '5555',
              expiry: '03/27',
              isDefault: false,
              isSelected: _selectedCard == 'card_2',
              onTap: () => setState(() => _selectedCard = 'card_2'),
            ),
            const SizedBox(height: 12),

            // Add new card — dashed border
            GestureDetector(
              onTap: () {},
              child: CustomPaint(
                painter: _DashedBorderPainter(
                  color: AppColors.primary.withValues(alpha: 0.35),
                  strokeWidth: 2,
                  borderRadius: 16,
                  dashWidth: 8,
                  dashGap: 5,
                ),
                child: Container(
                  width: double.infinity,
                  height: 52,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(6),
                          gradient: AppColors.primaryGradient,
                        ),
                        child: const Icon(Icons.add,
                            size: 14, color: Colors.white),
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'Add New Card',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 24),

            const _SectionLabel('DIGITAL WALLETS'),

            SectionCard(
              child: Column(
                children: [
                  _WalletRow(
                    name: 'Apple Pay',
                    icon: Icons.apple,
                    iconBg: Colors.black,
                    iconWidth: 44,
                    iconHeight: 28,
                    value: _applePay,
                    onChanged: (v) => setState(() => _applePay = v),
                  ),
                  const Padding(
                    padding: EdgeInsets.only(left: 62),
                    child: Divider(
                      height: 1,
                      thickness: 1,
                      color: Color(0xFFF6F6F6),
                    ),
                  ),
                  _WalletRow(
                    name: 'Google Pay',
                    icon: Icons.g_mobiledata,
                    iconBg: Colors.white,
                    iconColor: const Color(0xFF4285F4),
                    iconWidth: 44,
                    iconHeight: 28,
                    hasBorder: true,
                    value: _googlePay,
                    onChanged: (v) => setState(() => _googlePay = v),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Security notice
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock_outline,
                    size: 13, color: AppColors.greyMedium),
                const SizedBox(width: 6),
                Text(
                  '256-bit SSL \u00b7 PCI DSS compliant \u00b7 ',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.greyMedium,
                  ),
                ),
                const Text(
                  'Card',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF635BFF),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, left: 4),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: AppColors.greyMedium,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _CardItem extends StatelessWidget {
  final String brand;
  final String last4;
  final String expiry;
  final bool isDefault;
  final bool isSelected;
  final VoidCallback onTap;

  const _CardItem({
    required this.brand,
    required this.last4,
    required this.expiry,
    required this.isDefault,
    required this.isSelected,
    required this.onTap,
  });

  Color get _brandColor => brand == 'Visa'
      ? const Color(0xFF1A1F71)
      : const Color(0xFF252525);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.03)
              : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1.5,
          ),
        ),
        child: Row(
          children: [
            // Radio circle
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? AppColors.primary : Colors.white,
                border: Border.all(
                  color: isSelected
                      ? AppColors.primary
                      : const Color(0xFFD1D5DB),
                  width: 2,
                ),
              ),
              child: isSelected
                  ? Center(
                      child: Container(
                        width: 7,
                        height: 7,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white,
                        ),
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 12),

            // Brand icon box
            Container(
              width: 38,
              height: 24,
              decoration: BoxDecoration(
                color: _brandColor,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Center(
                child: brand == 'Mastercard'
                    ? Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFFEB001B).withValues(alpha: 0.9),
                            ),
                          ),
                          Transform.translate(
                            offset: const Offset(-3, 0),
                            child: Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: const Color(0xFFF79E1B).withValues(alpha: 0.9),
                              ),
                            ),
                          ),
                        ],
                      )
                    : const Text(
                        'VISA',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
              ),
            ),
            const SizedBox(width: 12),

            // Card details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        brand,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.black,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '\u00b7\u00b7\u00b7\u00b7 $last4',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.grey,
                        ),
                      ),
                      if (isDefault) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: AppColors.primary.withValues(alpha: 0.18),
                            ),
                          ),
                          child: const Text(
                            'Default',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Expires $expiry',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.greyMedium,
                    ),
                  ),
                ],
              ),
            ),

            // Active checkmark
            if (isSelected)
              Container(
                width: 22,
                height: 22,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppColors.primaryGradient,
                ),
                child: const Icon(Icons.check, size: 12, color: Colors.white),
              ),
          ],
        ),
      ),
    );
  }
}

class _WalletRow extends StatelessWidget {
  final String name;
  final IconData icon;
  final Color iconBg;
  final Color? iconColor;
  final double iconWidth;
  final double iconHeight;
  final bool hasBorder;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _WalletRow({
    required this.name,
    required this.icon,
    required this.iconBg,
    this.iconColor,
    this.iconWidth = 44,
    this.iconHeight = 28,
    this.hasBorder = false,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            width: iconWidth,
            height: iconHeight,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(6),
              border: hasBorder
                  ? Border.all(color: AppColors.border, width: 1.5)
                  : null,
            ),
            child: Icon(icon, size: 18, color: iconColor ?? Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              name,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.black,
              ),
            ),
          ),
          CupertinoSwitch(
            value: value,
            activeTrackColor: AppColors.primary,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}

/// Custom painter for a dashed rounded rectangle border.
class _DashedBorderPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double borderRadius;
  final double dashWidth;
  final double dashGap;

  _DashedBorderPainter({
    required this.color,
    required this.strokeWidth,
    required this.borderRadius,
    required this.dashWidth,
    required this.dashGap,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    final rrect = RRect.fromRectAndRadius(
      Rect.fromLTWH(
        strokeWidth / 2,
        strokeWidth / 2,
        size.width - strokeWidth,
        size.height - strokeWidth,
      ),
      Radius.circular(borderRadius),
    );

    final path = Path()..addRRect(rrect);
    final metrics = path.computeMetrics();

    for (final metric in metrics) {
      double distance = 0;
      while (distance < metric.length) {
        final end = distance + dashWidth;
        canvas.drawPath(
          metric.extractPath(distance, end.clamp(0, metric.length)),
          paint,
        );
        distance = end + dashGap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedBorderPainter oldDelegate) =>
      oldDelegate.color != color ||
      oldDelegate.strokeWidth != strokeWidth ||
      oldDelegate.borderRadius != borderRadius;
}
