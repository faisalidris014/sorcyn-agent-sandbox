import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../../../shared/widgets/styled_app_bar.dart';
import '../../data/models/seller_profile_model.dart';
import '../../providers/seller_provider.dart';

/// Stripe Identity hosted-flow launcher.
///
/// Lifecycle parity with [StripeOnboardScreen]:
///   - `WidgetsBindingObserver` to refetch profile on `AppLifecycleState.resumed`
///     (so the `idVerified` badge flips after the user returns from the
///     externally-launched Stripe Identity hosted page).
///   - `loadProfile()` only — Identity status lives on `SellerProfile.idVerified`,
///     not on a separate Stripe status object.
class IdentityVerifyScreen extends ConsumerStatefulWidget {
  const IdentityVerifyScreen({super.key});

  @override
  ConsumerState<IdentityVerifyScreen> createState() =>
      _IdentityVerifyScreenState();
}

class _IdentityVerifyScreenState extends ConsumerState<IdentityVerifyScreen>
    with WidgetsBindingObserver {
  bool _isLoading = false;
  String? _error;

  Future<void> _startVerification() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final StripeIdentitySession? result = await ref
          .read(sellerProfileProvider.notifier)
          .startIdentityVerification();

      if (result != null && mounted) {
        final uri = Uri.parse(result.url);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } else {
          setState(() => _error = 'Could not open identity verification URL');
        }
      } else if (mounted) {
        setState(() => _error =
            ref.read(sellerProfileProvider).error ??
                'Failed to start identity verification');
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    Future.microtask(() {
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
      ref.read(sellerProfileProvider.notifier).loadProfile();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(sellerProfileProvider);
    final profile = state.profile;
    final isVerified = profile?.idVerified ?? false;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: StyledAppBar(
        title: 'Identity Verification',
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
                gradient: isVerified
                    ? const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF059669), Color(0xFF10B981)],
                      )
                    : AppColors.primaryGradient,
                boxShadow: [
                  BoxShadow(
                    color: (isVerified
                            ? const Color(0xFF10B981)
                            : AppColors.primary)
                        .withValues(alpha: 0.35),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Icon(
                isVerified ? Icons.check : Icons.verified_user_outlined,
                size: 36,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),

            // Title
            Text(
              isVerified ? 'Identity verified' : 'Verify Your Identity',
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 8),

            // Subtitle
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 320),
              child: Text(
                isVerified
                    ? 'Your government ID has been verified. Your profile now displays the ID Verified badge.'
                    : 'Our identity partner will guide you through a secure document and selfie check. Your information is handled by our identity partner — Sorcyn never sees your ID.',
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
            _buildStatusCard(isVerified: isVerified),

            const SizedBox(height: 16),

            // Benefits section
            _buildBenefitsCard(),

            const SizedBox(height: 28),

            // CTA Button
            _buildCtaButton(isVerified: isVerified),

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
                  'Powered by Stripe Identity · 256-bit encryption',
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

  Widget _buildStatusCard({required bool isVerified}) {
    return SectionCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: isVerified
                  ? const Color(0xFF10B981).withValues(alpha: 0.12)
                  : AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(
              isVerified ? Icons.check_circle : Icons.badge_outlined,
              size: 15,
              color:
                  isVerified ? const Color(0xFF10B981) : AppColors.primary,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isVerified
                      ? 'ID Verified badge is active'
                      : 'ID Verified badge — pending',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  isVerified
                      ? 'Buyers can see this badge on your seller profile.'
                      : 'Verified sellers earn higher trust and convert more offers.',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.greyMedium,
                  ),
                ),
              ],
            ),
          ),
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
                  'Why verify',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1F2937),
                  ),
                ),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              children: [
                _BenefitItem('Earn the ID Verified badge on your profile'),
                _BenefitItem('Higher buyer trust + offer acceptance rate'),
                _BenefitItem('Required for high-risk service categories'),
                _BenefitItem('Sorcyn never stores your ID — handled by our identity partner'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCtaButton({required bool isVerified}) {
    final String label;
    final LinearGradient gradient;

    if (isVerified) {
      label = 'Verified';
      gradient = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF059669), Color(0xFF10B981)],
      );
    } else {
      label = 'Verify Identity';
      gradient = AppColors.primaryGradient;
    }

    return GestureDetector(
      onTap: (_isLoading || isVerified) ? null : _startVerification,
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
