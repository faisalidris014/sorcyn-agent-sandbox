# Batch 7: Profile & Settings — Execution Plan

Restyle the profile, settings, and account management screens (8 screens) to match the TSX designs.

## Prerequisites (from Batches 1–6 ✅)
- All shared widgets, AppInputField, GradientButton
- Avatar gradient pattern, badge styling

---

## Step 1: Restyle `profile_screen.dart` (ProfileScreen)

**Design ref:** `ProfileScreen.tsx`
**Flutter file:** `mobile/lib/features/profile/presentation/screens/profile_screen.dart`

**Keep:** Auth provider, mode switching, sign out, navigation.

**Restyle:**
1. **Profile hero:** Large avatar (80px gradient circle with initials) + name + email
2. **Member since badge:** Purple-tinted pill
3. **Mode switch:** Buyer/Seller toggle card with animated slider
4. **Marketplace context selector:** B2C / B2B / C2C radio group (styled cards)
5. **Menu sections:** Grouped cards with icon + label + chevron
   - Account: Edit Profile, Verification, Payment Methods
   - Preferences: Notifications, Language, Dark Mode
   - Seller: Seller Profile, Earnings, Stripe (if seller mode)
   - Support: Help & Support, About, Terms
6. **Sign out button:** Red-tinted outline at bottom
7. **Delete account:** Text button with confirmation modal
8. **Section separators:** 12px gaps between groups

---

## Step 2: Restyle `edit_profile_screen.dart` (EditProfileScreen)

**Design ref:** `EditProfileScreen.tsx`
**Flutter file:** `mobile/lib/features/profile/presentation/screens/edit_profile_screen.dart`

**Keep:** User provider, update API, image upload.

**Restyle:**
1. **Avatar section:** Large avatar with "Change Photo" overlay button (camera icon)
2. **Form fields:** AppInputField for first name, last name, phone, bio
3. **Location field:** With map pin icon + autocomplete
4. **Save button:** Sticky bottom gradient button
5. **Discard changes:** "Cancel" outline or text button

---

## Step 3: Restyle `public_profile_screen.dart` (PublicProfileScreen)

**Design ref:** `PublicProfileScreen.tsx`
**Flutter file:** `mobile/lib/features/profile/presentation/screens/public_profile_screen.dart`

**Keep:** Public profile provider, navigation.

**Restyle:**
1. **Profile header:** Avatar + name + join date + location
2. **Verification badges row:** ID Verified, Licensed, Insured, Background Checked
3. **Stats card:** Rating, Reviews, Completed Jobs
4. **Reviews section:** List of reviews with star ratings + before/after photos
5. **Report button:** Small text button at bottom

---

## Step 4: Restyle `settings_screen.dart` (SettingsScreen)

**Design ref:** `SettingsScreen.tsx`
**Flutter file:** `mobile/lib/features/settings/presentation/screens/settings_screen.dart`

**Keep:** Settings provider, preference toggles.

**Restyle:**
1. **Section cards:** Rounded-16, grouped
2. **Toggle rows:** Label + description + custom switch (gradient track when active)
3. **Navigation rows:** Label + current value + chevron
4. **Sections:** Notifications, Privacy, Display, Account
5. **Danger zone:** Delete account with red styling

---

## Step 5: Restyle `language_settings_screen.dart` (LanguageSettingsScreen)

**Design ref:** `LanguageSettingsScreen.tsx`
**Flutter file:** `mobile/lib/features/settings/presentation/screens/language_settings_screen.dart`

**Keep:** Locale provider, language list.

**Restyle:**
1. **Search bar:** Rounded-14, filter languages
2. **Language list:** Radio button rows, active = purple check
3. **Current language indicator:** Highlighted row with gradient border

---

## Step 6: Restyle `help_support_screen.dart` (HelpSupportScreen)

**Design ref:** `HelpSupportScreen.tsx`
**Flutter file:** `mobile/lib/features/settings/presentation/screens/help_support_screen.dart`

**Keep:** FAQ data, contact form logic.

**Restyle:**
1. **Search bar:** "How can we help?" placeholder
2. **Quick action cards:** Contact Us, FAQs, Report Bug (icon + label, rounded-16)
3. **FAQ accordion:** Expandable sections with purple accent on active
4. **Contact form:** Subject + message + attach screenshot
5. **Response time indicator:** "Typically responds within 24 hours"

---

## Step 7: Restyle `payment_methods_screen.dart` (PaymentMethodsScreen)

**Design ref:** `PaymentMethodsScreen.tsx`
**Flutter file:** `mobile/lib/features/profile/presentation/screens/payment_methods_screen.dart`

**Keep:** Payment methods provider, Stripe card management.

**Restyle:**
1. **Saved cards list:** Card brand icon + last 4 + expiry + default badge
2. **Card item:** Rounded-16, border, icon left, info center, menu right
3. **Add card button:** Dashed border card + plus icon
4. **Digital wallets:** Apple Pay / Google Pay toggles
5. **Default card indicator:** Purple "Default" pill

---

## Step 8: Create `change_password_modal.dart` (ChangePasswordModal)

**Design ref:** `ChangePasswordModal.tsx`
**Flutter file:** `mobile/lib/features/settings/presentation/widgets/change_password_modal.dart`

**New widget — bottom sheet.**

1. **Current password field:** AppInputField with show/hide toggle
2. **New password field:** With strength indicator bar
3. **Confirm password field:** With match indicator
4. **Password requirements:** Checklist (8+ chars, uppercase, number, special)
5. **Submit button:** Gradient, "Update Password"

---

## Execution Order

| # | Task | Depends On | Complexity |
|---|------|-----------|------------|
| 1 | `profile_screen.dart` | — | High |
| 2 | `edit_profile_screen.dart` | AppInputField | Medium |
| 3 | `public_profile_screen.dart` | — | Medium |
| 4 | `settings_screen.dart` | — | Medium |
| 5 | `language_settings_screen.dart` | — | Low |
| 6 | `help_support_screen.dart` | — | Medium |
| 7 | `payment_methods_screen.dart` | — | Medium |
| 8 | `change_password_modal.dart` | AppInputField | Low–Medium |

---

## Key Design Tokens (Batch 7)

| Token | Value | Usage |
|-------|-------|-------|
| Profile avatar | 80px | Main profile |
| Menu item height | 56px | Settings rows |
| Section card radius | 16px | Grouped cards |
| Toggle track active | gradient | Custom switch |
| Toggle size | 44×26px | All toggles |
| Card brand icon | 32×20px | Payment cards |
| Strength bar colors | red/orange/green | Password indicator |
| Danger text | `#DC2626` | Delete actions |
