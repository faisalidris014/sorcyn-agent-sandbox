import 'package:json_annotation/json_annotation.dart';

part 'category_model.g.dart';

@JsonSerializable()
class Category {
  final String id;
  final String slug;
  final String name;
  final String? description;
  final String? icon;
  final String? parentCategoryId;
  final int sortOrder;
  final bool isActive;
  final bool enabledInMvp;
  final DateTime? createdAt;

  Category({
    required this.id,
    required this.slug,
    required this.name,
    this.description,
    this.icon,
    this.parentCategoryId,
    this.sortOrder = 0,
    this.isActive = true,
    this.enabledInMvp = false,
    this.createdAt,
  });

  factory Category.fromJson(Map<String, dynamic> json) =>
      _$CategoryFromJson(json);
  Map<String, dynamic> toJson() => _$CategoryToJson(this);

  bool get isTopLevel => parentCategoryId == null;
}

@JsonSerializable()
class CategoryTreeNode {
  final String id;
  final String slug;
  final String name;
  final String? description;
  final String? icon;
  final String? parentCategoryId;
  final int sortOrder;
  final bool isActive;
  final bool enabledInMvp;
  final List<CategoryTreeNode> children;

  CategoryTreeNode({
    required this.id,
    required this.slug,
    required this.name,
    this.description,
    this.icon,
    this.parentCategoryId,
    this.sortOrder = 0,
    this.isActive = true,
    this.enabledInMvp = false,
    this.children = const [],
  });

  factory CategoryTreeNode.fromJson(Map<String, dynamic> json) =>
      _$CategoryTreeNodeFromJson(json);
  Map<String, dynamic> toJson() => _$CategoryTreeNodeToJson(this);

  bool get hasChildren => children.isNotEmpty;
}
