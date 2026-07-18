import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../data/models/seller_profile_model.dart';
import '../../providers/seller_provider.dart';

class StripeOnboardScreen extends ConsumerStatefulWidget {
  const StripeOnboardScreen({super.key});

  @override
  ConsumerState<StripeOnboardScreen> createState() =>
      _StripeOnboardScreenState();
}

class _StripeOnboardScreenState extends ConsumerState<StripeOnboardScreen>
    with WidgetsBindingObserver {
  bool _isLoading = false;
  String? _error;

  Future<void> _startOnboarding() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final result = await ref
          .read(sellerProfileProvider.notifier)
          .startStripeOnboarding();

      if (result != null && mounted) {
        final uri = Uri.parse(result.url);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } else {
          setState(() => _error = 'Could not open onboarding URL');
        }
      } else if (mounted) {
        setState(() =>
            _error = ref.read(sellerProfileProvider).error ??
                'Failed to start onboarding');
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _checkStatus() async {
    setState(() => _isLoading = true);
    await ref.read(sellerProfileProvider.notifier).loadStripeStatus();
    await ref.read(sellerProfileProvider.notifier).loadProfile();
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    Future.microtask(() {
      ref.read(sellerProfileProvider.notifier).loadStripeStatus();
      ref.read(sellerProfileProvider.notifier).loadProfile();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(sellerProfileProvider.notifier).loadStripeStatus();
      ref.read(sellerProfileProvider.notifier).loadProfile();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(sellerProfileProvider);
    final stripeStatus = state.stripeStatus;
    final profile = state.profile;
    final isConnected = profile?.canAcceptPaidOffers ?? false;
    final isInProgress =
        stripeStatus?.onboarded == true && stripeStatus?.chargesEnabled == false;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Sorcyn Pay Setup',
        onBack: () => Navigator.of(context).pop(),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          children: [
            const SizedBox(height: 32),

            // Hero status icon
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: isConnected
                    ? const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF059669), Color(0xFF10B981)],
                      )
                    : AppColors.primaryGradient,
                boxShadow: [
                  BoxShadow(
                    color: (isConnected
                            ? const Color(0xFF10B981)
                            : AppColors.primary)
                        .withValues(alpha: 0.35),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Icon(
                isConnected ? Icons.check : Icons.credit_card,
                size: 36,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),

            // Title
            Text(
              isConnected
                  ? 'Payments Connected'
                  : isInProgress
                      ? 'Complete Setup'
                      : 'Set Up Payments',
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 8),

            // Subtitle
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 300),
              child: Text(
                isConnected
                    ? 'Your payment account is connected. You can now receive payments for your services.'
                    : isInProgress
                        ? 'Complete the onboarding in your browser, then check the status below.'
                        : 'Connect your payment account to receive payments for services and products.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.grey,
                  height: 1.5,
                ),
              ),
            ),

            const SizedBox(height: 28),

            // Status card
            _buildStatusCard(
              isConnected: isConnected,
              isInProgress: isInProgress,
              stripeStatus: stripeStatus,
            ),

            const SizedBox(height: 16),

            // Benefits section
            _buildBenefitsCard(),

            const SizedBox(height: 28),

            // CTA Button
            _buildCtaButton(isConnected: isConnected, isInProgress: isInProgress),

            if (_error != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: AppColors.error.withValues(alpha: 0.2),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline,
                        size: 16, color: AppColors.error),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _error!,
                        style: const TextStyle(
                            fontSize: 13, color: AppColors.error),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 24),

            // Security notice
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock_outline,
                    size: 13, color: AppColors.greyMedium),
                const SizedBox(width: 6),
                Text(
                  'Secured by Sorcyn Pay · 256-bit encryption',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.greyMedium,
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

  Widget _buildStatusCard({
    required bool isConnected,
    required bool isInProgress,
    StripeStatus? stripeStatus,
  }) {
    return SectionCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (isConnected) ...[
            Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: const Icon(
                    Icons.check_circle,
                    size: 15,
                    color: Color(0xFF10B981),
                  ),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Your payment account is connected',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Payments will be deposited automatically',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.greyMedium,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                _StatusChip(
                  label: 'Charges',
                  enabled: stripeStatus?.chargesEnabled ?? false,
                ),
                const SizedBox(width: 10),
                _StatusChip(
                  label: 'Payouts',
                  enabled: stripeStatus?.payoutsEnabled ?? false,
                ),
              ],
            ),
          ] else if (isInProgress) ...[
            Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: const Icon(
                    Icons.hourglass_top,
                    size: 15,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    'Setup Progress',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                ),
                const Text(
                  '60%',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: SizedBox(
                height: 8,
                child: Stack(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.greyLight,
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                    FractionallySizedBox(
                      widthFactor: 0.6,
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Complete the remaining steps to activate your account.',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.greyMedium,
                height: 1.4,
              ),
            ),
          ] else ...[
            Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: const Icon(
                    Icons.star_rounded,
                    size: 15,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    'Connect your payment account to start receiving payments for completed work.',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.grey,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildBenefitsCard() {
    return SectionCard(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: const Icon(
                    Icons.shield_outlined,
                    size: 15,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 10),
                const Text(
                  'Benefits',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1F2937),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _BenefitItem('Receive direct deposits to your bank'),
                _BenefitItem('Secure payment processing'),
                _BenefitItem('Automatic tax document generation'),
                _BenefitItem('Real-time payout tracking'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCtaButton({
    required bool isConnected,
    required bool isInProgress,
  }) {
    final String label;
    final LinearGradient gradient;

    if (isConnected) {
      label = 'View Dashboard';
      gradient = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF059669), Color(0xFF10B981)],
      );
    } else if (isInProgress) {
      label = 'Continue Setup';
      gradient = AppColors.primaryGradient;
    } else {
      label = 'Set Up Payments';
      gradient = AppColors.primaryGradient;
    }

    return GestureDetector(
      onTap: _isLoading
          ? null
          : () {
              if (isConnected) {
                context.push('/seller/earnings');
              } else if (isInProgress) {
                _checkStatus();
              } else {
                _startOnboarding();
              }
            },
      child: Container(
        width: double.infinity,
        height: 56,
        decoration: BoxDecoration(
          gradient: _isLoading
              ? LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: gradient.colors
                      .map((c) => c.withValues(alpha: 0.5))
                      .toList(),
                )
              : gradient,
          borderRadius: BorderRadius.circular(24),
          boxShadow: _isLoading
              ? []
              : [
                  BoxShadow(
                    color: gradient.colors.first.withValues(alpha: 0.35),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
        ),
        child: Center(
          child: _isLoading
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    valueColor: AlwaysStoppedAnimation(Colors.white),
                  ),
                )
              : Text(
                  label,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final bool enabled;

  const _StatusChip({required this.label, required this.enabled});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: enabled
            ? const Color(0xFF10B981).withValues(alpha: 0.08)
            : AppColors.greyLight,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: enabled
              ? const Color(0xFF10B981).withValues(alpha: 0.25)
              : AppColors.border,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            enabled ? Icons.check_circle : Icons.cancel_outlined,
            size: 16,
            color: enabled ? const Color(0xFF10B981) : AppColors.greyMedium,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color:
                  enabled ? const Color(0xFF10B981) : AppColors.greyMedium,
            ),
          ),
        ],
      ),
    );
  }
}

class _BenefitItem extends StatelessWidget {
  final String text;

  const _BenefitItem(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0xFF10B981),
            ),
            child: const Icon(Icons.check, size: 14, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Color(0xFF1F2937),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
