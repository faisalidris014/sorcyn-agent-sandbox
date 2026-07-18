import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/gradient_button.dart';

class PostCreatedScreen extends StatefulWidget {
  final String postId;

  const PostCreatedScreen({super.key, required this.postId});

  @override
  State<PostCreatedScreen> createState() => _PostCreatedScreenState();
}

class _PostCreatedScreenState extends State<PostCreatedScreen>
    with TickerProviderStateMixin {
  late final AnimationController _ringController;
  late final AnimationController _pulseController;
  late final AnimationController _checkController;
  late final AnimationController _contentController;

  @override
  void initState() {
    super.initState();

    _ringController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..forward();

    _checkController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 550),
    );

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );

    _contentController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    // Sequence: ring → check → pulse + content
    Future.delayed(const Duration(milliseconds: 450), () {
      if (mounted) _checkController.forward();
    });
    Future.delayed(const Duration(milliseconds: 900), () {
      if (mounted) {
        _pulseController.repeat();
        _contentController.forward();
      }
    });
  }

  @override
  void dispose() {
    _ringController.dispose();
    _pulseController.dispose();
    _checkController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const Spacer(flex: 2),

              // Animated success badge
              SizedBox(
                width: 120,
                height: 120,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Outer glow ring
                    ScaleTransition(
                      scale: CurvedAnimation(
                        parent: _ringController,
                        curve: Curves.elasticOut,
                      ),
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color:
                              AppColors.primary.withValues(alpha: 0.12),
                        ),
                      ),
                    ),

                    // Pulsing ring
                    AnimatedBuilder(
                      animation: _pulseController,
                      builder: (context, child) {
                        return Transform.scale(
                          scale:
                              1.0 + (_pulseController.value * 0.22),
                          child: Opacity(
                            opacity: 1.0 - _pulseController.value,
                            child: Container(
                              width: 104,
                              height: 104,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AppColors.secondaryPurple
                                      .withValues(alpha: 0.5),
                                  width: 2,
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),

                    // Inner gradient circle
                    ScaleTransition(
                      scale: CurvedAnimation(
                        parent: _ringController,
                        curve: Curves.easeOutBack,
                      ),
                      child: Container(
                        width: 104,
                        height: 104,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              Color(0xFF7C3AED),
                              Color(0xFFA855F7),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // Checkmark
                    FadeTransition(
                      opacity: _checkController,
                      child: ScaleTransition(
                        scale: CurvedAnimation(
                          parent: _checkController,
                          curve: Curves.easeOutBack,
                        ),
                        child: const Icon(
                          Icons.check,
                          size: 48,
                          color: Colors.white,
                        ),
                      ),
                    ),

                    // Particles
                    ..._buildParticles(),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Text content
              FadeTransition(
                opacity: _contentController,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0, 0.2),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(
                    parent: _contentController,
                    curve: Curves.easeOut,
                  )),
                  child: Column(
                    children: [
                      const Text(
                        'Post Created!',
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: AppColors.black,
                          letterSpacing: -0.02,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Sellers in your area will start sending offers soon.',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppColors.grey,
                          height: 1.5,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),

                      // Summary card
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFAFAFF),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: const Color(0xFFEDE9FE),
                          ),
                        ),
                        child: Column(
                          children: [
                            // Top accent bar
                            Container(
                              height: 3,
                              margin:
                                  const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                gradient: AppColors.primaryGradient,
                                borderRadius:
                                    BorderRadius.circular(2),
                              ),
                            ),
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    'Your post is now live',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.black,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding:
                                      const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF10B981)
                                        .withValues(alpha: 0.1),
                                    borderRadius:
                                        BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
                                        width: 5,
                                        height: 5,
                                        decoration:
                                            const BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: Color(0xFF10B981),
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      const Text(
                                        'Live',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFF059669),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const Spacer(flex: 2),

              // Action buttons
              FadeTransition(
                opacity: _contentController,
                child: Column(
                  children: [
                    GradientButton(
                      text: 'View My Post',
                      height: 54,
                      onPressed: () =>
                          context.go('/posts/${widget.postId}'),
                    ),
                    const SizedBox(height: 12),
                    _OutlineButton(
                      text: 'Create Another Post',
                      onTap: () => context.go('/posts/create'),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () => context.go('/dashboard'),
                      child: const Text(
                        'Go to Dashboard',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.greyMedium,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildParticles() {
    final angles = [0, 45, 90, 135, 180, 225, 270, 315];
    return angles.asMap().entries.map((entry) {
      final i = entry.key;
      final angle = entry.value;
      final delay = 700 + (i * 50);
      return _Particle(
        angle: angle.toDouble(),
        delay: Duration(milliseconds: delay),
        size: i.isEven ? 7.0 : 5.0,
      );
    }).toList();
  }
}

class _Particle extends StatefulWidget {
  final double angle;
  final Duration delay;
  final double size;

  const _Particle({
    required this.angle,
    required this.delay,
    required this.size,
  });

  @override
  State<_Particle> createState() => _ParticleState();
}

class _ParticleState extends State<_Particle>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 850),
    );
    Future.delayed(widget.delay, () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final rad = widget.angle * math.pi / 180;
    const radius = 70.0;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final progress = _controller.value;
        final x = math.cos(rad) * radius * progress;
        final y = math.sin(rad) * radius * progress;
        final opacity = progress < 0.5
            ? progress * 2
            : (1.0 - progress) * 2;
        final scale = progress < 0.5
            ? progress * 2.4
            : (1.0 - progress) * 2.4;

        return Transform.translate(
          offset: Offset(x, y),
          child: Opacity(
            opacity: opacity.clamp(0.0, 1.0),
            child: Transform.scale(
              scale: scale.clamp(0.0, 1.2),
              child: Container(
                width: widget.size,
                height: widget.size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.secondaryPurple,
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _OutlineButton extends StatelessWidget {
  final String text;
  final VoidCallback onTap;

  const _OutlineButton({required this.text, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        height: 50,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: AppColors.primary.withValues(alpha: 0.3),
            width: 1.5,
          ),
        ),
        child: Center(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.primary,
            ),
          ),
        ),
      ),
    );
  }
}
