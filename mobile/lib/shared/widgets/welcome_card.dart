import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class WelcomeCard extends StatelessWidget {
  final String userName;
  final int activePosts;
  final int totalOffers;
  final int completed;
  final VoidCallback? onCreatePost;

  const WelcomeCard({
    super.key,
    required this.userName,
    this.activePosts = 0,
    this.totalOffers = 0,
    this.completed = 0,
    this.onCreatePost,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: AppColors.primaryGradient,
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.32),
            blurRadius: 28,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // Radial overlay
          Positioned(
            top: -60,
            right: -40,
            child: Container(
              width: 180,
              height: 180,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Colors.white.withValues(alpha: 0.18),
                    Colors.transparent,
                  ],
                  stops: const [0.0, 0.7],
                ),
              ),
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Greeting + avatar
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Good morning \u{1F44B}',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: Colors.white.withValues(alpha: 0.75),
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'Hi, $userName!',
                            style: const TextStyle(
                              fontSize: 23,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                              letterSpacing: -0.01,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.22),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.4),
                          width: 2,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          userName.isNotEmpty
                              ? userName[0].toUpperCase()
                              : '?',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Stats row
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: IntrinsicHeight(
                    child: Row(
                      children: [
                        _StatItem(value: activePosts, label: 'Active Posts'),
                        VerticalDivider(
                          width: 1,
                          thickness: 1,
                          color: Colors.white.withValues(alpha: 0.18),
                        ),
                        _StatItem(value: totalOffers, label: 'Offers'),
                        VerticalDivider(
                          width: 1,
                          thickness: 1,
                          color: Colors.white.withValues(alpha: 0.18),
                        ),
                        _StatItem(value: completed, label: 'Completed'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // CTA Button
                GestureDetector(
                  onTap: onCreatePost,
                  child: Container(
                    width: double.infinity,
                    height: 44,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.12),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.add, color: AppColors.primary, size: 16),
                        SizedBox(width: 8),
                        Text(
                          'Create Post',
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
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final int value;
  final String label;

  const _StatItem({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '$value',
              style: const TextStyle(
                fontSize: 21,
                fontWeight: FontWeight.w700,
                color: Colors.white,
                height: 1,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: Colors.white.withValues(alpha: 0.72),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
