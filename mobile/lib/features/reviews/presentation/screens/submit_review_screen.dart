import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../data/models/review_model.dart';
import '../../providers/review_provider.dart';

class SubmitReviewScreen extends ConsumerStatefulWidget {
  final String transactionId;

  const SubmitReviewScreen({super.key, required this.transactionId});

  @override
  ConsumerState<SubmitReviewScreen> createState() => _SubmitReviewScreenState();
}

class _SubmitReviewScreenState extends ConsumerState<SubmitReviewScreen>
    with SingleTickerProviderStateMixin {
  int _overallRating = 0;
  bool _wouldRecommend = true;
  bool _showCategoryRatings = false;
  final _reviewController = TextEditingController();
  final Map<String, int> _categoryRatings = {
    'quality': 0,
    'communication': 0,
    'timeliness': 0,
    'professionalism': 0,
    'value': 0,
  };

  late AnimationController _chevronController;
  late Animation<double> _chevronAnimation;

  @override
  void initState() {
    super.initState();
    _chevronController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _chevronAnimation = Tween<double>(begin: 0, end: 0.5).animate(
      CurvedAnimation(parent: _chevronController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _reviewController.dispose();
    _chevronController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_overallRating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select an overall rating')),
      );
      return;
    }

    final review = _reviewController.text.trim();
    if (review.isNotEmpty && review.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Review must be at least 10 characters')),
      );
      return;
    }

    final catRatings = <String, int>{};
    if (_showCategoryRatings) {
      for (final entry in _categoryRatings.entries) {
        if (entry.value > 0) catRatings[entry.key] = entry.value;
      }
    }

    final input = CreateReviewInput(
      transactionId: widget.transactionId,
      overallRating: _overallRating,
      categoryRatings: catRatings.isNotEmpty ? catRatings : null,
      writtenReview: review.isNotEmpty ? review : null,
      wouldRecommend: _wouldRecommend,
    );

    final success =
        await ref.read(reviewSubmitProvider.notifier).submitReview(input);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Review submitted!')),
      );
      context.pop();
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to submit review')),
      );
    }
  }

  void _toggleCategoryRatings() {
    setState(() => _showCategoryRatings = !_showCategoryRatings);
    if (_showCategoryRatings) {
      _chevronController.forward();
    } else {
      _chevronController.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final submitState = ref.watch(reviewSubmitProvider);
    final isSubmitting = submitState is AsyncLoading;
    final canSubmit = _overallRating > 0 && !isSubmitting;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        automaticallyImplyLeading: false,
        leading: Padding(
          padding: const EdgeInsets.only(left: 16),
          child: Center(
            child: GestureDetector(
              onTap: () => context.pop(),
              child: Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppColors.border,
                    width: 1.5,
                  ),
                ),
                child: const Icon(
                  Icons.chevron_left,
                  color: AppColors.black,
                  size: 22,
                ),
              ),
            ),
          ),
        ),
        title: const Text(
          'Leave a Review',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.black,
            letterSpacing: -0.01,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 12),

                  // Transaction summary card
                  _buildTransactionCard(),

                  const SizedBox(height: 24),

                  // Overall star rating
                  _buildOverallRating(),

                  const SizedBox(height: 24),

                  // Category ratings (expandable)
                  _buildCategoryRatings(),

                  const SizedBox(height: 20),

                  // Written review textarea
                  _buildReviewTextArea(),

                  const SizedBox(height: 20),

                  // Would recommend toggle
                  _buildRecommendToggle(),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),

          // Sticky submit button
          _buildStickySubmit(canSubmit, isSubmitting),
        ],
      ),
    );
  }

  Widget _buildTransactionCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFFF0F0F0),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Section header
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
                    Icons.receipt_long_rounded,
                    size: 15,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 10),
                const Text(
                  'Transaction Summary',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: AppColors.black,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Seller row
            Row(
              children: [
                // Gradient avatar
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF7C3AED), Color(0xFFA855F7)],
                    ),
                  ),
                  child: const Center(
                    child: Text(
                      'PS',
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
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'ProDesigns Studio',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.black,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          ...List.generate(5, (i) {
                            return Icon(
                              i < 4 ? Icons.star_rounded : Icons.star_half_rounded,
                              size: 12,
                              color: const Color(0xFFF59E0B),
                            );
                          }),
                          const SizedBox(width: 4),
                          const Text(
                            '4.8',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.grey,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),

            // Service + Amount row
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Logo + Brand Identity',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: AppColors.grey,
                    ),
                  ),
                  const Text(
                    '\$450.00',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppColors.black,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Verified Transaction badge
            Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppColors.success.withValues(alpha: 0.2),
                  ),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.verified_rounded,
                      size: 12,
                      color: Color(0xFF059669),
                    ),
                    SizedBox(width: 4),
                    Text(
                      'Verified Transaction',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF059669),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOverallRating() {
    return Center(
      child: Column(
        children: [
          const Text(
            'How was your experience?',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.black,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(5, (i) {
              final starNum = i + 1;
              final selected = starNum <= _overallRating;
              return GestureDetector(
                onTap: () => setState(() => _overallRating = starNum),
                child: AnimatedScale(
                  scale: selected ? 1.15 : 1.0,
                  duration: const Duration(milliseconds: 150),
                  curve: Curves.easeOut,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: Icon(
                      selected
                          ? Icons.star_rounded
                          : Icons.star_outline_rounded,
                      size: 40,
                      color: selected
                          ? const Color(0xFFF59E0B)
                          : const Color(0xFFE5E7EB),
                    ),
                  ),
                ),
              );
            }),
          ),
          if (_overallRating > 0) ...[
            const SizedBox(height: 10),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: Text(
                _ratingLabel(_overallRating),
                key: ValueKey(_overallRating),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: _ratingColor(_overallRating),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCategoryRatings() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFFF0F0F0),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header (tappable)
          Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(20),
              onTap: _toggleCategoryRatings,
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
                        Icons.tune_rounded,
                        size: 15,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        'Detailed Ratings (optional)',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: AppColors.black,
                        ),
                      ),
                    ),
                    RotationTransition(
                      turns: _chevronAnimation,
                      child: const Icon(
                        Icons.expand_more_rounded,
                        size: 22,
                        color: AppColors.greyMedium,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Expandable content
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
              child: Column(
                children: _categoryRatings.entries.map((entry) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      children: [
                        SizedBox(
                          width: 120,
                          child: Text(
                            _categoryLabel(entry.key),
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.grey,
                            ),
                          ),
                        ),
                        ...List.generate(5, (i) {
                          final star = i + 1;
                          final filled = star <= entry.value;
                          return GestureDetector(
                            onTap: () => setState(
                                () => _categoryRatings[entry.key] = star),
                            child: Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 2),
                              child: Icon(
                                filled
                                    ? Icons.star_rounded
                                    : Icons.star_outline_rounded,
                                size: 24,
                                color: filled
                                    ? const Color(0xFFF59E0B)
                                    : const Color(0xFFE5E7EB),
                              ),
                            ),
                          );
                        }),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            crossFadeState: _showCategoryRatings
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 250),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewTextArea() {
    final hasContent = _reviewController.text.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Written Review (optional)',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.black,
              ),
            ),
            Text(
              '${_reviewController.text.length}/2000',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: hasContent ? AppColors.primary : AppColors.greyMedium,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: hasContent ? AppColors.primary : AppColors.border,
              width: 1.5,
            ),
          ),
          constraints: const BoxConstraints(minHeight: 120),
          child: TextField(
            controller: _reviewController,
            maxLines: 5,
            minLines: 4,
            maxLength: 2000,
            onChanged: (_) => setState(() {}),
            textCapitalization: TextCapitalization.sentences,
            style: const TextStyle(
              fontSize: 15,
              color: AppColors.black,
              height: 1.5,
            ),
            decoration: const InputDecoration(
              border: InputBorder.none,
              hintText: 'Share your experience...',
              hintStyle: TextStyle(fontSize: 15, color: AppColors.greyMedium),
              contentPadding: EdgeInsets.all(16),
              counterText: '',
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRecommendToggle() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFF0F0F0),
          width: 1.5,
        ),
      ),
      child: Row(
        children: [
          const Expanded(
            child: Text(
              'Would you recommend this seller?',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.black,
              ),
            ),
          ),
          SizedBox(
            width: 44,
            height: 26,
            child: FittedBox(
              child: CupertinoSwitch(
                value: _wouldRecommend,
                activeTrackColor: AppColors.primary,
                onChanged: (v) => setState(() => _wouldRecommend = v),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStickySubmit(bool canSubmit, bool isSubmitting) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: canSubmit
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ]
            : [],
      ),
      child: GestureDetector(
        onTap: canSubmit ? _submit : null,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: double.infinity,
          height: 56,
          decoration: BoxDecoration(
            gradient: canSubmit ? AppColors.primaryGradient : null,
            color: canSubmit ? null : const Color(0xFFE5E7EB),
            borderRadius: BorderRadius.circular(24),
            boxShadow: canSubmit
                ? [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.35),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ]
                : [],
          ),
          child: Center(
            child: isSubmitting
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      valueColor: AlwaysStoppedAnimation(Colors.white),
                    ),
                  )
                : Text(
                    'Submit Review',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: canSubmit ? Colors.white : AppColors.greyMedium,
                      letterSpacing: 0.01,
                    ),
                  ),
          ),
        ),
      ),
    );
  }

  String _ratingLabel(int rating) {
    return switch (rating) {
      1 => 'Poor',
      2 => 'Fair',
      3 => 'Good',
      4 => 'Very Good',
      5 => 'Excellent',
      _ => '',
    };
  }

  Color _ratingColor(int rating) {
    return switch (rating) {
      1 => AppColors.error,
      2 => const Color(0xFFF59E0B),
      3 => const Color(0xFF84CC16),
      4 => AppColors.success,
      5 => AppColors.success,
      _ => AppColors.grey,
    };
  }

  String _categoryLabel(String key) {
    return switch (key) {
      'quality' => 'Quality',
      'communication' => 'Communication',
      'timeliness' => 'Timeliness',
      'professionalism' => 'Professionalism',
      'value' => 'Value',
      _ => key,
    };
  }
}
