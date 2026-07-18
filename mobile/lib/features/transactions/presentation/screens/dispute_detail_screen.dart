import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../../shared/widgets/styled_app_bar.dart';

class DisputeDetailScreen extends StatelessWidget {
  final String disputeId;

  const DisputeDetailScreen({super.key, required this.disputeId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Dispute',
        onBack: () => Navigator.of(context).pop(),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 12),
            child: StatusBadge(status: 'in_progress'),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  const SizedBox(height: 8),

                  // Transaction summary
                  SectionCard(
                    child: Column(
                      children: [
                        const SectionHeader(
                            icon: Icons.receipt_long_outlined,
                            title: 'Transaction'),
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              _InfoRow('Post', 'Logo + brand identity'),
                              _InfoRow('Amount', '\$950.00'),
                              _InfoRow('Parties', 'You vs. Priya Sharma'),
                              _InfoRow('Filed', 'Apr 15, 2026'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Timeline
                  SectionCard(
                    child: Column(
                      children: [
                        const SectionHeader(
                            icon: Icons.timeline, title: 'Progress'),
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              _TimelineStep(
                                label: 'Dispute Filed',
                                sublabel: 'Apr 15, 2026',
                                status: _StepStatus.done,
                                isFirst: true,
                              ),
                              _TimelineStep(
                                label: 'Evidence Submitted',
                                sublabel: 'Photos & description provided',
                                status: _StepStatus.done,
                              ),
                              _TimelineStep(
                                label: 'Under Review',
                                sublabel: 'Support team assigned',
                                status: _StepStatus.active,
                              ),
                              _TimelineStep(
                                label: 'Resolution',
                                sublabel: 'Pending review outcome',
                                status: _StepStatus.pending,
                                isLast: true,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Evidence
                  SectionCard(
                    child: Column(
                      children: [
                        const SectionHeader(
                            icon: Icons.photo_library_outlined,
                            title: 'Your Evidence'),
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Photo thumbnails
                              Row(
                                children: [
                                  _PhotoThumb(),
                                  const SizedBox(width: 10),
                                  _PhotoThumb(),
                                  const SizedBox(width: 10),
                                  _AddPhotoButton(),
                                ],
                              ),
                              const SizedBox(height: 12),
                              const Text(
                                'The delivered work does not match the agreed scope. The logo concepts were not what was discussed, and the brand guide is incomplete.',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: AppColors.grey,
                                  height: 1.55,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Support agent
                  SectionCard(
                    child: Column(
                      children: [
                        const SectionHeader(
                            icon: Icons.support_agent,
                            title: 'Assigned Agent'),
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  gradient: AppColors.primaryGradient,
                                ),
                                child: const Center(
                                  child: Text(
                                    'ST',
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Sarah T.',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.black,
                                      ),
                                    ),
                                    const Text(
                                      'Support Team',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppColors.greyMedium,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const Text(
                                'Responds within 2hrs',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.greyMedium,
                                ),
                              ),
                            ],
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

          // Action buttons — primary Resolve CTA on top, secondary actions below
          Container(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 32),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(
                top: BorderSide(
                    color: Colors.black.withValues(alpha: 0.06)),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                GradientButton(
                  text: 'Resolve Dispute',
                  icon: Icons.gavel,
                  onPressed: () {},
                  height: 52,
                  borderRadius: 16,
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () {},
                        child: Container(
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.07),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: AppColors.primary.withValues(alpha: 0.2),
                              width: 1.5,
                            ),
                          ),
                          child: const Center(
                            child: Text(
                              'Add Evidence',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: GradientButton(
                        text: 'Contact Support',
                        onPressed: () {},
                        height: 48,
                        borderRadius: 16,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 12, color: AppColors.greyMedium)),
          Text(value,
              style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.black)),
        ],
      ),
    );
  }
}

enum _StepStatus { done, active, pending }

class _TimelineStep extends StatelessWidget {
  final String label;
  final String sublabel;
  final _StepStatus status;
  final bool isFirst;
  final bool isLast;

  const _TimelineStep({
    required this.label,
    required this.sublabel,
    required this.status,
    this.isFirst = false,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline column
          SizedBox(
            width: 28,
            child: Column(
              children: [
                // Dot
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: status == _StepStatus.pending
                        ? null
                        : status == _StepStatus.done
                            ? AppColors.primaryGradient
                            : null,
                    color: status == _StepStatus.pending
                        ? Colors.white
                        : status == _StepStatus.active
                            ? AppColors.primary
                            : null,
                    border: status == _StepStatus.pending
                        ? Border.all(color: AppColors.border, width: 2)
                        : null,
                    boxShadow: status == _StepStatus.active
                        ? [
                            BoxShadow(
                              color:
                                  AppColors.primary.withValues(alpha: 0.3),
                              blurRadius: 8,
                              spreadRadius: 2,
                            ),
                          ]
                        : null,
                  ),
                  child: status != _StepStatus.pending
                      ? Icon(
                          status == _StepStatus.done
                              ? Icons.check
                              : Icons.more_horiz,
                          size: 14,
                          color: Colors.white,
                        )
                      : null,
                ),
                // Line
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      color: status == _StepStatus.done
                          ? AppColors.primary.withValues(alpha: 0.3)
                          : AppColors.border,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Content
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: status == _StepStatus.active
                          ? FontWeight.w800
                          : status == _StepStatus.done
                              ? FontWeight.w700
                              : FontWeight.w500,
                      color: status == _StepStatus.pending
                          ? AppColors.greyMedium
                          : AppColors.black,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    sublabel,
                    style: TextStyle(
                      fontSize: 12,
                      color: status == _StepStatus.active
                          ? AppColors.primary
                          : AppColors.greyMedium,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PhotoThumb extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 72,
      height: 72,
      decoration: BoxDecoration(
        color: AppColors.greyLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: const Icon(Icons.image, size: 24, color: AppColors.greyMedium),
    );
  }
}

class _AddPhotoButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {},
      child: Container(
        width: 72,
        height: 72,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppColors.primary.withValues(alpha: 0.3),
            width: 1.5,
            strokeAlign: BorderSide.strokeAlignInside,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add, size: 20,
                color: AppColors.primary.withValues(alpha: 0.5)),
            const SizedBox(height: 2),
            Text(
              'Add',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: AppColors.primary.withValues(alpha: 0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
