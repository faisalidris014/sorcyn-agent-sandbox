# Batch 3: Offers — Execution Plan

Restyle the offers experience (5 screens + 2 modals) to match the TSX designs in `designs/src/app/components/`.

## Prerequisites (from Batches 1–2 ✅)
- `GradientButton`, `AppInputField`, `StatusBadge`, `UrgencyChip`
- Updated `AppColors`, `AppTheme`, gradient system
- `PostCard` with accent bar styling

---

## Step 1: Restyle `post_offers_screen.dart` (OffersListScreen)

**Design ref:** `OffersListScreen.tsx`
**Flutter file:** `mobile/lib/features/offers/presentation/screens/post_offers_screen.dart`

**Keep:** `offersProvider`, accept/decline/counter logic, navigation to offer detail.

**Restyle:**
1. **Header:** Post title summary card at top (title, budget badge, offer count)
2. **Filter chips:** Horizontal scroll — All, Verified, Top Seller, Pro, Nearby
   - Active: gradient bg, white text, shadow
   - Inactive: white bg, border
3. **Sort dropdown:** Purple-bordered pill (Lowest Price, Highest Rated, Fastest, Most Reviews, Newest)
4. **Offer cards:** Each card shows:
   - Seller avatar (gradient circle with initials) + name + badges (Verified, TopSeller, Pro)
   - Star rating + review count
   - Quote amount (large, bold, purple) + timeline
   - Message preview (2 lines, grey)
   - Bottom row: "View Details" outline btn + "Accept" gradient btn
   - Card: rounded-20, white bg, 1.5px border, shadow
5. **Compare button:** Floating action at bottom when 2+ offers selected (checkbox on cards)
6. **Empty state:** No offers yet illustration + "Share your post" CTA
7. **Staggered entrance:** Each card delayed by 55ms

---

## Step 2: Restyle `offer_detail_screen.dart` (OfferDetailScreen)

**Design ref:** `OfferDetailScreen.tsx`
**Flutter file:** `mobile/lib/features/offers/presentation/screens/offer_detail_screen.dart`

**Keep:** `offerDetailProvider`, accept/decline/counter actions.

**Restyle:**
1. **Seller hero section:**
   - Large avatar (64px gradient circle)
   - Name + Verified badge
   - Stats row: Rating, Reviews, Jobs Done, Response Time (4-col)
   - Completion rate bar (gradient fill)
2. **Quote card:** Rounded-20, purple-tinted bg
   - Amount: large 28px bold
   - Fee line: "+5% platform fee = $X total"
   - Timeline badge
3. **Message section:** Full seller message, rounded container, light bg
4. **Action buttons at bottom:**
   - "Accept Offer" — gradient, full width, 54px
   - Row: "Counter" (outline) + "Decline" (red outline)
   - "Message Seller" text button
5. **Status indicator:** If accepted/declined/countered — show status banner at top

---

## Step 3: Restyle `submit_offer_screen.dart` (SubmitOfferScreen — seller side)

**Design ref:** `SubmitOfferScreen.tsx`
**Flutter file:** `mobile/lib/features/offers/presentation/screens/submit_offer_screen.dart`

**Keep:** Form validation, submit logic, navigation.

**Restyle:**
1. **Post summary card** at top: title, category, budget range, timeline, location, existing offers count
2. **Pricing type selector:** 4 horizontal pills (Flat Rate, Hourly, Per Item, Custom)
   - Selected: purple border + purple tint
   - Icon + label for each
3. **Quote amount field:** Large input, `$` prefix, real-time platform fee calculator below
   - Fee breakdown: "Your quote: $X | Platform fee (8%): $Y | You earn: $Z"
   - Color-coded: green for earnings
4. **Start date & timeline fields:** Styled dropdowns/inputs
5. **Message textarea:** 6 rows, character counter (max 1000), rounded-16
6. **Attachments:** Upload area with dashed border, file list with remove buttons
7. **Bottom bar:** "Preview" outline + "Submit Offer" gradient

---

## Step 4: Create `compare_offers_modal.dart` (CompareOffersModal)

**Design ref:** `CompareOffersModal.tsx`
**Flutter file:** `mobile/lib/features/offers/presentation/widgets/compare_offers_modal.dart`

**New widget — bottom sheet modal.**

1. **Header:** "Compare Offers" title + close button
2. **Seller columns:** 2-3 side-by-side columns, each with avatar + name
3. **Comparison rows:** Price, Timeline, Rating, Reviews, Jobs Done, Response Time, Distance, Badges
   - Highlight best value in each row (green bg or bold)
   - Price row: color red if over budget, green if under
4. **Bottom CTA:** "Accept [SellerName]'s Offer" gradient button (for highlighted winner)
5. **Swipe horizontally** if 3 sellers (PageView or horizontal scroll)

---

## Step 5: Create `accept_offer_modal.dart` (AcceptOfferModal)

**Design ref:** `AcceptOfferModal.tsx`
**Flutter file:** `mobile/lib/features/offers/presentation/widgets/accept_offer_modal.dart`

**New widget — bottom sheet modal.**

1. **Seller summary:** Avatar + name + rating
2. **Price breakdown card:**
   - Quote amount
   - Platform fee (5%)
   - Total you pay
   - Escrow note: "Funds held securely until completion"
3. **Payment method selector:** Saved cards (Visa/MC icons) + Apple Pay/Google Pay + Add new
4. **Terms checkbox:** "I agree to the escrow terms"
5. **Confirm button:** Gradient, "Confirm & Pay $X"
6. **Security badges:** Lock icon + "256-bit encryption" + "Stripe secured"

---

## Step 6: Create `counter_offer_modal.dart` (CounterOfferModal)

**Design ref:** `CounterOfferModal.tsx`
**Flutter file:** `mobile/lib/features/offers/presentation/widgets/counter_offer_modal.dart`

**New widget — bottom sheet modal.**

1. **Original offer reference:** Seller name/avatar + original amount (struck through)
2. **Counter amount input:** Large, centered, `$` prefix
   - Warning if < 50% of original: "This is significantly lower than the offer"
3. **Message field:** Required, 4 rows, "Explain your counter..."
4. **Submit button:** Gradient, disabled until amount + message filled
5. **Cancel text button**

---

## Execution Order

| # | Task | Depends On | Complexity |
|---|------|-----------|------------|
| 1 | Restyle `post_offers_screen.dart` | StatusBadge, GradientButton | High |
| 2 | Restyle `offer_detail_screen.dart` | — | High |
| 3 | Restyle `submit_offer_screen.dart` | AppInputField | High |
| 4 | `compare_offers_modal.dart` | — | Medium |
| 5 | `accept_offer_modal.dart` | — | Medium |
| 6 | `counter_offer_modal.dart` | — | Low–Medium |

---

## Key Design Tokens (Batch 3 additions)

| Token | Value | Usage |
|-------|-------|-------|
| Offer card radius | 20px | All offer cards |
| Quote font size | 28px | Offer detail hero |
| Fee text color | `#059669` (green) | Earnings display |
| Warning text color | `#D97706` | Below-half counter warning |
| Seller avatar size | 52px (list) / 64px (detail) | Offer screens |
| Comparison best highlight | `#ECFDF5` bg | Compare modal |
| Payment card height | 56px | Accept modal selector |
| Action button height | 54px (primary) / 44px (secondary) | Bottom bars |

---

## Principles (same as prior batches)

1. **Never break functionality** — preserve all providers, services, API calls, navigation
2. **Read the TSX first** — reference design before touching each screen
3. **Extract shared widgets** — star rating row, seller avatar, fee breakdown
4. **Match exactly** — colors, spacing, radii, shadows from designs
5. **One screen at a time** — complete and verify before moving on
6. **Animations** — staggered card entrance, modal slide-up with spring
