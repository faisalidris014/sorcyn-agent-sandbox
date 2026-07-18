import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../auth/providers/auth_provider.dart';

class CreatePostMethodScreen extends ConsumerStatefulWidget {
  const CreatePostMethodScreen({super.key});

  @override
  ConsumerState<CreatePostMethodScreen> createState() =>
      _CreatePostMethodScreenState();
}

class _CreatePostMethodScreenState
    extends ConsumerState<CreatePostMethodScreen> {
  String? _selected; // 'ai' or 'manual'

  void _handleContinue() {
    if (_selected == 'ai') context.push('/posts/create/ai');
    if (_selected == 'manual') context.push('/posts/create/manual');
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    // v2.2 gate: business accounts cannot publish until backend has verified
    // their EIN + sales-tax cert (see backend posts.service createPost guard).
    // The user object doesn't carry einVerified/salesTaxVerified directly —
    // those live on SellerProfile — so we use a conservative client-side
    // signal: if the user is a business account, show the pending banner.
    // The backend remains the authoritative gate; this banner just sets
    // expectations and disables the CTA to prevent a wasted round-trip.
    final bool businessVerificationPending = user?.isBusiness == true;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            if (businessVerificationPending)
              Container(
                margin: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppColors.warning.withValues(alpha: 0.35),
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.pending_actions,
                      size: 22,
                      color: AppColors.warning,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            'Verification pending',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.black,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Business accounts can publish listings only after EIN and sales-tax certificate have been submitted for verification.',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.grey,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            // App Bar
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Icon(
                        Icons.chevron_left,
                        size: 20,
                        color: AppColors.black,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Create a Post',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.black,
                      letterSpacing: -0.01,
                    ),
                  ),
                ],
              ),
            ),

            // Body
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Progress indicator
                    _ProgressIndicator(currentStep: 1),
                    const SizedBox(height: 28),

                    // Heading
                    const Text(
                      'How would you like to\ncreate your post?',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: AppColors.black,
                        letterSpacing: -0.02,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Choose how you\'d like to describe what you need. You can edit everything before publishing.',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.grey,
                        height: 1.6,
                      ),
                    ),
                    const SizedBox(height: 28),

                    // AI Card
                    _MethodCard(
                      selected: _selected == 'ai',
                      onTap: () => setState(() => _selected = 'ai'),
                      icon: Icons.auto_awesome,
                      title: 'AI-Assisted',
                      subtitle: 'Describe what you need in plain language',
                      badge: 'Recommended',
                      bullets: const [
                        'Just type naturally — AI structures it for you',
                        'Smart category & budget suggestions',
                        'Takes less than 60 seconds',
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Manual Card
                    _MethodCard(
                      selected: _selected == 'manual',
                      onTap: () => setState(() => _selected = 'manual'),
                      icon: Icons.edit_note,
                      title: 'Manual Form',
                      subtitle: 'Fill out the details yourself',
                      isGrey: true,
                      bullets: const [
                        'Full control over every field',
                        'Set exact budget, category & urgency',
                        'Best for precise or complex requests',
                      ],
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),

            // Bottom CTA
            Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(
                  top: BorderSide(
                    color: Colors.black.withValues(alpha: 0.05),
                  ),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  GradientButton(
                    text: 'Continue',
                    icon: Icons.arrow_forward,
                    height: 54,
                    onPressed: (_selected != null && !businessVerificationPending)
                        ? _handleContinue
                        : null,
                  ),
                  if (_selected != null) ...[
                    const SizedBox(height: 10),
                    RichText(
                      textAlign: TextAlign.center,
                      text: TextSpan(
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.greyMedium,
                        ),
                        children: [
                          const TextSpan(text: 'You selected '),
                          TextSpan(
                            text: _selected == 'ai'
                                ? 'AI-Assisted'
                                : 'Manual Form',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Progress Indicator ──────────────────────────────────────────────

class _ProgressIndicator extends StatelessWidget {
  final int currentStep;

  const _ProgressIndicator({required this.currentStep});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _StepDot(step: 1, label: 'Method', isActive: currentStep >= 1),
        Expanded(child: _StepLine(isActive: currentStep >= 2)),
        _StepDot(step: 2, label: 'Details', isActive: currentStep >= 2),
        Expanded(child: _StepLine(isActive: currentStep >= 3)),
        _StepDot(step: 3, label: 'Review', isActive: currentStep >= 3),
      ],
    );
  }
}

class _StepDot extends StatelessWidget {
  final int step;
  final String label;
  final bool isActive;

  const _StepDot({
    required this.step,
    required this.label,
    required this.isActive,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: isActive ? AppColors.primaryGradient : null,
            color: isActive ? null : AppColors.greyLight,
            border: isActive
                ? null
                : Border.all(color: AppColors.border, width: 1.5),
          ),
          child: Center(
            child: Text(
              '$step',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: isActive ? Colors.white : AppColors.greyMedium,
              ),
            ),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
            color: isActive ? AppColors.primary : AppColors.greyMedium,
          ),
        ),
      ],
    );
  }
}

class _StepLine extends StatelessWidget {
  final bool isActive;

  const _StepLine({required this.isActive});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 2,
      margin: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: isActive ? AppColors.primary : AppColors.border,
        borderRadius: BorderRadius.circular(1),
      ),
    );
  }
}

// ─── Method Card ────────────────────────────────────��────────────────

class _MethodCard extends StatefulWidget {
  final bool selected;
  final VoidCallback onTap;
  final IconData icon;
  final String title;
  final String subtitle;
  final String? badge;
  final bool isGrey;
  final List<String> bullets;

  const _MethodCard({
    required this.selected,
    required this.onTap,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.badge,
    this.isGrey = false,
    required this.bullets,
  });

  @override
  State<_MethodCard> createState() => _MethodCardState();
}

class _MethodCardState extends State<_MethodCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        widget.onTap();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.985 : 1.0,
        duration: const Duration(milliseconds: 120),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: widget.selected
                ? AppColors.primary.withValues(alpha: 0.04)
                : AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color:
                  widget.selected ? AppColors.primary : AppColors.border,
              width: 2,
            ),
            boxShadow: widget.selected
                ? [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ]
                : [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
          ),
          child: Stack(
            children: [
              // Left accent bar
              AnimatedPositioned(
                duration: const Duration(milliseconds: 200),
                left: 0,
                top: 0,
                bottom: 0,
                child: AnimatedOpacity(
                  opacity: widget.selected ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 200),
                  child: Container(
                    width: 4,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(14),
                        bottomLeft: Radius.circular(14),
                      ),
                    ),
                  ),
                ),
              ),

              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top row: icon + title/subtitle + check
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Icon box
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            gradient: widget.selected
                                ? (widget.isGrey
                                    ? const LinearGradient(
                                        colors: [
                                          Color(0xFF6B7280),
                                          Color(0xFF9CA3AF)
                                        ],
                                      )
                                    : AppColors.primaryGradient)
                                : null,
                            color: widget.selected
                                ? null
                                : const Color(0xFFF0F0F3),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: widget.selected
                                ? [
                                    BoxShadow(
                                      color: AppColors.primary
                                          .withValues(alpha: 0.28),
                                      blurRadius: 14,
                                      offset: const Offset(0, 4),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Icon(
                            widget.icon,
                            size: 26,
                            color: widget.selected
                                ? Colors.white
                                : AppColors.greyMedium,
                          ),
                        ),
                        const SizedBox(width: 16),

                        // Title + subtitle
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 2),
                              Row(
                                children: [
                                  Text(
                                    widget.title,
                                    style: TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w700,
                                      color: widget.selected
                                          ? AppColors.primary
                                          : AppColors.black,
                                      letterSpacing: -0.01,
                                    ),
                                  ),
                                  if (widget.badge != null) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 7,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: widget.selected
                                            ? AppColors.primary
                                            : AppColors.primary
                                                .withValues(alpha: 0.1),
                                        borderRadius:
                                            BorderRadius.circular(20),
                                        border: widget.selected
                                            ? null
                                            : Border.all(
                                                color: AppColors.primary
                                                    .withValues(
                                                        alpha: 0.2),
                                              ),
                                      ),
                                      child: Text(
                                        widget.badge!,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          color: widget.selected
                                              ? Colors.white
                                              : AppColors.primary,
                                          letterSpacing: 0.04,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                widget.subtitle,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: widget.selected
                                      ? const Color(0xFF5B21B6)
                                      : AppColors.grey,
                                  height: 1.45,
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Check circle
                        const SizedBox(width: 8),
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: widget.selected
                                ? AppColors.primary
                                : Colors.white,
                            border: Border.all(
                              color: widget.selected
                                  ? AppColors.primary
                                  : const Color(0xFFD1D5DB),
                              width: 2,
                            ),
                          ),
                          child: widget.selected
                              ? const Icon(
                                  Icons.check,
                                  size: 12,
                                  color: Colors.white,
                                )
                              : null,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Divider
                    Container(
                      height: 1,
                      color: widget.selected
                          ? AppColors.primary.withValues(alpha: 0.12)
                          : const Color(0xFFEAECF0),
                    ),
                    const SizedBox(height: 12),

                    // Bullets
                    ...widget.bullets.map((b) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 16,
                                height: 16,
                                margin: const EdgeInsets.only(top: 1),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: widget.selected
                                      ? AppColors.primary
                                          .withValues(alpha: 0.1)
                                      : const Color(0xFFF0F0F3),
                                ),
                                child: Icon(
                                  Icons.check,
                                  size: 9,
                                  color: widget.selected
                                      ? AppColors.primary
                                      : AppColors.greyMedium,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  b,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: widget.selected
                                        ? AppColors.grey
                                        : AppColors.greyMedium,
                                    height: 1.5,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
