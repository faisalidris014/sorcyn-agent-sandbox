import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/network/api_error_extractor.dart';
import '../../../../core/providers/marketplace_context_provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_input_field.dart';
import '../../../../shared/widgets/category_picker.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/photo_picker_grid.dart';
import '../../../../shared/widgets/product_condition_picker.dart';
import '../../data/models/post_model.dart';
import '../../providers/post_provider.dart';

class AIPostCreationScreen extends ConsumerStatefulWidget {
  const AIPostCreationScreen({super.key});

  @override
  ConsumerState<AIPostCreationScreen> createState() =>
      _AIPostCreationScreenState();
}

class _AIPostCreationScreenState extends ConsumerState<AIPostCreationScreen> {
  final _inputController = TextEditingController();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _budgetMinController = TextEditingController();
  final _budgetMaxController = TextEditingController();

  ParsedPost? _parsed;
  bool _isParsing = false;
  bool _isPublishing = false;
  String? _error;

  CategoryPickerResult? _selectedCategory;
  String _budgetType = 'fixed';
  String _urgency = 'flexible';
  String? _productCondition;
  List<String> _photoUrls = [];
  List<String> _videoUrls = [];
  bool _mediaUploadsPending = false;

  @override
  void dispose() {
    _inputController.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    _budgetMinController.dispose();
    _budgetMaxController.dispose();
    super.dispose();
  }

  Future<void> _parseWithAI() async {
    if (_inputController.text.length < 20) {
      setState(
          () => _error = 'Please describe what you need (at least 20 characters).');
      return;
    }
    setState(() {
      _isParsing = true;
      _error = null;
    });
    try {
      final parsed = await ref.read(postsProvider.notifier).parseWithAI(
            text: _inputController.text,
          );
      setState(() {
        _parsed = parsed;
        _isParsing = false;
        _titleController.text = parsed.title ?? '';
        _descriptionController.text = parsed.description ?? '';
        if (parsed.budgetMin != null) {
          _budgetMinController.text = parsed.budgetMin!.toStringAsFixed(0);
        }
        if (parsed.budgetMax != null) {
          _budgetMaxController.text = parsed.budgetMax!.toStringAsFixed(0);
        }
        if (parsed.budgetType != null) _budgetType = parsed.budgetType!;
        if (parsed.urgency != null) _urgency = parsed.urgency!;
      });
    } catch (e) {
      setState(() {
        _isParsing = false;
        _error = extractApiErrorMessage(e,
            fallback: 'Failed to parse. Please try again or use manual form.');
      });
    }
  }

  Future<void> _publish({String status = 'active'}) async {
    if (_titleController.text.length < 5) {
      setState(() => _error = 'Title must be at least 5 characters.');
      return;
    }
    // Every post must carry a subcategory (#321). Resolve it from the SAME
    // source the payload uses below: a manual override (_selectedCategory) takes
    // precedence over the AI parse (_parsed). Reading them independently (`??`)
    // let a child-less major selection pass the guard on a stale parsed
    // subcategory, then POST categoryId without subcategoryId → 400 (#7c).
    final effectiveSubcategoryId = _selectedCategory != null
        ? _selectedCategory!.subcategoryId
        : _parsed?.subcategoryId;
    if (effectiveSubcategoryId == null) {
      final result = await showCategoryPicker(context);
      if (result?.subcategoryId != null) {
        setState(() {
          _selectedCategory = result;
          if (result != null && !result.isProducts) _productCondition = null;
        });
      } else {
        setState(() => _error = 'Please choose a subcategory for this request.');
        return;
      }
    }
    if (_selectedCategory?.isProducts == true && _productCondition == null) {
      setState(() => _error = 'Please select the item condition.');
      return;
    }
    if (_mediaUploadsPending) {
      setState(() => _error =
          'Some photos or videos are still uploading or failed. Retry or remove them before posting.');
      return;
    }
    setState(() {
      _isPublishing = true;
      _error = null;
    });
    try {
      final mktCtx = ref.read(marketplaceContextProvider);
      final categorySpecific = <String, dynamic>{
        if (_selectedCategory?.isProducts == true && _productCondition != null)
          'condition': _productCondition,
      };
      final data = <String, dynamic>{
        'title': _titleController.text,
        'description': _descriptionController.text,
        'budgetType': _budgetType,
        'urgency': _urgency,
        'status': status,
        'marketplaceContext': mktCtx.value,
        if (_selectedCategory != null) ...{
          'categoryId': _selectedCategory!.categoryId,
          if (_selectedCategory!.subcategoryId != null)
            'subcategoryId': _selectedCategory!.subcategoryId,
        } else if (_parsed?.categoryId != null) ...{
          'categoryId': _parsed!.categoryId,
          if (_parsed?.subcategoryId != null)
            'subcategoryId': _parsed!.subcategoryId,
        },
        if (_budgetMinController.text.isNotEmpty)
          'budgetMin': double.tryParse(_budgetMinController.text),
        if (_budgetMaxController.text.isNotEmpty)
          'budgetMax': double.tryParse(_budgetMaxController.text),
        if (categorySpecific.isNotEmpty) 'categorySpecific': categorySpecific,
        if (_photoUrls.isNotEmpty) 'photos': _photoUrls,
        if (_videoUrls.isNotEmpty) 'videos': _videoUrls,
      };
      final post = await ref.read(postsProvider.notifier).createPost(data);
      if (mounted) context.go('/posts/created/${post.id}');
    } catch (e) {
      setState(() {
        _isPublishing = false;
        _error = extractApiErrorMessage(e,
            fallback: 'Failed to create post. Please try again.');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // App Bar
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
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
                      child: const Icon(Icons.chevron_left,
                          size: 20, color: AppColors.black),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'AI-Assisted',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.black,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'AI',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Progress bar (step 2 of 3)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: _ProgressBar(step: 2),
            ),

            // Body
            Expanded(
              child: _parsed == null ? _buildDescribePhase() : _buildPreviewPhase(),
            ),

            // Bottom action bar
            _buildBottomBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildDescribePhase() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Describe what you need',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.black,
              letterSpacing: -0.01,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Write naturally. Our AI will extract the details and structure your post.',
            style: TextStyle(fontSize: 13, color: AppColors.grey, height: 1.5),
          ),
          const SizedBox(height: 20),

          // Textarea
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
              color: AppColors.surfaceVariant,
            ),
            child: Column(
              children: [
                TextField(
                  controller: _inputController,
                  maxLines: 6,
                  maxLength: 2000,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(
                    hintText:
                        'e.g., I need someone to fix a leaky kitchen faucet. Budget around \$100-200. Prefer someone who can come this week...',
                    hintStyle: TextStyle(
                      fontSize: 13,
                      color: AppColors.greyMedium,
                      height: 1.6,
                    ),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.all(16),
                    counterText: '',
                  ),
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.black,
                    height: 1.6,
                  ),
                ),
                // Character count
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      '${_inputController.text.length}/2000',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.greyMedium,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Tip box
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.15),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.auto_awesome,
                    size: 16, color: AppColors.primary),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Tip: Include budget, timeline, and any specific requirements for best results.',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.primary.withValues(alpha: 0.8),
                      height: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          ),

          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
          ],
          const SizedBox(height: 20),

          // Generate button
          GradientButton(
            text: _isParsing ? 'Generating...' : 'Generate Post',
            icon: Icons.auto_awesome,
            height: 52,
            borderRadius: 24,
            isLoading: _isParsing,
            onPressed: _isParsing ? null : _parseWithAI,
          ),
        ],
      ),
    );
  }

  Widget _buildPreviewPhase() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Success message
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 18),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'AI parsed your request. Review and edit below.',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF059669),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Title field
          _AIField(
            label: 'Title',
            child: AppInputField(
              controller: _titleController,
              label: 'Title',
              hint: 'Post title',
            ),
          ),
          const SizedBox(height: 16),

          // Category
          _AIField(
            label: 'Category',
            child: GestureDetector(
              onTap: () async {
                final result = await showCategoryPicker(context);
                if (result != null) {
                  setState(() {
                    _selectedCategory = result;
                    if (!result.isProducts) _productCondition = null;
                  });
                }
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.03),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        _selectedCategory?.displayName ??
                            _parsed?.categorySlug ??
                            'Select category',
                        style: TextStyle(
                          fontSize: 14,
                          color: _selectedCategory != null
                              ? AppColors.black
                              : AppColors.greyMedium,
                        ),
                      ),
                    ),
                    const Icon(Icons.chevron_right,
                        size: 18, color: AppColors.greyMedium),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Description
          _AIField(
            label: 'Description',
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.03),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: TextField(
                controller: _descriptionController,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'Describe your requirements...',
                  hintStyle: TextStyle(
                    fontSize: 14,
                    color: AppColors.greyMedium,
                  ),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.all(16),
                ),
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.black,
                  height: 1.5,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Budget
          _AIField(
            label: 'Budget',
            child: Row(
              children: [
                Expanded(
                  child: AppInputField(
                    controller: _budgetMinController,
                    label: 'Min',
                    hint: '\$0',
                    keyboardType: TextInputType.number,
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Text('—', style: TextStyle(color: AppColors.greyMedium)),
                ),
                Expanded(
                  child: AppInputField(
                    controller: _budgetMaxController,
                    label: 'Max',
                    hint: '\$0',
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Urgency
          _AIField(
            label: 'Urgency',
            child: _UrgencySelector(
              value: _urgency,
              onChanged: (v) => setState(() => _urgency = v),
            ),
          ),

          // Products condition (required by backend for any category under
          // Products)
          if (_selectedCategory?.isProducts == true) ...[
            const SizedBox(height: 16),
            _AIField(
              label: 'Condition *',
              child: ProductConditionPicker(
                value: _productCondition,
                onChanged: (v) => setState(() => _productCondition = v),
              ),
            ),
          ],

          const SizedBox(height: 16),

          // Photos (optional)
          _AIField(
            label: 'Photos (optional)',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Up to 10 photos (10 MB each) · 3 videos (100 MB each)',
                  style: TextStyle(fontSize: 11, color: AppColors.greyMedium),
                ),
                const SizedBox(height: 10),
                PhotoPickerGrid(
                  onUrlsChanged: (urls) => setState(() => _photoUrls = urls),
                  onVideoUrlsChanged: (urls) =>
                      setState(() => _videoUrls = urls),
                  onPendingChanged: (pending) =>
                      setState(() => _mediaUploadsPending = pending),
                ),
              ],
            ),
          ),

          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
          ],
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    if (_parsed == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: _isPublishing ? null : () => _publish(status: 'draft'),
              child: Container(
                height: 50,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.3),
                    width: 1.5,
                  ),
                ),
                child: const Center(
                  child: Text(
                    'Save Draft',
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
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: GradientButton(
              text: 'Post Now',
              height: 50,
              borderRadius: 20,
              isLoading: _isPublishing,
              onPressed: _isPublishing ? null : _publish,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Progress Bar ────────────────────────────────────────────────────

class _ProgressBar extends StatelessWidget {
  final int step;

  const _ProgressBar({required this.step});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(4),
      child: LinearProgressIndicator(
        value: step / 3.0,
        minHeight: 4,
        backgroundColor: AppColors.greyLight,
        valueColor: const AlwaysStoppedAnimation(AppColors.primary),
      ),
    );
  }
}

// ─── AI Field Wrapper ────────────────────────────────────────────────

class _AIField extends StatelessWidget {
  final String label;
  final Widget child;

  const _AIField({required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.black,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text(
                'AI',
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}

// ─── Urgency Selector ────────────────────────────────────────────────

class _UrgencySelector extends StatelessWidget {
  final String value;
  final ValueChanged<String> onChanged;

  const _UrgencySelector({required this.value, required this.onChanged});

  // Values mirror backend `posts.schemas.ts` urgency enum.
  static const _options = [
    ('flexible', 'Flexible'),
    ('within_1_week', 'This Week'),
    ('within_24_hours', '24 Hours'),
    ('asap', 'ASAP'),
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: _options.map((o) {
        final isActive = value == o.$1;
        return Expanded(
          child: GestureDetector(
            onTap: () => onChanged(o.$1),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              margin: const EdgeInsets.only(right: 8),
              height: 38,
              decoration: BoxDecoration(
                color: isActive
                    ? AppColors.primary.withValues(alpha: 0.08)
                    : AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isActive
                      ? AppColors.primary
                      : AppColors.border,
                  width: isActive ? 1.5 : 1,
                ),
              ),
              child: Center(
                child: Text(
                  o.$2,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isActive ? AppColors.primary : AppColors.grey,
                  ),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
