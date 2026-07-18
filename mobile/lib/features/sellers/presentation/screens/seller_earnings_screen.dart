import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../../shared/widgets/styled_app_bar.dart';

class SellerEarningsScreen extends StatefulWidget {
  const SellerEarningsScreen({super.key});

  @override
  State<SellerEarningsScreen> createState() => _SellerEarningsScreenState();
}

class _SellerEarningsScreenState extends State<SellerEarningsScreen> {
  String _period = 'month';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Earnings',
        onBack: () => Navigator.of(context).pop(),
        actions: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border, width: 1.5),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: const [
                Text(
                  'This Month',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.black,
                  ),
                ),
                SizedBox(width: 2),
                Icon(Icons.expand_more, size: 16, color: AppColors.greyMedium),
              ],
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 12),

            // Gradient balance hero — locked Sorcyn primary gradient
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.35),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'Available Balance',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Colors.white.withValues(alpha: 0.9),
                        ),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.account_balance_wallet,
                                size: 12, color: Colors.white),
                            SizedBox(width: 4),
                            Text(
                              'Ready to payout',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    '\$2,150.00',
                    style: TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: -1.2,
                    ),
                  ),
                  const SizedBox(height: 16),
                  GradientButton(
                    text: 'Request Payout',
                    icon: Icons.send,
                    onPressed: () {},
                    height: 52,
                    borderRadius: 16,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Summary cards
            Row(
              children: [
                Expanded(
                  child: _SummaryCard(
                    icon: Icons.trending_up,
                    iconColor: AppColors.success,
                    label: 'Total Earned',
                    amount: '\$12,450',
                    trend: '+12%',
                    trendPositive: true,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _SummaryCard(
                    icon: Icons.hourglass_top,
                    iconColor: AppColors.warning,
                    label: 'Pending',
                    amount: '\$1,200',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            _SummaryCard(
              icon: Icons.calendar_today,
              iconColor: AppColors.primary,
              label: 'This Month',
              amount: '\$3,450',
              trend: '+8%',
              trendPositive: true,
              fullWidth: true,
            ),

            const SizedBox(height: 20),

            // Period selector
            Row(
              children: [
                _PeriodChip('Week', _period == 'week',
                    () => setState(() => _period = 'week')),
                const SizedBox(width: 8),
                _PeriodChip('Month', _period == 'month',
                    () => setState(() => _period = 'month')),
                const SizedBox(width: 8),
                _PeriodChip('Year', _period == 'year',
                    () => setState(() => _period = 'year')),
              ],
            ),

            const SizedBox(height: 16),

            // Chart
            SectionCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Earnings Overview',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: AppColors.black,
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 140,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        _ChartBar(0.4, 'Nov', false),
                        _ChartBar(0.6, 'Dec', false),
                        _ChartBar(0.75, 'Jan', false),
                        _ChartBar(0.5, 'Feb', false),
                        _ChartBar(0.85, 'Mar', false),
                        _ChartBar(0.7, 'Apr', true),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Recent payouts
            SectionCard(
              child: Column(
                children: [
                  const SectionHeader(
                    icon: Icons.account_balance,
                    title: 'Recent Payouts',
                    accent: 'View All',
                  ),
                  _PayoutItem(
                    amount: '\$850.00',
                    date: 'Apr 12, 2026',
                    bank: 'Chase ····4242',
                    status: 'Completed',
                    isCompleted: true,
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Divider(height: 1, color: AppColors.subtleBorder),
                  ),
                  _PayoutItem(
                    amount: '\$1,200.00',
                    date: 'Apr 8, 2026',
                    bank: 'Chase ····4242',
                    status: 'Completed',
                    isCompleted: true,
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Divider(height: 1, color: AppColors.subtleBorder),
                  ),
                  _PayoutItem(
                    amount: '\$450.00',
                    date: 'Apr 15, 2026',
                    bank: 'Chase ····4242',
                    status: 'Processing',
                    isCompleted: false,
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Tax documents
            SectionCard(
              child: Column(
                children: [
                  const SectionHeader(
                      icon: Icons.description_outlined,
                      title: 'Tax Documents'),
                  Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () {},
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: AppColors.greyLight,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.picture_as_pdf,
                                  size: 18, color: AppColors.error),
                            ),
                            const SizedBox(width: 12),
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '1099-K (2025)',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.black,
                                    ),
                                  ),
                                  Text(
                                    'Available for download',
                                    style: TextStyle(
                                        fontSize: 12,
                                        color: AppColors.greyMedium),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(Icons.download,
                                size: 18, color: AppColors.primary),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String amount;
  final String? trend;
  final bool trendPositive;
  final bool fullWidth;

  const _SummaryCard({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.amount,
    this.trend,
    this.trendPositive = false,
    this.fullWidth = false,
  });

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Icon(icon, size: 14, color: iconColor),
              ),
              const Spacer(),
              if (trend != null)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: (trendPositive
                            ? AppColors.success
                            : AppColors.error)
                        .withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        trendPositive
                            ? Icons.arrow_upward
                            : Icons.arrow_downward,
                        size: 10,
                        color: trendPositive
                            ? AppColors.success
                            : AppColors.error,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        trend!,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: trendPositive
                              ? AppColors.success
                              : AppColors.error,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            amount,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: AppColors.black,
              letterSpacing: -0.66,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style:
                const TextStyle(fontSize: 12, color: AppColors.greyMedium),
          ),
        ],
      ),
    );
  }
}

class _PeriodChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _PeriodChip(this.label, this.selected, this.onTap);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          gradient: selected ? AppColors.primaryGradient : null,
          color: selected ? null : AppColors.greyLight,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: selected ? Colors.white : AppColors.grey,
          ),
        ),
      ),
    );
  }
}

class _ChartBar extends StatelessWidget {
  final double fillPercent;
  final String label;
  final bool isActive;

  const _ChartBar(this.fillPercent, this.label, this.isActive);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Expanded(
              child: Align(
                alignment: Alignment.bottomCenter,
                child: FractionallySizedBox(
                  heightFactor: fillPercent,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: isActive
                          ? AppColors.primaryGradient
                          : LinearGradient(
                              colors: [
                                AppColors.primary.withValues(alpha: 0.3),
                                AppColors.secondaryPurple
                                    .withValues(alpha: 0.3),
                              ],
                            ),
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                color: isActive ? AppColors.primary : AppColors.greyMedium,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PayoutItem extends StatelessWidget {
  final String amount;
  final String date;
  final String bank;
  final String status;
  final bool isCompleted;

  const _PayoutItem({
    required this.amount,
    required this.date,
    required this.bank,
    required this.status,
    required this.isCompleted,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: (isCompleted ? AppColors.success : AppColors.warning)
                  .withValues(alpha: 0.1),
            ),
            child: Icon(
              isCompleted ? Icons.check : Icons.hourglass_top,
              size: 13,
              color: isCompleted ? AppColors.success : AppColors.warning,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  amount,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.black,
                  ),
                ),
                Text(
                  '$date · $bank',
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.greyMedium),
                ),
              ],
            ),
          ),
          StatusBadge(
            status: isCompleted ? 'completed' : 'pending',
            fontSize: 10,
          ),
        ],
      ),
    );
  }
}
