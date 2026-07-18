import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/network/api_error_extractor.dart';
import '../../../../core/providers/marketplace_context_provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/app_input_field.dart';
import '../../../../shared/widgets/category_picker.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/photo_picker_grid.dart';
import '../../../../shared/widgets/product_condition_picker.dart';
import '../../../../shared/widgets/urgency_chips.dart';
import '../../data/models/post_model.dart';
import '../../providers/post_provider.dart';

class ManualPostCreationScreen extends ConsumerStatefulWidget {
  const ManualPostCreationScreen({super.key, this.duplicateFrom});

  /// When set, the form is pre-filled from this post's content (title,
  /// description, budget, category, urgency, condition/roleTier). User-uploaded
  /// images are intentionally NOT copied — powers "Duplicate this post as
  /// mine" from the Discover feed (#315).
  final Post? duplicateFrom;

  @override
  ConsumerState<ManualPostCreationScreen> createState() =>
      _ManualPostCreationScreenState();
}

class _ManualPostCreationScreenState
    extends ConsumerState<ManualPostCreationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _budgetMinController = TextEditingController();
  final _budgetMaxController = TextEditingController();
  final _locationController = TextEditingController();

  CategoryPickerResult? _selectedCategory;
  final String _budgetType = 'range';
  String _urgency = 'flexible';
  bool _isPublishing = false;
  String? _error;
  List<String> _photoUrls = [];
  List<String> _videoUrls = [];
  bool _mediaUploadsPending = false;

  // Products-specific fields
  String? _productCondition;

  // Jobs-specific fields
  // roleTier values match backend `calculateJobLeadFee`:
  // entry ($10) | mid ($50) | specialized_senior ($500).
  String? _roleTier;
  String _salaryType = 'hourly'; // 'hourly' | 'yearly'

  /// Local `isJobs` predicate. CategoryPickerResult exposes `isProducts`
  /// directly but not `isJobs`; we mirror the slug-comparison shape to avoid
  /// editing the shared widget file (out of 04-02 scope).
  bool get _isJobsCategory => _selectedCategory?.categorySlug == 'jobs';

  // B2B-specific fields
  final _quantityController = TextEditingController();
  final _minOrderController = TextEditingController();
  bool _invoiceAvailable = false;

  @override
  void initState() {
    super.initState();
    final src = widget.duplicateFrom;
    if (src == null) return;
    // Duplicate-as-mine: copy text content + category, but never the original's
    // uploaded photos/videos (#315).
    _titleController.text = src.title;
    _descriptionController.text = src.description;
    if (src.budgetMin != null) {
      _budgetMinController.text = formatCurrencyInput(src.budgetMin!);
    }
    if (src.budgetMax != null) {
      _budgetMaxController.text = formatCurrencyInput(src.budgetMax!);
    }
    if (src.urgency != null) _urgency = src.urgency!;
    final catSlug = src.category?['slug'] as String?;
    if (catSlug != null) {
      _selectedCategory = CategoryPickerResult(
        categoryId: src.categoryId,
        categoryName: src.category?['name'] as String? ?? '',
        categorySlug: catSlug,
        subcategoryId: src.subcategoryId,
        subcategoryName: src.subcategory?['name'] as String?,
        subcategorySlug: src.subcategory?['slug'] as String?,
      );
    }
    final cond = src.categorySpecific['condition'];
    if (cond is String) _productCondition = cond;
    final tier = src.categorySpecific['roleTier'];
    if (tier is String) _roleTier = tier;
    final salaryType = src.categorySpecific['salaryType'];
    if (salaryType is String) _salaryType = salaryType;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _budgetMinController.dispose();
    _budgetMaxController.dispose();
    _locationController.dispose();
    _quantityController.dispose();
    _minOrderController.dispose();
    super.dispose();
  }

  Future<void> _publish({String status = 'active'}) async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategory == null) {
      setState(() => _error = 'Please select a category.');
      return;
    }
    if (_selectedCategory!.subcategoryId == null) {
      setState(() => _error = 'Please select a subcategory.');
      return;
    }
    if (_selectedCategory!.isProducts && _productCondition == null) {
      setState(() => _error = 'Please select the item condition.');
      return;
    }
    if (_isJobsCategory && _roleTier == null) {
      setState(() => _error = 'Please select a role tier for Jobs posts.');
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
        if (_selectedCategory!.isProducts && _productCondition != null)
          'condition': _productCondition,
        if (_isJobsCategory && _roleTier != null) 'roleTier': _roleTier,
        if (_isJobsCategory) 'salaryType': _salaryType,
        if (mktCtx == MarketplaceContext.b2b) ...{
          if (_quantityController.text.isNotEmpty)
            'bulkQuantity': int.tryParse(_quantityController.text),
          if (_minOrderController.text.isNotEmpty)
            'minimumOrder': int.tryParse(_minOrderController.text),
          'invoiceAvailable': _invoiceAvailable,
        },
      };
      final data = <String, dynamic>{
        'title': _titleController.text,
        'description': _descriptionController.text,
        'categoryId': _selectedCategory!.categoryId,
        if (_selectedCategory!.subcategoryId != null)
          'subcategoryId': _selectedCategory!.subcategoryId,
        'budgetType': _budgetType,
        'urgency': _urgency,
        'status': status,
        'marketplaceContext': mktCtx.value,
        if (_budgetMinController.text.isNotEmpty)
          'budgetMin': parseCurrencyInput(_budgetMinController.text),
        if (_budgetMaxController.text.isNotEmpty)
          'budgetMax': parseCurrencyInput(_budgetMaxController.text),
        if (_locationController.text.isNotEmpty)
          'locationCity': _locationController.text,
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
                    'Create Post',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.black,
                    ),
                  ),
                ],
              ),
            ),

            // Progress bar (step 2 of 3)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: const LinearProgressIndicator(
                  value: 2 / 3,
                  minHeight: 4,
                  backgroundColor: AppColors.greyLight,
                  valueColor: AlwaysStoppedAnimation(AppColors.primary),
                ),
              ),
            ),

            // Form body
            Expanded(
              child: Form(
                key: _formKey,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Category
                      _FieldLabel(label: 'Category', required: true),
                      const SizedBox(height: 8),
                      GestureDetector(
                        onTap: () async {
                          final result = await showCategoryPicker(context);
                          if (result != null) {
                            setState(() {
                              _selectedCategory = result;
                              _error = null;
                              if (!result.isProducts) {
                                _productCondition = null;
                              }
                              if (result.categorySlug != 'jobs') {
                                _salaryType = 'hourly';
                              }
                            });
                          }
                        },
                        child: Container(
                          width: double.infinity,
                          height: 52,
                          padding:
                              const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceVariant,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: _error != null &&
                                      _error!.contains('category')
                                  ? AppColors.error
                                  : AppColors.border,
                              width: 1.5,
                            ),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  _selectedCategory?.displayName ??
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
                      // Jobs role tier — shown immediately after category so
                      // it's visible without scrolling.
                      if (_isJobsCategory) ...[
                        const SizedBox(height: 16),
                        _FieldLabel(label: 'Role Tier', required: true),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          initialValue: _roleTier,
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: AppColors.surfaceVariant,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide:
                                  const BorderSide(color: AppColors.border),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide:
                                  const BorderSide(color: AppColors.border),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide:
                                  const BorderSide(color: AppColors.primary),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                          ),
                          hint: const Text('Select role tier'),
                          items: const [
                            DropdownMenuItem(
                              value: 'entry',
                              child: Text('Entry-level (\$10/lead)'),
                            ),
                            DropdownMenuItem(
                              value: 'mid',
                              child: Text('Mid-level (\$50/lead)'),
                            ),
                            DropdownMenuItem(
                              value: 'specialized_senior',
                              child: Text('Specialized/Senior (\$500/lead)'),
                            ),
                          ],
                          onChanged: (v) => setState(() => _roleTier = v),
                        ),
                      ],
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
                          border: Border.all(color: AppColors.border, width: 1.5),
                        ),
                        child: TextFormField(
                          controller: _descriptionController,
                          maxLines: 5,
                          maxLength: 5000,
                          decoration: const InputDecoration(
                            hintText: 'Describe what you need in detail...',
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
                      Text(
                        'Up to 10 photos · 10 MB each & 3 videos · 100 MB each',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.greyMedium,
                        ),
                      ),
                      const SizedBox(height: 10),
                      PhotoPickerGrid(
                        onUrlsChanged: (urls) =>
                            setState(() => _photoUrls = urls),
                        onVideoUrlsChanged: (urls) =>
                            setState(() => _videoUrls = urls),
                        onPendingChanged: (pending) =>
                            setState(() => _mediaUploadsPending = pending),
                      ),
                      const SizedBox(height: 20),

                      // Budget / Salary
                      _FieldLabel(
                          label: _isJobsCategory ? 'Salary' : 'Budget'),
                      if (_isJobsCategory) ...[
                        const SizedBox(height: 8),
                        SegmentedButton<String>(
                          segments: const [
                            ButtonSegment(
                              value: 'hourly',
                              label: Text('Hourly'),
                              icon: Icon(Icons.schedule, size: 16),
                            ),
                            ButtonSegment(
                              value: 'yearly',
                              label: Text('Yearly'),
                              icon: Icon(Icons.calendar_today, size: 16),
                            ),
                          ],
                          selected: {_salaryType},
                          onSelectionChanged: (s) =>
                              setState(() => _salaryType = s.first),
                          style: ButtonStyle(
                            visualDensity: VisualDensity.compact,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                        ),
                      ],
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: AppInputField(
                              controller: _budgetMinController,
                              label: 'Min',
                              hint: _isJobsCategory
                                  ? (_salaryType == 'yearly'
                                      ? '\$40,000'
                                      : '\$20')
                                  : '\$0',
                              keyboardType: TextInputType.number,
                              inputFormatters: [CurrencyInputFormatter()],
                              suffixWidget: _isJobsCategory
                                  ? Text(
                                      _salaryType == 'yearly' ? '/yr' : '/hr',
                                      style: const TextStyle(
                                        fontSize: 13,
                                        color: AppColors.greyMedium,
                                      ),
                                    )
                                  : null,
                            ),
                          ),
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 8),
                            child: Text('—',
                                style: TextStyle(color: AppColors.greyMedium)),
                          ),
                          Expanded(
                            child: AppInputField(
                              controller: _budgetMaxController,
                              label: 'Max',
                              hint: _isJobsCategory
                                  ? (_salaryType == 'yearly'
                                      ? '\$120,000'
                                      : '\$60')
                                  : '\$0',
                              keyboardType: TextInputType.number,
                              inputFormatters: [CurrencyInputFormatter()],
                              suffixWidget: _isJobsCategory
                                  ? Text(
                                      _salaryType == 'yearly' ? '/yr' : '/hr',
                                      style: const TextStyle(
                                        fontSize: 13,
                                        color: AppColors.greyMedium,
                                      ),
                                    )
                                  : null,
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
                      UrgencyChips(
                        value: _urgency,
                        onChanged: (v) => setState(() => _urgency = v),
                      ),

                      // Products condition (required by backend for any
                      // category under Products)
                      if (_selectedCategory?.isProducts == true) ...[
                        const SizedBox(height: 20),
                        _FieldLabel(label: 'Condition', required: true),
                        const SizedBox(height: 8),
                        ProductConditionPicker(
                          value: _productCondition,
                          onChanged: (v) =>
                              setState(() => _productCondition = v),
                        ),
                      ],

                      // B2B fields
                      if (ref.watch(marketplaceContextProvider) ==
                          MarketplaceContext.b2b) ...[
                        const SizedBox(height: 24),
                        Container(
                          height: 1,
                          color: AppColors.border,
                        ),
                        const SizedBox(height: 20),
                        const Text(
                          'B2B Details',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.black,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: AppInputField(
                                controller: _quantityController,
                                label: 'Bulk Quantity',
                                hint: '0',
                                keyboardType: TextInputType.number,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: AppInputField(
                                controller: _minOrderController,
                                label: 'Minimum Order',
                                hint: '0',
                                keyboardType: TextInputType.number,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _ToggleRow(
                          label: 'Invoice Available',
                          value: _invoiceAvailable,
                          onChanged: (v) =>
                              setState(() => _invoiceAvailable = v),
                        ),
                      ],

                      if (_error != null &&
                          !_error!.contains('category')) ...[
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
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  GradientButton(
                    text: 'Submit Post',
                    height: 52,
                    borderRadius: 20,
                    isLoading: _isPublishing,
                    onPressed: _isPublishing ? null : _publish,
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: _isPublishing
                              ? null
                              : () => _publish(status: 'draft'),
                          child: Container(
                            height: 44,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color:
                                    AppColors.primary.withValues(alpha: 0.3),
                                width: 1.5,
                              ),
                            ),
                            child: const Center(
                              child: Text(
                                'Save Draft',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
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

// ─── Toggle Row ──────────────────────────────────────────────────────

class _ToggleRow extends StatelessWidget {
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _ToggleRow({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: AppColors.black,
          ),
        ),
        Switch(
          value: value,
          onChanged: onChanged,
          activeTrackColor: AppColors.primary,
        ),
      ],
    );
  }
}
