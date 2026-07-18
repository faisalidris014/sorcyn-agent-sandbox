# Frontend Restyling Plan

Restyle existing Flutter screens to match the Figma/TSX designs in `designs/src/app/components/`. All functionality (Riverpod state, GoRouter navigation, API calls, form validation) stays intact — only the widget trees and visual styling change.

## Current State

- **38 Flutter screens** built with full functionality
- **25 TSX design references** in `designs/` showing exact visual targets
- **Flutter theme** has correct colors but generic Material styling (no gradients, shadows, or custom inputs)
- **Font:** Inter (400/500/600/700) — needs adding to Flutter

## Design Token Map (from `designs/src/styles/theme.css`)

| Token | Value | Flutter |
|-------|-------|---------|
| Primary | `#7C3AED` | `AppColors.primary` (exists) |
| Secondary | `#A855F7` | `AppColors.secondaryPurple` (exists) |
| Background | `#FFFFFF` | `AppColors.background` (exists) |
| Card BG | `#F9FAFB` | `AppColors.surfaceVariant` (exists) |
| Foreground/Text | `#1F2937` | `AppColors.black` (exists) |
| Muted text | `#6B7280` | `AppColors.grey` (exists) |
| Grey medium | `#9CA3AF` | `AppColors.greyMedium` (exists) |
| Border | `#E5E7EB` | `AppColors.border` (exists) |
| Input BG (unfocused) | `#F9FAFB` | `AppColors.surfaceVariant` |
| Input BG (focused) | `rgba(124,58,237,0.03)` | Very subtle purple tint |
| Destructive | `#d4183d` | `AppColors.error` (close enough) |
| Success | `#10B981` | `AppColors.success` (exists) |
| Warning/Medium | `#F59E0B` / `#D97706` | `AppColors.warning` (exists) |
| Gradient | `linear-gradient(135deg, #7C3AED, #A855F7)` | `AppColors.primaryGradient` (exists) |
| Button shadow | `0 8px 20px rgba(124,58,237,0.35)` | Needs BoxShadow |
| Border radius (inputs) | 12px (rounded-xl) | Update from 12 to match |
| Border radius (buttons) | 24px (full rounded) | Update |
| Border radius (cards) | 16px (rounded-2xl) | Update |
| Border radius (welcome card) | 24px (rounded-3xl) | New |
| Input height | 52px | Update contentPadding |
| Button height | 56px | Already correct |
| Input border width | 1.5px | Update |

## Key Visual Patterns to Implement

1. **Gradient buttons** — Not flat ElevatedButton, use Container with gradient + boxShadow + InkWell
2. **Custom input fields** — 52px height, icon prefix, rounded-xl, border color transitions on focus
3. **Welcome card** — Gradient background + radial white overlay + stats row + CTA button
4. **Post cards** — surfaceVariant bg, subtle border, category chips, urgency badges, offer counts
5. **Bottom nav** — Custom (not BottomNavigationBar), with active gradient indicator dot below icon
6. **FAB** — Gradient circle with strong purple shadow
7. **Screen transitions** — Spring-based page animations (stiffness: 320, damping: 32)
8. **Active states** — `active:scale-[0.97]` equivalent = scale animation on tap
9. **Social auth buttons** — Outlined with icon + label, rounded-[14px]
10. **Status badges** — Colored dot + text in a subtle tinted pill

## Design-to-Flutter Screen Mapping

| Design TSX (`designs/src/app/components/`) | Flutter Screen (`mobile/lib/features/`) |
|---|---|
| `LoginScreen.tsx` | `auth/presentation/screens/login_screen.dart` |
| `RegisterScreen.tsx` | `auth/presentation/screens/register_screen.dart` |
| `ForgotPasswordScreen.tsx` | `auth/presentation/screens/forgot_password_screen.dart` |
| `EmailVerificationScreen.tsx` | `auth/presentation/screens/verify_email_screen.dart` |
| `BuyerDashboard.tsx` | `posts/presentation/screens/buyer_dashboard_screen.dart` |
| `MyPostsScreen.tsx` | `posts/presentation/screens/my_posts_screen.dart` |
| `PostDetailScreen.tsx` | `posts/presentation/screens/post_detail_screen.dart` |
| `CreatePostMethodScreen.tsx` | `posts/presentation/screens/create_post_method_screen.dart` |
| `AIPostCreationScreen.tsx` | `posts/presentation/screens/ai_post_creation_screen.dart` |
| `ManualPostCreationScreen.tsx` | `posts/presentation/screens/manual_post_creation_screen.dart` |
| `PostSuccessScreen.tsx` | `posts/presentation/screens/post_created_screen.dart` |
| `OffersListScreen.tsx` | `offers/presentation/screens/post_offers_screen.dart` |
| `SubmitOfferScreen.tsx` | `offers/presentation/screens/submit_offer_screen.dart` |
| `MyOffersScreen.tsx` | `offers/presentation/screens/my_offers_screen.dart` |
| `CompareOffersModal.tsx` | (new or inline in post_offers_screen) |
| `AcceptOfferModal.tsx` | (new or inline in post_offers_screen) |
| `TransactionsScreen.tsx` | `transactions/presentation/screens/transactions_screen.dart` |
| `TransactionDetailScreen.tsx` | `transactions/presentation/screens/transaction_detail_screen.dart` |
| `SellerTransactionDetailScreen.tsx` | `transactions/presentation/screens/seller_transaction_detail_screen.dart` |
| `SellerFeedScreen.tsx` | `feed/presentation/screens/seller_feed_screen.dart` |
| `SellerPostDetailScreen.tsx` | (seller view — may be same post_detail with role switch) |
| `MessagesScreen.tsx` | `messages/presentation/screens/conversations_screen.dart` |
| `ChatScreen.tsx` | `messages/presentation/screens/chat_screen.dart` |
| `ProfileScreen.tsx` | `profile/presentation/screens/profile_screen.dart` |

### Screens WITHOUT a design reference (style to match patterns):
- `reset_password_screen.dart` — follow ForgotPassword design patterns
- `offer_detail_screen.dart` — follow OffersList card expanded
- `seller_profile_screen.dart` — follow ProfileScreen patterns
- `seller_profile_setup_screen.dart` — follow RegisterScreen form patterns
- `stripe_onboard_screen.dart` — simple CTA screen
- `verification_screen.dart` — form + upload pattern
- `seller_earnings_screen.dart` — stats + list pattern
- `edit_profile_screen.dart` — follow form patterns
- `public_profile_screen.dart` — follow seller profile
- `payment_methods_screen.dart` — list + add pattern
- `settings_screen.dart` — grouped list pattern
- `language_settings_screen.dart` — radio list
- `help_support_screen.dart` — grouped list
- `notifications_screen.dart` — notification list cards
- `dispute_detail_screen.dart` — detail + evidence pattern
- `submit_review_screen.dart` — form + star rating

---

## Execution Batches

### Batch 1: Foundation + Auth (5 screens)

**Goal:** Establish the design system in Flutter, then apply to auth flow.

**Step 1 — Update theme foundation:**
- Add Inter font to `pubspec.yaml` and `app_theme.dart`
- Update `app_theme.dart` border radii, input decoration, button styles
- Add to `app_colors.dart` if needed: focused input bg, shadow colors

**Step 2 — Create shared design widgets** in `mobile/lib/shared/widgets/`:
- `gradient_button.dart` — Container with gradient, boxShadow, InkWell, loading state
- `app_input_field.dart` — 52px height, icon prefix, focus border color animation, rounded-xl
- `social_auth_button.dart` — Outlined button with icon (Google/Apple)
- Update `app_logo.dart` — Gradient rounded square with lightning bolt icon + "Sorcyn" text

**Step 3 — Restyle auth screens** (keep all Riverpod/GoRouter logic, replace widget tree):
- `login_screen.dart` — match `LoginScreen.tsx` exactly
- `register_screen.dart` — match `RegisterScreen.tsx`
- `forgot_password_screen.dart` — match `ForgotPasswordScreen.tsx`
- `reset_password_screen.dart` — follow forgot password patterns
- `verify_email_screen.dart` — match `EmailVerificationScreen.tsx`

---

### Batch 2: Buyer Dashboard + Posts (8 screens)

**Goal:** Restyle the main buyer experience.

**Step 4 — Create shared widgets:**
- `bottom_nav_bar.dart` — Custom widget with gradient active indicator, badge support
- `welcome_card.dart` — Gradient card with radial overlay, stats row, CTA
- `post_card.dart` — Card with category chip, urgency badge, offer count, budget range
- `status_badge.dart` — Colored dot + label pill
- `urgency_chip.dart` — Color-coded chip (High/Medium/Low)
- `gradient_fab.dart` — Gradient circle FAB with shadow

**Step 5 — Restyle screens:**
- `buyer_dashboard_screen.dart` — match `BuyerDashboard.tsx` (home tab, bottom nav, FAB)
- `my_posts_screen.dart` — match `MyPostsScreen.tsx`
- `post_detail_screen.dart` — match `PostDetailScreen.tsx`
- `create_post_method_screen.dart` — match `CreatePostMethodScreen.tsx`
- `ai_post_creation_screen.dart` — match `AIPostCreationScreen.tsx`
- `manual_post_creation_screen.dart` — match `ManualPostCreationScreen.tsx`
- `post_created_screen.dart` — match `PostSuccessScreen.tsx`

---

### Batch 3: Offers + Transactions (7 screens)

**Goal:** Restyle offer comparison and transaction tracking.

**Step 6 — Create shared widgets:**
- `offer_card.dart` — Seller info, price, timeline, accept/decline actions
- `transaction_card.dart` — Status indicator, amount, counterparty info
- `compare_offers_sheet.dart` — Bottom sheet or modal for side-by-side comparison

**Step 7 — Restyle screens:**
- `post_offers_screen.dart` — match `OffersListScreen.tsx`
- `offer_detail_screen.dart` — expanded offer view
- `submit_offer_screen.dart` — match `SubmitOfferScreen.tsx`
- `my_offers_screen.dart` — match `MyOffersScreen.tsx`
- `transactions_screen.dart` — match `TransactionsScreen.tsx`
- `transaction_detail_screen.dart` — match `TransactionDetailScreen.tsx`
- `seller_transaction_detail_screen.dart` — match `SellerTransactionDetailScreen.tsx`

---

### Batch 4: Seller Flow (5 screens)

**Goal:** Restyle seller-specific screens.

**Step 8 — Restyle screens:**
- `seller_feed_screen.dart` — match `SellerFeedScreen.tsx`
- `seller_profile_setup_screen.dart` — form with design input fields
- `seller_earnings_screen.dart` — stats cards + payout list
- `verification_screen.dart` — upload UI + badge status
- `stripe_onboard_screen.dart` — CTA with gradient button

---

### Batch 5: Messaging + Profile + Settings (8 screens)

**Goal:** Restyle communication and account management.

**Step 9 — Restyle screens:**
- `conversations_screen.dart` — match `MessagesScreen.tsx`
- `chat_screen.dart` — match `ChatScreen.tsx`
- `profile_screen.dart` — match `ProfileScreen.tsx`
- `edit_profile_screen.dart` — form with design inputs
- `public_profile_screen.dart` — seller public view
- `settings_screen.dart` — grouped list sections
- `notifications_screen.dart` — notification cards
- `language_settings_screen.dart` — selection list

---

### Batch 6: Polish + Animations

**Goal:** Add micro-interactions and transitions.

**Step 10:**
- Spring-based page route transitions (Hero animations where appropriate)
- Button press scale animations (0.97 scale on tap down)
- Card tap feedback
- Loading skeletons (shimmer) for lists
- Pull-to-refresh animations
- Bottom sheet spring animations

---

## Key Principles

1. **Never break functionality** — Keep all providers, services, API calls, navigation intact
2. **Read the TSX first** — Before restyling any screen, read the corresponding design component
3. **Extract shared widgets** — Don't copy-paste styles; build reusable design components
4. **Match exactly** — Colors, spacing, border radii, shadows, font sizes from the designs
5. **Test on both platforms** — Verify iOS and Android after each batch
6. **One screen at a time** — Complete and verify each screen before moving to next

## Flutter-Specific Notes

- Use `google_fonts` package for Inter font family
- Use `BoxDecoration` with `gradient` + `boxShadow` for gradient buttons (not ElevatedButton)
- Use `AnimatedContainer` or `TweenAnimationBuilder` for focus state transitions
- Use `CustomScrollView` + `SliverAppBar` where designs show scrollable headers
- Use `PageRouteBuilder` with spring curves for screen transitions
- Badge package or custom widget for notification badges
