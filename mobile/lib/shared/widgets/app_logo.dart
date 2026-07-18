import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/app_colors.dart';

class AppLogo extends StatelessWidget {
  final double size;
  final bool showText;

  const AppLogo({super.key, this.size = 72, this.showText = true});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.circular(size * 0.3),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.3),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Center(
            child: CustomPaint(
              size: Size(size * 0.44, size * 0.44),
              painter: _LightningBoltPainter(),
            ),
          ),
        ),
        if (showText) ...[
          SizedBox(height: size * 0.22),
          Text(
            'Sorcyn',
            style: GoogleFonts.inter(
              fontSize: size * 0.31,
              fontWeight: FontWeight.w700,
              color: AppColors.black,
              letterSpacing: -0.02 * (size * 0.31),
            ),
          ),
        ],
      ],
    );
  }
}

class _LightningBoltPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final path = Path();
    // Lightning bolt shape matching the SVG: M26 4L10 24H22L18 40L34 20H22L26 4Z
    // Normalized to size
    final w = size.width;
    final h = size.height;

    path.moveTo(w * 0.667, 0); // top right point
    path.lineTo(0, h * 0.556); // left middle
    path.lineTo(w * 0.5, h * 0.556); // center
    path.lineTo(w * 0.333, h); // bottom
    path.lineTo(w, h * 0.444); // right middle
    path.lineTo(w * 0.5, h * 0.444); // center
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
