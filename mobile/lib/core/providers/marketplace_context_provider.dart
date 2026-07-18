import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/secure_storage.dart';

const _storageKey = 'marketplace_context';

enum MarketplaceContext {
  b2c('b2c', 'B2C', 'Business to Customer'),
  b2b('b2b', 'B2B', 'Business to Business'),
  c2c('c2c', 'C2C', 'Customer to Customer');

  final String value;
  final String label;
  final String description;

  const MarketplaceContext(this.value, this.label, this.description);
}

class MarketplaceContextNotifier extends StateNotifier<MarketplaceContext> {
  MarketplaceContextNotifier() : super(MarketplaceContext.b2c) {
    _loadSaved();
  }

  Future<void> _loadSaved() async {
    final saved = await SecureStorage.read(_storageKey);
    if (saved != null) {
      state = MarketplaceContext.values.firstWhere(
        (e) => e.value == saved,
        orElse: () => MarketplaceContext.b2c,
      );
    }
  }

  Future<void> setContext(MarketplaceContext context) async {
    state = context;
    await SecureStorage.write(_storageKey, context.value);
  }
}

final marketplaceContextProvider =
    StateNotifierProvider<MarketplaceContextNotifier, MarketplaceContext>((ref) {
  return MarketplaceContextNotifier();
});
