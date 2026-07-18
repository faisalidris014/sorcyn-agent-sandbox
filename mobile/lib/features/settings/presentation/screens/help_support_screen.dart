import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../../../shared/widgets/styled_app_bar.dart';

class HelpSupportScreen extends StatefulWidget {
  const HelpSupportScreen({super.key});

  @override
  State<HelpSupportScreen> createState() => _HelpSupportScreenState();
}

class _HelpSupportScreenState extends State<HelpSupportScreen> {
  int? _expandedIndex;
  final TextEditingController _searchController = TextEditingController();

  static const _faqs = [
    (
      'How do I create a post?',
      'Tap the "+" button on your dashboard and choose between AI-assisted or manual post creation. Describe what you need, set your budget, and sellers will start submitting offers.'
    ),
    (
      'How does payment work?',
      'When you accept an offer, your payment is held securely in escrow. Funds are only released to the seller after you approve the completed work.'
    ),
    (
      'What is escrow?',
      'Escrow is a secure payment arrangement where funds are held by a trusted third-party payment processor until both the buyer and seller fulfill their obligations. This protects both parties.'
    ),
    (
      'How do I become a verified seller?',
      'Go to your Seller Profile → Verification. You can submit documents for ID verification, professional licenses, insurance certificates, and background checks.'
    ),
    (
      'What if I have a dispute?',
      'If there\'s an issue with a transaction, you can file a dispute from the transaction detail screen. Our support team will review the evidence and work to resolve it fairly.'
    ),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _launchExternal(
    BuildContext context,
    Uri uri, {
    String fallbackMessage = "Couldn't open that link.",
  }) async {
    // iOS requires the scheme to be declared in LSApplicationQueriesSchemes
    // (Info.plist) or canLaunchUrl returns false — without this gate
    // launchUrl silently no-ops and the user gets no feedback.
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(fallbackMessage)),
      );
    }
  }

  Future<void> _sendMessage() async {
    await _launchExternal(
      context,
      Uri.parse('mailto:support@sorcyn.com?subject=Support%20Request'),
      fallbackMessage: "Couldn't open your email app.",
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: StyledAppBar(
        title: 'Help & Support',
        onBack: () => Navigator.of(context).pop(),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),

            // Search bar — locked input style (16 radius, 1.5px border,
            // surfaceVariant fill)
            Container(
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                // 16 — locked card/input radius
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border, width: 1.5),
              ),
              child: Row(
                children: [
                  const SizedBox(width: 16),
                  const Icon(Icons.search, size: 18, color: AppColors.greyMedium),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      style: const TextStyle(fontSize: 14, color: AppColors.black),
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        hintText: 'Search help articles...',
                        hintStyle: TextStyle(
                          fontSize: 14,
                          color: AppColors.greyMedium,
                        ),
                        contentPadding: EdgeInsets.zero,
                        isDense: true,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // FAQ section
            const _SectionLabel('FREQUENTLY ASKED'),
            SectionCard(
              child: Column(
                children: [
                  for (int i = 0; i < _faqs.length; i++) ...[
                    _FaqItem(
                      question: _faqs[i].$1,
                      answer: _faqs[i].$2,
                      isExpanded: _expandedIndex == i,
                      onTap: () => setState(
                          () => _expandedIndex = _expandedIndex == i ? null : i),
                    ),
                    if (i < _faqs.length - 1)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Divider(
                          height: 1,
                          thickness: 1,
                          color: AppColors.border.withValues(alpha: 0.6),
                        ),
                      ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Contact Us section — each row gets a 4px gradient accent strip
            // (BATCH_7_PLAN quick-action card pattern)
            const _SectionLabel('CONTACT US'),
            SectionCard(
              child: Column(
                children: [
                  _ContactRow(
                    icon: Icons.email_outlined,
                    label: 'Email Support',
                    subtitle: 'support@sorcyn.com',
                    onTap: () => _launchExternal(
                      context,
                      Uri.parse('mailto:support@sorcyn.com'),
                      fallbackMessage: "Couldn't open your email app.",
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(left: 62),
                    child: Divider(
                      height: 1,
                      thickness: 1,
                      color: AppColors.border.withValues(alpha: 0.6),
                    ),
                  ),
                  _ContactRow(
                    icon: Icons.chat_bubble_outline,
                    label: 'Live Chat',
                    subtitle: 'Usually responds in minutes',
                    trailing: const _OnlineBadge(),
                    onTap: _sendMessage,
                  ),
                  Padding(
                    padding: const EdgeInsets.only(left: 62),
                    child: Divider(
                      height: 1,
                      thickness: 1,
                      color: AppColors.border.withValues(alpha: 0.6),
                    ),
                  ),
                  _ContactRow(
                    icon: Icons.phone_outlined,
                    label: 'Phone',
                    subtitle: '+1 (469) 555-0123',
                    onTap: () => _launchExternal(
                      context,
                      Uri.parse('tel:+14695550123'),
                      fallbackMessage: "Couldn't start a phone call.",
                    ),
                  ),
                  // Send Message — primary CTA (locked Sorcyn gradient)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                    child: GradientButton(
                      text: 'Send Message',
                      onPressed: _sendMessage,
                      icon: Icons.send,
                      height: 48,
                      // 16 — locked card radius
                      borderRadius: 16,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Legal links
            const _SectionLabel('LEGAL'),
            SectionCard(
              child: Column(
                children: [
                  _LegalRow(label: 'Privacy Policy', onTap: () {}),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Divider(
                      height: 1,
                      thickness: 1,
                      color: AppColors.border.withValues(alpha: 0.6),
                    ),
                  ),
                  _LegalRow(label: 'Terms of Service', onTap: () {}),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Divider(
                      height: 1,
                      thickness: 1,
                      color: AppColors.border.withValues(alpha: 0.6),
                    ),
                  ),
                  _LegalRow(label: 'Community Guidelines', onTap: () {}),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // App version
            Center(
              child: Text(
                'Version 1.0.0 (Build 42)',
                style: TextStyle(
                  fontSize: 11,
                  color: AppColors.greyMedium.withValues(alpha: 0.55),
                ),
              ),
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

class _FaqItem extends StatelessWidget {
  final String question;
  final String answer;
  final bool isExpanded;
  final VoidCallback onTap;

  const _FaqItem({
    required this.question,
    required this.answer,
    required this.isExpanded,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 4px gradient accent strip — visible only when expanded
              // (locked Sorcyn primaryGradient per BATCH_7_PLAN
              // quick-action card pattern)
              AnimatedOpacity(
                duration: const Duration(milliseconds: 200),
                opacity: isExpanded ? 1.0 : 0.0,
                child: Container(
                  width: 4,
                  decoration: const BoxDecoration(
                    gradient: AppColors.primaryGradient,
                  ),
                ),
              ),
              Expanded(
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              question,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: isExpanded
                                    ? AppColors.primary
                                    : AppColors.black,
                              ),
                            ),
                          ),
                          AnimatedRotation(
                            turns: isExpanded ? 0.5 : 0,
                            duration: const Duration(milliseconds: 200),
                            child: Icon(
                              Icons.expand_more,
                              size: 20,
                              color: isExpanded
                                  ? AppColors.primary
                                  : AppColors.greyMedium,
                            ),
                          ),
                        ],
                      ),
                      AnimatedCrossFade(
                        firstChild: const SizedBox.shrink(),
                        secondChild: const Padding(
                          padding: EdgeInsets.only(top: 10),
                          child: SizedBox.shrink(),
                        ),
                        crossFadeState: isExpanded
                            ? CrossFadeState.showSecond
                            : CrossFadeState.showFirst,
                        duration: const Duration(milliseconds: 200),
                      ),
                      AnimatedCrossFade(
                        firstChild: const SizedBox.shrink(),
                        secondChild: Padding(
                          padding: const EdgeInsets.only(top: 10),
                          child: Text(
                            answer,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.grey,
                              height: 1.65,
                            ),
                          ),
                        ),
                        crossFadeState: isExpanded
                            ? CrossFadeState.showSecond
                            : CrossFadeState.showFirst,
                        duration: const Duration(milliseconds: 200),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ContactRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback onTap;

  const _ContactRow({
    required this.icon,
    required this.label,
    this.subtitle,
    this.trailing,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 4px gradient accent strip — locked Sorcyn primaryGradient
              // (BATCH_7_PLAN quick-action card pattern)
              Container(
                width: 4,
                decoration: const BoxDecoration(
                  gradient: AppColors.primaryGradient,
                ),
              ),
              Expanded(
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                  child: Row(
                    children: [
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(icon, size: 16, color: AppColors.primary),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  label,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.black,
                                  ),
                                ),
                                if (trailing != null) ...[
                                  const SizedBox(width: 8),
                                  trailing!,
                                ],
                              ],
                            ),
                            if (subtitle != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 2),
                                child: Text(
                                  subtitle!,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.greyMedium,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                      Icon(
                        Icons.chevron_right,
                        size: 18,
                        color: AppColors.greyMedium.withValues(alpha: 0.7),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LegalRow extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _LegalRow({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.black,
                  ),
                ),
              ),
              Icon(
                Icons.chevron_right,
                size: 18,
                color: AppColors.greyMedium.withValues(alpha: 0.7),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnlineBadge extends StatelessWidget {
  const _OnlineBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.08),
        // 24 — locked pill radius (capsule). Pill width is short so a smaller
        // visual radius is OK; keep on locked scale.
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.success,
            ),
          ),
          const SizedBox(width: 4),
          const Text(
            'Online',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: AppColors.success,
            ),
          ),
        ],
      ),
    );
  }
}
