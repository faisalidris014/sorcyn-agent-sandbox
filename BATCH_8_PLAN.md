# Batch 8: Misc Screens — Execution Plan

Restyle the remaining standalone screens (5 screens) to match the TSX designs.

## Prerequisites (from Batches 1–7 ✅)
- All shared widgets and patterns established

---

## Step 1: Restyle `notifications_screen.dart` (NotificationsScreen)

**Design ref:** `NotificationsScreen.tsx`
**Flutter file:** `mobile/lib/features/notifications/presentation/screens/notifications_screen.dart`

**Keep:** Notifications provider, mark read, navigation to related content.

**Restyle:**
1. **Header:** "Notifications" + "Mark all read" text button (right)
2. **Filter tabs:** All, Offers, Transactions, Messages, System
3. **Notification cards:** Each item:
   - Icon in colored circle (type-specific: offer=purple, transaction=green, message=blue)
   - Title (13px, w600) + description (12px, grey)
   - Time ago (11px, right)
   - Unread indicator: left purple accent bar (3px)
   - Tap navigates to related content
4. **Grouped by date:** "Today", "Yesterday", "This Week", "Earlier" section headers
5. **Empty state:** Bell icon + "You're all caught up!"
6. **Swipe to dismiss:** Swipe left to mark read / delete

---

## Step 2: Restyle `submit_review_screen.dart` (SubmitReviewScreen)

**Design ref:** `SubmitReviewScreen.tsx`
**Flutter file:** `mobile/lib/features/reviews/presentation/screens/submit_review_screen.dart`

**Keep:** Review submission logic, photo upload, rating state.

**Restyle:**
1. **Transaction summary card:** Post title + counterparty name + amount
2. **Star rating input:** 5 large tappable stars (40px each)
   - Filled: gradient (#F59E0B)
   - Empty: `#E5E7EB` outline
   - Label below changes: "Terrible" / "Poor" / "Okay" / "Good" / "Excellent"
3. **Review text area:** 6 rows, character counter, rounded-16
4. **Before/After photos section:**
   - Two photo slots: "Before" + "After" labels
   - Upload placeholder: dashed border + camera icon
   - Filled: thumbnail with checkmark overlay
5. **Would recommend toggle:** "Would you recommend this seller?" + styled switch
6. **Submit button:** Gradient, "Submit Review"
7. **Skip option:** "Skip for now" text button (review reminder at day 7)

---

## Step 3: Restyle `verification_screen.dart` (VerificationScreen)

**Design ref:** `VerificationScreen.tsx`
**Flutter file:** `mobile/lib/features/sellers/presentation/screens/verification_screen.dart`

**Keep:** Verification provider, document upload, status polling.

**Restyle:**
1. **Badge grid:** 4 verification badges displayed as large cards
   - ID Verified, Licensed, Insured, Background Checked
   - Each card: Icon + title + status (Not Started / Pending / Verified)
   - Verified: green checkmark + "Verified" label
   - Pending: yellow spinner + "Under Review"
   - Not started: grey outline + "Get Verified" CTA
2. **Document upload section** (per badge):
   - Required documents list
   - Upload area with dashed border
   - Uploaded file with name + checkmark
3. **Benefits section:** Why verification matters (trust, more offers)
4. **Submit button:** Per badge "Submit for Review"

---

## Step 4: Restyle `stripe_onboard_screen.dart` (StripeOnboardScreen)

**Design ref:** `StripeOnboardScreen.tsx`
**Flutter file:** `mobile/lib/features/sellers/presentation/screens/stripe_onboard_screen.dart`

**Keep:** Stripe Connect URL generation, WebView/browser redirect, status check.

**Restyle:**
1. **Illustration:** Payment/money flow graphic
2. **Heading:** "Set Up Payments" + subtitle about getting paid
3. **Benefits list:** Bullet points (fast payouts, secure, low fees)
4. **Stripe info card:** Rounded-16, Stripe logo + "Powered by Stripe" + security note
5. **CTA button:** Gradient "Connect with Stripe"
6. **Already connected state:** Green checkmark + account info + "Manage" button
7. **Loading state:** While redirect is processing

---

## Step 5: Restyle Splash Screen (if applicable)

**Design ref:** `SplashScreen.tsx`
**Flutter file:** Check if native splash or Flutter — likely handled by `flutter_native_splash`

**Restyle (if Flutter-rendered):**
1. **Centered logo:** AppLogo at 80px with gradient shadow
2. **App name:** "Sorcyn" below logo (24px, w800)
3. **Loading indicator:** Small gradient spinner or progress bar
4. **Background:** Pure white

---

## Execution Order

| # | Task | Depends On | Complexity |
|---|------|-----------|------------|
| 1 | `notifications_screen.dart` | StatusBadge pattern | Medium |
| 2 | `submit_review_screen.dart` | — | Medium |
| 3 | `verification_screen.dart` | — | Medium |
| 4 | `stripe_onboard_screen.dart` | — | Low–Medium |
| 5 | Splash screen (if needed) | AppLogo | Low |

---

## Key Design Tokens (Batch 8)

| Token | Value | Usage |
|-------|-------|-------|
| Notification icon circle | 40px | Type indicator |
| Unread accent bar | 3px, purple | Left of unread items |
| Star rating size | 40px | Review input |
| Star filled color | `#F59E0B` | Rating stars |
| Star empty color | `#E5E7EB` | Rating stars |
| Badge card size | ~150×150px | Verification grid |
| Verified color | `#10B981` | Green states |
| Pending color | `#F59E0B` | Yellow states |
| Stripe brand blue | `#635BFF` | Stripe references |

---

## After All Batches

Once Batches 3–8 are complete, the full frontend restyling is done:
- **38 screens** fully restyled to match TSX designs
- **10+ shared widgets** created for consistency
- All functionality preserved (providers, navigation, API calls)
- Ready for integration testing and production polish (Session 14–15)
