import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/category_model.dart';
import '../data/repositories/category_repository.dart';

final categoryRepositoryProvider = Provider<CategoryRepository>((ref) {
  return CategoryRepository();
});

final categoryTreeProvider =
    FutureProvider<List<CategoryTreeNode>>((ref) async {
  final repo = ref.read(categoryRepositoryProvider);
  return repo.getCategoryTree();
});
