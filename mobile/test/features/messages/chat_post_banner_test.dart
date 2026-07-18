import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:reverse_marketplace/features/messages/data/models/message_model.dart';
import 'package:reverse_marketplace/features/messages/presentation/widgets/chat_post_banner.dart';
import 'package:reverse_marketplace/features/posts/data/models/post_model.dart';
import 'package:reverse_marketplace/features/posts/providers/post_provider.dart';

Post _post({
  String buyerId = 'buyer-1',
  String status = 'active',
  String categorySlug = 'services',
}) {
  final now = DateTime(2026, 1, 1);
  return Post(
    id: 'post-1',
    buyerId: buyerId,
    categoryId: 'cat-1',
    title: 'Need a plumber for a leaking kitchen faucet',
    description: 'Kitchen faucet is dripping.',
    status: status,
    category: {'slug': categorySlug, 'name': 'Services'},
    createdAt: now,
    updatedAt: now,
  );
}

ConversationDetail _conversation({String? offerId = 'offer-1'}) {
  return ConversationDetail(
    id: 'conv-1',
    postId: 'post-1',
    offerId: offerId,
    status: 'active',
    participant1: MessageSender(id: 'buyer-1', firstName: 'Bea', lastName: 'Buyer'),
    participant2: MessageSender(id: 'seller-1', firstName: 'Sam', lastName: 'Seller'),
    post: PostSummary(id: 'post-1', title: 'Need a plumber for a leaking kitchen faucet'),
  );
}

Widget _subject({
  required String currentUserId,
  required Post post,
  ConversationDetail? conversation,
}) {
  return ProviderScope(
    overrides: [
      postDetailProvider('post-1').overrideWith((ref) async => post),
    ],
    child: MaterialApp(
      home: Scaffold(
        body: ChatPostBanner(
          conversation: conversation ?? _conversation(),
          currentUserId: currentUserId,
        ),
      ),
    ),
  );
}

void main() {
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  testWidgets('renders the hero banner with title, stages, and both actions',
      (tester) async {
    await tester.pumpWidget(_subject(currentUserId: 'buyer-1', post: _post()));
    await tester.pumpAndSettle();

    expect(find.text('Need a plumber for a leaking kitchen faucet'), findsOneWidget);
    expect(find.text('See Details'), findsOneWidget);
    expect(find.text('More Choices'), findsOneWidget);
    // Lifecycle labels.
    for (final s in ['Posted', 'Offer', 'Accepted', 'Escrow', 'Done']) {
      expect(find.text(s), findsOneWidget);
    }
  });

  testWidgets('buyer More Choices shows buyer-side actions', (tester) async {
    await tester.pumpWidget(_subject(currentUserId: 'buyer-1', post: _post()));
    await tester.pumpAndSettle();

    await tester.tap(find.text('More Choices'));
    await tester.pumpAndSettle();

    expect(find.text('View Offer'), findsOneWidget);
    expect(find.text('Counter Offer'), findsOneWidget);
    expect(find.text('Decline Offer'), findsOneWidget);
    expect(find.text('View Seller Profile'), findsOneWidget);
    expect(find.text('Save Seller'), findsOneWidget); // Services category
    expect(find.text('Report Seller'), findsOneWidget);
    // Seller-only entries absent for the buyer.
    expect(find.text('Withdraw Offer'), findsNothing);
    expect(find.text('View Buyer Profile'), findsNothing);
  });

  testWidgets('seller More Choices swaps to seller-side actions',
      (tester) async {
    await tester.pumpWidget(_subject(currentUserId: 'seller-1', post: _post()));
    await tester.pumpAndSettle();

    await tester.tap(find.text('More Choices'));
    await tester.pumpAndSettle();

    expect(find.text('View Offer'), findsOneWidget);
    expect(find.text('Withdraw Offer'), findsOneWidget);
    expect(find.text('View Buyer Profile'), findsOneWidget);
    expect(find.text('Report Buyer'), findsOneWidget);
    // Buyer-only entries absent for the seller.
    expect(find.text('Decline Offer'), findsNothing);
    expect(find.text('Save Seller'), findsNothing);
    expect(find.text('View Seller Profile'), findsNothing);
  });

  testWidgets('Save Seller hidden for non-Services categories', (tester) async {
    await tester.pumpWidget(
      _subject(currentUserId: 'buyer-1', post: _post(categorySlug: 'products')),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('More Choices'));
    await tester.pumpAndSettle();

    expect(find.text('Save Seller'), findsNothing);
  });

  testWidgets('offer actions hidden when no offer is linked', (tester) async {
    await tester.pumpWidget(
      _subject(
        currentUserId: 'buyer-1',
        post: _post(),
        conversation: _conversation(offerId: null),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('More Choices'));
    await tester.pumpAndSettle();

    expect(find.text('View Offer'), findsNothing);
    expect(find.text('Counter Offer'), findsNothing);
    expect(find.text('Decline Offer'), findsNothing);
    // Report is always available.
    expect(find.text('Report Seller'), findsOneWidget);
  });
}
