# Batch 6: Seller Flows — Execution Plan

Restyle the seller-side experience (6 screens) to match the TSX designs.

## Prerequisites (from Batches 1–5 ✅)
- All shared widgets, gradient system
- Offer card pattern from Batch 3
- Transaction patterns from Batch 5

---

## Step 1: Restyle `seller_feed_screen.dart` (SellerFeedScreen)

**Design ref:** `SellerFeedScreen.tsx`
**Flutter file:** `mobile/lib/features/feed/presentation/screens/seller_feed_screen.dart`

**Keep:** Feed provider, category filters, distance-based sorting, navigation.

**Restyle:**
1. **Header:** "Find Work" title + search/filter icon buttons
2. **Market type toggle:** B2C / B2B / C2C horizontal pills
3. **Category filter chips:** Horizontal scroll, gradient active state
4. **Buyer request cards:** Each card:
   - Title (15px, w700)
   - Category + urgency chip row
   - Budget range (purple, bold)
   - Buyer info: rating + review count + distance
   - Offers count: "12 offers" with icon
   - Posted time ago
   - "Submit Offer" gradient button (right side or bottom)
   - Card: rounded-20, white, border, shadow
5. **Map toggle:** Switch between list and map view (icon button)
6. **Empty state:** "No matching requests" with adjust filters CTA

---

## Step 2: Create `seller_post_detail_screen.dart` (SellerPostDetailScreen)

**Design ref:** `SellerPostDetailScreen.tsx`
**Flutter file:** Restyle existing or new `mobile/lib/features/feed/presentation/screens/seller_post_detail_screen.dart`

**Restyle:**
1. Same info grid pattern as buyer's PostDetailScreen but from seller perspective
2. **Buyer info card:** Name + rating + location + member since
3. **Submit offer CTA:** Sticky bottom gradient button "Submit Offer"
4. **Existing offers indicator:** "12 sellers have already offered" notice
5. **Requirements section:** What the buyer needs (badges, verification, etc.)

---

## Step 3: Restyle `my_offers_screen.dart` (MyOffersScreen — seller's submitted offers)

**Design ref:** `MyOffersScreen.tsx`
**Flutter file:** `mobile/lib/features/offers/presentation/screens/my_offers_screen.dart`

**Keep:** `myOffersProvider`, navigation.

**Restyle:**
1. **Header:** "My Offers" (22px, w900) + stats
2. **Filter tabs:** All, Pending, Accepted, Declined, Countered
3. **Offer cards:** Each shows:
   - Post title + category chip
   - Your quote amount (bold)
   - Status badge
   - Buyer name + "they accepted!" if accepted
   - Counter amount if countered
   - Action: "Withdraw" for pending, "Start Work" for accepted
4. **Stats row:** Submitted, Accepted, Win Rate, Avg Response

---

## Step 4: Restyle `seller_profile_setup_screen.dart` (SellerProfileSetupScreen)

**Design ref:** `SellerProfileSetupScreen.tsx`
**Flutter file:** `mobile/lib/features/sellers/presentation/screens/seller_profile_setup_screen.dart`

**Keep:** Form state, file uploads, API submission.

**Restyle:**
1. **Progress stepper:** Multi-step form (Business Info → Services → Verification → Payment)
2. **Business info fields:** Name, description, phone, service radius (slider)
3. **Category selection:** Multi-select grid with icons
4. **Portfolio section:** Photo upload grid (3-col)
5. **Verification badges:** Which ones to pursue (selectable)
6. **Stripe connect CTA:** "Set Up Payments" button leading to onboarding

---

## Step 5: Restyle `seller_profile_screen.dart` (SellerProfileViewScreen)

**Design ref:** `SellerProfileViewScreen.tsx`
**Flutter file:** `mobile/lib/features/sellers/presentation/screens/seller_profile_screen.dart`

**Keep:** Profile provider, edit navigation.

**Restyle:**
1. **Hero section:** Large avatar + name + verification badges row
2. **Stats row:** Rating, Reviews, Jobs, Response Time
3. **About section:** Bio text
4. **Categories served:** Chips list
5. **Portfolio gallery:** Horizontal scroll of photos
6. **Reviews list:** Star rating + text + buyer name

---

## Step 6: Restyle `seller_earnings_screen.dart` (SellerEarningsScreen)

**Design ref:** `SellerEarningsScreen.tsx`
**Flutter file:** `mobile/lib/features/sellers/presentation/screens/seller_earnings_screen.dart`

**Keep:** Earnings provider, payout logic.

**Restyle:**
1. **Balance card:** Large gradient card showing available balance + pending
2. **Earnings chart:** Simple bar chart or line (weekly/monthly toggle)
3. **Recent payouts list:** Date, amount, status (paid/pending), Stripe reference
4. **Payout button:** "Request Payout" gradient (if threshold met)
5. **Fee breakdown section:** How fees are calculated

---

## Execution Order

| # | Task | Depends On | Complexity |
|---|------|-----------|------------|
| 1 | `seller_feed_screen.dart` | UrgencyChip, PostCard pattern | High |
| 2 | `seller_post_detail_screen.dart` | InfoGrid pattern from Batch 2 | Medium |
| 3 | `my_offers_screen.dart` | StatusBadge, filter tabs | High |
| 4 | `seller_profile_setup_screen.dart` | AppInputField | High |
| 5 | `seller_profile_screen.dart` | — | Medium |
| 6 | `seller_earnings_screen.dart` | — | Medium |

---

## Key Design Tokens (Batch 6)

| Token | Value | Usage |
|-------|-------|-------|
| Request card radius | 20px | Feed cards |
| Distance badge bg | `rgba(59,130,246,0.08)` | Location chip |
| Win rate color | `#059669` (green) | Stats |
| Balance card | gradient 135deg primary | Earnings hero |
| Payout row height | 60px | Payout list items |
| Portfolio thumbnail | 80×80, rounded-12 | Profile gallery |
| Stepper dot | 28px | Setup progress |
