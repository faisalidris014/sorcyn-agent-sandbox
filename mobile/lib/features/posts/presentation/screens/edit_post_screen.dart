import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/network/api_error_extractor.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/app_input_field.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/photo_picker_grid.dart';
import '../../data/models/post_model.dart';
import '../../providers/post_provider.dart';

class EditPostScreen extends ConsumerStatefulWidget {
  final String postId;

  const EditPostScreen({super.key, required this.postId});

  @override
  ConsumerState<EditPostScreen> createState() => _EditPostScreenState();
}

class _EditPostScreenState extends ConsumerState<EditPostScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _budgetMinController = TextEditingController();
  final _budgetMaxController = TextEditingController();
  final _locationController = TextEditingController();

  String _urgency = 'flexible';
  List<String> _photoUrls = [];
  List<String> _videoUrls = [];
  bool _mediaUploadsPending = false;
  bool _isSaving = false;
  String? _error;
  bool _initialized = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _budgetMinController.dispose();
    _budgetMaxController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  void _populateFields(Post post) {
    if (_initialized) return;
    _initialized = true;
    _titleController.text = post.title;
    _descriptionController.text = post.description;
    if (post.budgetMin != null) {
      _budgetMinController.text = formatCurrencyInput(post.budgetMin!);
    }
    if (post.budgetMax != null) {
      _budgetMaxController.text = formatCurrencyInput(post.budgetMax!);
    }
    final location = [
      post.locationCity,
      post.locationState,
    ].where((s) => s != null && s.isNotEmpty).join(', ');
    _locationController.text = location;
    _urgency = post.urgency ?? 'flexible';
    _photoUrls = List<String>.from(post.photoUrls);
    _videoUrls = List<String>.from(post.videoUrls);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_mediaUploadsPending) {
      setState(() => _error =
          'Some photos or videos are still uploading or failed. Retry or remove them before saving.');
      return;
    }
    setState(() {
      _isSaving = true;
      _error = null;
    });
    try {
      final data = <String, dynamic>{
        'title': _titleController.text,
        'description': _descriptionController.text,
        'urgency': _urgency,
        if (_budgetMinController.text.isNotEmpty)
          'budgetMin': parseCurrencyInput(_budgetMinController.text),
        if (_budgetMaxController.text.isNotEmpty)
          'budgetMax': parseCurrencyInput(_budgetMaxController.text),
        'photos': _photoUrls,
        'videos': _videoUrls,
      };
      await ref.read(postsProvider.notifier).updatePost(widget.postId, data);
      if (mounted) {
        ref.invalidate(postDetailProvider(widget.postId));
        context.pop();
      }
    } catch (e) {
      setState(() {
        _isSaving = false;
        _error = extractApiErrorMessage(e,
            fallback: 'Failed to save changes. Please try again.');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final postAsync = ref.watch(postDetailProvider(widget.postId));

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: postAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, _) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline,
                    size: 48, color: AppColors.error),
                const SizedBox(height: 12),
                Text('Failed to load post',
                    style: TextStyle(color: AppColors.grey)),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () =>
                      ref.invalidate(postDetailProvider(widget.postId)),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
          data: (post) {
            _populateFields(post);
            return Column(
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
                        'Edit Post',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.black,
                        ),
                      ),
                    ],
                  ),
                ),

                // Offer warning banner
                if (post.offerCount > 0)
                  Container(
                    margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.warning.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline,
                            size: 20, color: AppColors.warning),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'This post has ${post.offerCount} offer${post.offerCount == 1 ? '' : 's'}. '
                            'Saving changes will notify sellers and require them to reconfirm.',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.warning,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Form
                Expanded(
                  child: Form(
                    key: _formKey,
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Category (read-only display)
                          _FieldLabel(label: 'Category'),
                          const SizedBox(height: 8),
                          Container(
                            width: double.infinity,
                            height: 52,
                            padding:
                                const EdgeInsets.symmetric(horizontal: 16),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceVariant
                                  .withValues(alpha: 0.5),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Align(
                              alignment: Alignment.centerLeft,
                              child: Text(
                                [
                                  post.category?['name'],
                                  post.subcategory?['name'],
                                ]
                                    .where((s) => s != null)
                                    .join(' > '),
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: AppColors.grey,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Title
                          AppInputField(
                            controller: _titleController,
                            label: 'Title *',
                            hint: 'What do you need?',
                            validator: (v) {
                              if (v == null || v.length < 5) {
                                return 'Title must be at least 5 characters';
                              }
                              if (v.length > 200) return 'Title is too long';
                              return null;
                            },
                          ),
                          const SizedBox(height: 20),

                          // Description
                          _FieldLabel(label: 'Description', required: true),
                          const SizedBox(height: 8),
                          Container(
                            decoration: BoxDecoration(
                              color: AppColors.surfaceVariant,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                  color: AppColors.border, width: 1.5),
                            ),
                            child: TextFormField(
                              controller: _descriptionController,
                              maxLines: 5,
                              maxLength: 5000,
                              decoration: const InputDecoration(
                                hintText:
                                    'Describe what you need in detail...',
                                hintStyle: TextStyle(
                                  fontSize: 14,
                                  color: AppColors.greyMedium,
                                ),
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.all(16),
                                counterStyle: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.greyMedium,
                                ),
                              ),
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.black,
                                height: 1.5,
                              ),
                              validator: (v) {
                                if (v == null || v.length < 20) {
                                  return 'Description must be at least 20 characters';
                                }
                                return null;
                              },
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Photos & Videos
                          _FieldLabel(label: 'Photos & Videos'),
                          const SizedBox(height: 4),
                          const Text(
                            'Up to 10 photos · 10 MB each & 3 videos · 100 MB each',
                            style: TextStyle(
                              fontSize: 11,
                              color: AppColors.greyMedium,
                            ),
                          ),
                          const SizedBox(height: 10),
                          PhotoPickerGrid(
                            initialUrls: post.photoUrls,
                            initialVideoUrls: post.videoUrls,
                            onUrlsChanged: (urls) =>
                                setState(() => _photoUrls = urls),
                            onVideoUrlsChanged: (urls) =>
                                setState(() => _videoUrls = urls),
                            onPendingChanged: (pending) =>
                                setState(() => _mediaUploadsPending = pending),
                          ),
                          const SizedBox(height: 20),

                          // Budget
                          _FieldLabel(label: 'Budget'),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: AppInputField(
                                  controller: _budgetMinController,
                                  label: 'Min',
                                  hint: '\$0',
                                  keyboardType: TextInputType.number,
                                  inputFormatters: [CurrencyInputFormatter()],
                                ),
                              ),
                              const Padding(
                                padding:
                                    EdgeInsets.symmetric(horizontal: 8),
                                child: Text('—',
                                    style: TextStyle(
                                        color: AppColors.greyMedium)),
                              ),
                              Expanded(
                                child: AppInputField(
                                  controller: _budgetMaxController,
                                  label: 'Max',
                                  hint: '\$0',
                                  keyboardType: TextInputType.number,
                                  inputFormatters: [CurrencyInputFormatter()],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),

                          // Location
                          AppInputField(
                            controller: _locationController,
                            label: 'Location',
                            hint: 'e.g., Dallas, TX',
                            prefixIcon: Icons.location_on_outlined,
                          ),
                          const SizedBox(height: 20),

                          // Urgency
                          _FieldLabel(label: 'Urgency'),
                          const SizedBox(height: 8),
                          _UrgencyChips(
                            value: _urgency,
                            onChanged: (v) =>
                                setState(() => _urgency = v),
                          ),

                          if (_error != null) ...[
                            const SizedBox(height: 12),
                            Text(_error!,
                                style: const TextStyle(
                                    color: AppColors.error, fontSize: 13)),
                          ],
                          const SizedBox(height: 80),
                        ],
                      ),
                    ),
                  ),
                ),

                // Bottom action bar
                Container(
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
                  child: GradientButton(
                    text: 'Save Changes',
                    height: 52,
                    borderRadius: 20,
                    isLoading: _isSaving,
                    onPressed: _isSaving ? null : _save,
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

// ─── Field Label ─────────────────────────────────────────────────────

class _FieldLabel extends StatelessWidget {
  final String label;
  final bool required;

  const _FieldLabel({required this.label, this.required = false});

  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppColors.black,
        ),
        children: [
          TextSpan(text: label),
          if (required)
            const TextSpan(
              text: ' *',
              style: TextStyle(color: AppColors.primary),
            ),
        ],
      ),
    );
  }
}

// ─── Urgency Chips ───────────────────────────────────────────────────

class _UrgencyChips extends StatelessWidget {
  final String value;
  final ValueChanged<String> onChanged;

  const _UrgencyChips({required this.value, required this.onChanged});

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
                borderRadius: BorderRadius.circular(100),
                border: Border.all(
                  color: isActive ? AppColors.primary : AppColors.border,
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
