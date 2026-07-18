// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'category_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Category _$CategoryFromJson(Map<String, dynamic> json) => Category(
  id: json['id'] as String,
  slug: json['slug'] as String,
  name: json['name'] as String,
  description: json['description'] as String?,
  icon: json['icon'] as String?,
  parentCategoryId: json['parentCategoryId'] as String?,
  sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
  isActive: json['isActive'] as bool? ?? true,
  enabledInMvp: json['enabledInMvp'] as bool? ?? false,
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$CategoryToJson(Category instance) => <String, dynamic>{
  'id': instance.id,
  'slug': instance.slug,
  'name': instance.name,
  'description': instance.description,
  'icon': instance.icon,
  'parentCategoryId': instance.parentCategoryId,
  'sortOrder': instance.sortOrder,
  'isActive': instance.isActive,
  'enabledInMvp': instance.enabledInMvp,
  'createdAt': instance.createdAt?.toIso8601String(),
};

CategoryTreeNode _$CategoryTreeNodeFromJson(Map<String, dynamic> json) =>
    CategoryTreeNode(
      id: json['id'] as String,
      slug: json['slug'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      icon: json['icon'] as String?,
      parentCategoryId: json['parentCategoryId'] as String?,
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] as bool? ?? true,
      enabledInMvp: json['enabledInMvp'] as bool? ?? false,
      children:
          (json['children'] as List<dynamic>?)
              ?.map((e) => CategoryTreeNode.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$CategoryTreeNodeToJson(CategoryTreeNode instance) =>
    <String, dynamic>{
      'id': instance.id,
      'slug': instance.slug,
      'name': instance.name,
      'description': instance.description,
      'icon': instance.icon,
      'parentCategoryId': instance.parentCategoryId,
      'sortOrder': instance.sortOrder,
      'isActive': instance.isActive,
      'enabledInMvp': instance.enabledInMvp,
      'children': instance.children,
    };
