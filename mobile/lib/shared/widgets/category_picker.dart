import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../features/categories/data/models/category_model.dart';
import '../../features/categories/providers/category_provider.dart';

class CategoryPickerResult {
  final String categoryId;
  final String categoryName;
  final String categorySlug;
  final String? subcategoryId;
  final String? subcategoryName;
  final String? subcategorySlug;

  CategoryPickerResult({
    required this.categoryId,
    required this.categoryName,
    required this.categorySlug,
    this.subcategoryId,
    this.subcategoryName,
    this.subcategorySlug,
  });

  String get displayName =>
      subcategoryName != null ? '$categoryName > $subcategoryName' : categoryName;

  bool get isProducts => categorySlug == 'products';
}

Future<CategoryPickerResult?> showCategoryPicker(BuildContext context) async {
  return showModalBottomSheet<CategoryPickerResult>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (context) => const _CategoryPickerSheet(),
  );
}

/// Multi-select picker for the seller add-category flow (#338): choose several
/// subcategories within a single major (e.g. Services or Jobs). Returns the
/// selected subcategory results, or null if dismissed.
Future<List<CategoryPickerResult>?> showMultiCategoryPicker(
  BuildContext context, {
  required String fixedMajorSlug,
  List<String> initiallySelected = const [],
}) async {
  return showModalBottomSheet<List<CategoryPickerResult>>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (context) => _CategoryPickerSheet(
      multiSelect: true,
      fixedMajorSlug: fixedMajorSlug,
      initiallySelected: initiallySelected,
    ),
  );
}

class _CategoryPickerSheet extends ConsumerStatefulWidget {
  final bool multiSelect;
  final String? fixedMajorSlug;
  final List<String> initiallySelected;

  const _CategoryPickerSheet({
    this.multiSelect = false,
    this.fixedMajorSlug,
    this.initiallySelected = const [],
  });

  @override
  ConsumerState<_CategoryPickerSheet> createState() =>
      _CategoryPickerSheetState();
}

class _CategoryPickerSheetState extends ConsumerState<_CategoryPickerSheet> {
  CategoryTreeNode? _selectedParent;
  late final Set<String> _selectedSubIds = {...widget.initiallySelected};

  @override
  Widget build(BuildContext context) {
    final treeAsync = ref.watch(categoryTreeProvider);

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      maxChildSize: 0.9,
      minChildSize: 0.4,
      expand: false,
      builder: (context, scrollController) {
        return Column(
          children: [
            // Handle
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.greyMedium,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Title
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  if (_selectedParent != null && !widget.multiSelect)
                    IconButton(
                      icon: const Icon(Icons.arrow_back),
                      onPressed: () =>
                          setState(() => _selectedParent = null),
                    ),
                  Text(
                    widget.multiSelect
                        ? 'Select subcategories'
                        : (_selectedParent?.name ?? 'Select Category'),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            // Content
            Expanded(
              child: treeAsync.when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Failed to load categories'),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () =>
                            ref.invalidate(categoryTreeProvider),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
                data: (tree) {
                  if (widget.multiSelect && widget.fixedMajorSlug != null) {
                    CategoryTreeNode? parent;
                    for (final n in tree) {
                      if (n.slug == widget.fixedMajorSlug) {
                        parent = n;
                        break;
                      }
                    }
                    if (parent == null) {
                      return const Center(
                        child: Text('Category not available'),
                      );
                    }
                    return _buildMultiSubcategoryList(scrollController, parent);
                  }
                  if (_selectedParent != null) {
                    return _buildSubcategoryList(
                      scrollController,
                      _selectedParent!,
                    );
                  }
                  return _buildParentList(scrollController, tree);
                },
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildParentList(
    ScrollController controller,
    List<CategoryTreeNode> tree,
  ) {
    return ListView.builder(
      controller: controller,
      itemCount: tree.length,
      itemBuilder: (context, index) {
        final node = tree[index];
        final hasChildren = node.children.isNotEmpty;
        return ListTile(
          leading: Icon(
            _categoryIcon(node.icon),
            color: AppColors.primary,
          ),
          title: Text(node.name),
          subtitle: node.description != null
              ? Text(
                  node.description!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                )
              : null,
          trailing: hasChildren
              ? const Icon(Icons.chevron_right)
              : null,
          onTap: () {
            if (hasChildren) {
              setState(() => _selectedParent = node);
            } else {
              Navigator.of(context).pop(CategoryPickerResult(
                categoryId: node.id,
                categoryName: node.name,
                categorySlug: node.slug,
              ));
            }
          },
        );
      },
    );
  }

  Widget _buildSubcategoryList(
    ScrollController controller,
    CategoryTreeNode parent,
  ) {
    return ListView.builder(
      controller: controller,
      itemCount: parent.children.length,
      itemBuilder: (context, index) {
        final child = parent.children[index];
        return ListTile(
          leading: Icon(
            _categoryIcon(child.icon),
            color: AppColors.primaryLight,
          ),
          title: Text(child.name),
          subtitle: child.description != null
              ? Text(
                  child.description!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                )
              : null,
          onTap: () {
            Navigator.of(context).pop(CategoryPickerResult(
              categoryId: parent.id,
              categoryName: parent.name,
              categorySlug: parent.slug,
              subcategoryId: child.id,
              subcategoryName: child.name,
              subcategorySlug: child.slug,
            ));
          },
        );
      },
    );
  }

  Widget _buildMultiSubcategoryList(
    ScrollController controller,
    CategoryTreeNode parent,
  ) {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            controller: controller,
            itemCount: parent.children.length,
            itemBuilder: (context, index) {
              final child = parent.children[index];
              final selected = _selectedSubIds.contains(child.id);
              return CheckboxListTile(
                value: selected,
                activeColor: AppColors.primary,
                controlAffinity: ListTileControlAffinity.leading,
                title: Text(child.name),
                subtitle: child.description != null
                    ? Text(
                        child.description!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      )
                    : null,
                onChanged: (v) {
                  setState(() {
                    if (v == true) {
                      _selectedSubIds.add(child.id);
                    } else {
                      _selectedSubIds.remove(child.id);
                    }
                  });
                },
              );
            },
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
                onPressed: _selectedSubIds.isEmpty
                    ? null
                    : () {
                        final results = parent.children
                            .where((c) => _selectedSubIds.contains(c.id))
                            .map((c) => CategoryPickerResult(
                                  categoryId: parent.id,
                                  categoryName: parent.name,
                                  categorySlug: parent.slug,
                                  subcategoryId: c.id,
                                  subcategoryName: c.name,
                                  subcategorySlug: c.slug,
                                ))
                            .toList();
                        Navigator.of(context).pop(results);
                      },
                child: Text('Done (${_selectedSubIds.length})'),
              ),
            ),
          ),
        ),
      ],
    );
  }

  IconData _categoryIcon(String? icon) {
    return switch (icon) {
      'shopping_bag' => Icons.shopping_bag,
      'build' => Icons.build,
      'work' => Icons.work,
      'local_shipping' => Icons.local_shipping,
      'cleaning_services' => Icons.cleaning_services,
      'plumbing' => Icons.plumbing,
      'electrical_services' => Icons.electrical_services,
      'carpenter' => Icons.carpenter,
      'yard' => Icons.yard,
      'water_drop' => Icons.water_drop,
      'grass' => Icons.grass,
      'pest_control' => Icons.pest_control,
      'home_repair_service' => Icons.home_repair_service,
      'computer' => Icons.computer,
      'brush' => Icons.brush,
      'camera_alt' => Icons.camera_alt,
      'school' => Icons.school,
      'engineering' => Icons.engineering,
      'medical_services' => Icons.medical_services,
      'restaurant' => Icons.restaurant,
      _ => Icons.category,
    };
  }
}
