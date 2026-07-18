# Batch 2: Buyer Dashboard + Posts — Execution Plan

Restyle the main buyer experience (7 screens + 6 shared widgets) to match the TSX designs in `designs/src/app/components/`.

## Prerequisites (from Batch 1 ✅)
- Inter font via `google_fonts`
- `AppInputField` widget with focus animations
- `GradientButton` with scale + shadow
- Updated `AppColors` and `AppTheme`
- `AppLogo` with gradient + lightning bolt

---

## Step 1: Create Shared Widgets

### 1.1 `gradient_fab.dart` — Floating Action Button
**Location:** `mobile/lib/shared/widgets/gradient_fab.dart`
**Design ref:** BuyerDashboard.tsx (line 220-240)

- 56×56px circle
- Gradient: 135deg `#7C3AED` → `#A855F7`
- Shadow: `0 8px 20px rgba(124,58,237,0.45)`
- Plus icon (white, 24px)
- Scale 0.97 on press
- Positioned: bottom-right with safe area padding

### 1.2 `bottom_nav_bar.dart` — Custom Bottom Navigation
**Location:** `mobile/lib/shared/widgets/bottom_nav_bar.dart`
**Design ref:** BuyerDashboard.tsx bottom nav section

- Frosted glass effect: white with 0.92 opacity + backdrop blur (not available natively, use solid white with shadow instead)
- Height: ~64px + bottom safe area
- 5 items: Home, Posts, (FAB gap), Messages, Profile
- Active state: gradient icon color (use primary), small gradient dot indicator below
- Unread badge on Messages (red dot or count)
- Elevated shadow: `0 -2px 20px rgba(0,0,0,0.06)`

### 1.3 `welcome_card.dart` — Dashboard Welcome Card
**Location:** `mobile/lib/shared/widgets/welcome_card.dart`
**Design ref:** BuyerDashboard.tsx welcome section

- Border radius: 24px (rounded-3xl)
- Background: Primary gradient with radial white overlay (15% opacity at center)
- Content: Greeting text (white), subtitle, stats row (3 items with dividers)
- Stats: Active Posts, Total Offers, Filled count
- CTA button: White pill button with purple text
- Padding: 20px

### 1.4 `post_card.dart` — Post List Card
**Location:** `mobile/lib/shared/widgets/post_card.dart`
**Design ref:** BuyerDashboard.tsx + MyPostsScreen.tsx

- Background: `#F9FAFB` (surfaceVariant)
- Border: 1px `#E5E7EB`
- Border radius: 16px (rounded-2xl)
- Top accent bar: 3px gradient strip (color by status)
- Layout:
  - Row: Category tag + Status badge
  - Title (15px, w600)
  - Budget range (dollar icon + formatted text)
  - Bottom row: Urgency chip + Offer count + Time ago
- Tap animation: scale 0.98

### 1.5 `status_badge.dart` — Status Indicator Pill
**Location:** Update existing `mobile/lib/shared/widgets/status_badge.dart`
**Design ref:** Used across all post screens

- Colored dot (6px circle) + label text
- Background: status color at 10% opacity
- Border radius: full (pill)
- Padding: 6px horizontal, 3px vertical
- Active (green), Draft (gray), Filled (purple), Archived (orange), Expired (red)
- Active: pulsing dot animation (opacity 1→0.2→1, 1.8s loop)

### 1.6 `urgency_chip.dart` — Urgency Level Chip
**Location:** `mobile/lib/shared/widgets/urgency_chip.dart`
**Design ref:** Post cards in BuyerDashboard.tsx

- Small pill with emoji + label
- High: 🔴 red bg tint, "Urgent"
- Medium: 🟡 amber bg tint, "Medium"  
- Low: 🟢 green bg tint, "Flexible"
- Font: 11px, w600
- Border radius: 8px
- Padding: 4px 8px

---

## Step 2: Restyle `buyer_dashboard_screen.dart`

**Design ref:** `BuyerDashboard.tsx`
**Flutter file:** `mobile/lib/features/posts/presentation/screens/buyer_dashboard_screen.dart`

**Keep:** Riverpod `postsProvider`, `appModeProvider`, GoRouter navigation, RefreshIndicator, pull-to-refresh logic.

**Restyle:**
1. Remove default AppBar → use custom header row (greeting + avatar)
2. Add `WelcomeCard` with user stats from provider
3. Section headers: "Recent Posts" with "See All" link (right-aligned)
4. Post list using new `PostCard` widget
5. Empty state with illustration + CTA when no posts
6. FAB integration via `GradientFab` (positioned in Stack or via Scaffold.floatingActionButton)

**Layout structure:**
```
Scaffold(
  body: RefreshIndicator(
    child: CustomScrollView(
      slivers: [
        SliverToBoxAdapter(header row),
        SliverToBoxAdapter(WelcomeCard),
        SliverToBoxAdapter(section header),
        SliverList(PostCards),
      ]
    )
  ),
  floatingActionButton: GradientFab(),
)
```

---

## Step 3: Restyle `my_posts_screen.dart`

**Design ref:** `MyPostsScreen.tsx`
**Flutter file:** `mobile/lib/features/posts/presentation/screens/my_posts_screen.dart`

**Keep:** Filter/sort state, `postsProvider`, navigation to post detail.

**Restyle:**
1. Stats row at top (4 columns: Active, Offers, Filled, Drafts) with animated counters
2. Horizontal scrollable filter tabs (All, Active, Draft, Filled, Archived, Expired)
   - Active tab: gradient background, white text
   - Inactive: surfaceVariant bg, grey text
   - Height: 32px, rounded-full
3. Sort button (right-aligned, compact, purple border)
4. Post cards using `PostCard` widget with status-colored accent bar
5. Action buttons per card based on status:
   - Draft: Edit + Publish
   - Active: View + View Offers (with badge)
   - Filled: View Details
   - Expired: View + Repost
6. Staggered entrance animations (each card delayed by 55ms)

---

## Step 4: Restyle `post_detail_screen.dart`

**Design ref:** `PostDetailScreen.tsx`
**Flutter file:** `mobile/lib/features/posts/presentation/screens/post_detail_screen.dart`

**Keep:** `postDetailProvider(postId)`, navigation, actions (extend, repost, mark filled, delete).

**Restyle:**
1. **Photo carousel**: PageView with dot indicators (active: 20px wide, inactive: 6px), photo count badge overlay
2. **Overflow menu**: Custom positioned popup (not default PopupMenuButton) with icon + label items
3. **Title + Status row**: Status badge with pulsing dot
4. **Category/Subcategory tags**: Rounded pills with distinct purple shades
5. **Key info grid**: 2-column, rounded-18, purple-tinted bg (`#FAFAFF`), border `#F0EBFF`
   - Budget, Location, Urgency, Timeline, Category fields
6. **Description section**: Expandable with "Show more" / "Show less" animated
7. **Seller requirements badges**: Star rating, Verified, Licensed, etc.
8. **Activity strip**: 3-column (Posted date, Views, Offers) with icons
9. **Bottom CTA**: Sticky "View Offers" gradient button with offer count bubble

---

## Step 5: Restyle `create_post_method_screen.dart`

**Design ref:** `CreatePostMethodScreen.tsx`
**Flutter file:** `mobile/lib/features/posts/presentation/screens/create_post_method_screen.dart`

**Keep:** Navigation to `/posts/create/ai` and `/posts/create/manual`.

**Restyle:**
1. Progress indicator: 3 steps connected by lines (active = gradient dot, pending = gray)
2. Two method cards:
   - **AI Card**: Sparkle icon, "AI-Powered", badge "Recommended", bullet points
   - **Manual Card**: Pencil icon, "Manual Entry", bullet points
3. Card design:
   - Border: 2px (selected: primary, unselected: border)
   - Left accent bar: 4px gradient (visible when selected)
   - Icon box: 52×52px, rounded-16, gradient bg when selected
   - Selection indicator: 22px circle (filled checkmark when selected)
4. Continue button at bottom: GradientButton, disabled when nothing selected

---

## Step 6: Restyle `ai_post_creation_screen.dart`

**Design ref:** `AIPostCreationScreen.tsx`
**Flutter file:** `mobile/lib/features/posts/presentation/screens/ai_post_creation_screen.dart`

**Keep:** AI generation logic (`postsProvider.generateWithAI`), form state, category picker, navigation to success.

**Restyle:**
1. AppBar with "AI" gradient badge next to title
2. Progress bar (step 2 of 3, animated)
3. **Describe phase:**
   - Large textarea: rounded-16, 6 rows, character counter
   - Tip box: purple-tinted, sparkle icon + helper text
   - Generate button: 52px height, rounded-24, spinner when loading
4. **Preview phase (post-generation):**
   - Field cards with "AI" badge on labels
   - Staggered reveal animation (each field 80ms delay)
   - Editable fields with purple-tinted backgrounds
   - Category/Location as styled dropdowns
   - Budget fields with "$" prefix
5. **Bottom action bar:**
   - Frosted glass background (or white with shadow)
   - "Edit Details" (outline) + "Post Now" (gradient)
   - 50px height each, 12px gap

---

## Step 7: Restyle `manual_post_creation_screen.dart`

**Design ref:** `ManualPostCreationScreen.tsx`
**Flutter file:** `mobile/lib/features/posts/presentation/screens/manual_post_creation_screen.dart`

**Keep:** Form validation, category picker, image upload logic, all form state, navigation.

**Restyle:**
1. **Field labels**: 13px w600, required asterisk in purple
2. **All inputs**: Use `AppInputField` or consistent styled containers
3. **Urgency chips**: Horizontal row, pill-shaped, selected = purple border + purple tint
4. **Photo upload grid**: 3 columns, square aspect ratio
   - Empty cell: dashed border (#D1D5DB), plus icon
   - Filled cell: image thumbnail + checkmark overlay (gradient circle)
5. **Seller requirements section**: Collapsible card
   - Header with toggle
   - Star rating row (5 tappable stars)
   - Toggle switches: 44×26px, rounded-full, gradient when active
6. **Bottom action bar**: 
   - Row 1: Preview (outline 44px) + Save Draft (text 44px)
   - Row 2: Submit Post (gradient 52px, full width)
   - Frosted/elevated background

---

## Step 8: Restyle `post_created_screen.dart`

**Design ref:** `PostSuccessScreen.tsx`
**Flutter file:** `mobile/lib/features/posts/presentation/screens/post_created_screen.dart`

**Keep:** Navigation to post detail and dashboard.

**Restyle:**
1. **Animated success badge** (120×120px):
   - Outer glow ring: scale animation (spring, 240 stiffness)
   - Pulsing ring: scale 1→1.22, opacity cycle, 1.4s infinite (starts after 900ms)
   - Inner gradient circle: primary gradient
   - Checkmark: path draw animation (pathLength 0→1, 0.55s, delay 0.45s — use TweenAnimationBuilder in Flutter)
   - Particle burst: 8 small circles scattered (use Transform + fade)
2. **Heading**: "Post Created!" + subtitle, staggered entrance
3. **Summary card**:
   - Rounded-20, purple-tinted bg (`#FAFAFF`), border `#EDE9FE`
   - Top: 3px gradient accent bar
   - Title, category chip, "Live" status badge (green)
   - Meta row: 3 columns (Budget, Location, Urgency) with icons + dividers
4. **Action buttons** (staggered entrance):
   - "View My Post": Gradient, 54px
   - "Create Another Post": Outline, 50px
   - "Go to Dashboard": Text button, 40px

---

## Execution Order

| # | Task | Depends On | Complexity |
|---|------|-----------|------------|
| 1 | `gradient_fab.dart` | — | Low |
| 2 | `urgency_chip.dart` | — | Low |
| 3 | Update `status_badge.dart` | — | Low |
| 4 | `welcome_card.dart` | — | Medium |
| 5 | `post_card.dart` | status_badge, urgency_chip | Medium |
| 6 | `bottom_nav_bar.dart` | — | Medium |
| 7 | `buyer_dashboard_screen.dart` | welcome_card, post_card, gradient_fab | High |
| 8 | `my_posts_screen.dart` | post_card, status_badge | High |
| 9 | `create_post_method_screen.dart` | — | Medium |
| 10 | `post_created_screen.dart` | — | Medium |
| 11 | `ai_post_creation_screen.dart` | — | High |
| 12 | `manual_post_creation_screen.dart` | — | High |
| 13 | `post_detail_screen.dart` | status_badge, urgency_chip | High |

---

## Key Design Tokens (Batch 2 additions)

| Token | Value | Usage |
|-------|-------|-------|
| Card radius | 16px | Post cards |
| Welcome card radius | 24px | Dashboard hero |
| Info grid bg | `#FAFAFF` | Post detail key info |
| Info grid border | `#F0EBFF` | Post detail key info |
| Accent bar height | 3px | Top of post cards |
| Filter tab height | 32px | My Posts filter |
| FAB size | 56px | Dashboard |
| FAB shadow alpha | 0.45 | Dashboard |
| Method card icon box | 52px | Create post method |
| Progress dot active | 10px | Step indicators |
| Progress dot inactive | 8px | Step indicators |
| Bottom bar blur | white + elevation shadow | Action bars |

---

## Principles (same as Batch 1)

1. **Never break functionality** — preserve all providers, services, API calls, navigation
2. **Read the TSX first** — reference design before touching each screen
3. **Extract shared widgets** — reuse PostCard, StatusBadge, etc. across screens
4. **Match exactly** — colors, spacing, radii, shadows, font sizes from designs
5. **One screen at a time** — complete and verify before moving on
6. **Animations via Flutter built-ins** — AnimatedContainer, TweenAnimationBuilder, AnimationController (no extra packages needed)
