# Reverse Marketplace - Complete Screen Hierarchy & Element Map

> Design reference for all app screens, organized by navigation hierarchy.
> Each screen lists its UI elements, buttons, and interactive components.

### Status Legend
- `[BUILT]` — Screen implemented in Flutter with routing
- `[NOT BUILT]` — Screen not yet implemented
- `[MODAL]` — Implemented as dialog/modal within another screen
- `[PHASE 2]` — Designed but deferred to Phase 2 (post-MVP)

> *Last audited: June 10, 2026 — 37 of 54 screens built (Phase 3 / Epic #8 closeout: marked Public Profile, Counter-Offer Modal, Saved Sellers as built; corrected Reviews count; added 9.3a Saved Sellers entry; recounted all totals)*

---

## 0. App Entry

### 0.1 Splash Screen `[NOT BUILT]`
- App logo (animated)
- Loading indicator
- Auto-navigates to Login or Dashboard based on auth state

---

## 1. Authentication Flow (unauthenticated)

### 1.1 Login Screen `/login` `[BUILT]`
- App logo
- "Welcome Back" title + subtitle
- **Email** text field (with validation)
- **Password** text field (show/hide toggle)
- "Remember me" checkbox
- "Forgot Password?" text link → 1.3
- **[Sign In]** button (primary, loading state)
- "Don't have an account? **Sign Up**" link → 1.2

### 1.2 Register Screen `/register` `[BUILT]`
- Back arrow (AppBar)
- "Create Account" title
- **First Name** / **Last Name** text fields (side by side)
- **Email** text field
- **Password** text field + strength indicator bar
- **Phone** text field (optional)
- **ZIP Code** text field (optional)
- **Account Type Selector** — 3 tappable cards with icons:
  - "Buy" (shopping bag icon)
  - "Sell" (storefront icon)
  - "Both" (swap icon)
- Terms & conditions acceptance text
- **[Create Account]** button (primary)
- "Already have an account? **Sign In**" link → 1.1

### 1.3 Forgot Password Screen `/auth/forgot-password` `[BUILT]`
- Lock icon (large)
- "Reset Your Password" title
- **Email** text field
- **[Send Reset Link]** button
- **Success state:** Checkmark icon + "Check your email" message + **[Back to Sign In]** button

### 1.4 Reset Password Screen `/auth/reset-password` `[BUILT]`
- "Set New Password" title
- **New Password** text field + strength indicator
- **Confirm Password** text field
- **[Reset Password]** button
- **Success state:** Confirmation message + **[Sign In]** button

### 1.5 Email Verification Screen `/auth/verify-email` `[BUILT]`
- App logo
- Mail icon (large)
- "Verify Your Email" title
- User's email address displayed
- Verification instructions text
- Error/success message containers
- Loading state with spinner ("Verifying your email...")
- **[Resend Verification Email]** button
- "Sign in with a different account" link → 1.1

---

## 2. Main App Shell (authenticated)

### Bottom Navigation Bar (4 tabs, adapts by mode)

| Tab | Buyer Mode | Seller Mode |
|-----|-----------|-------------|
| 1 | Home (home icon) | Feed (explore icon) |
| 2 | My Posts (list icon) | My Offers (local_offer icon) |
| 3 | Messages (chat icon + unread badge) | Messages (chat icon + unread badge) |
| 4 | Profile (person icon) | Profile (person icon) |

- **Floating Action Button** (buyer mode only): "+ Create Post"

### Top App Bar (persistent)
- Screen title (varies)
- Notifications bell icon (with unread count badge)
- Context-specific action buttons

---

## 3. Tab 1 — Home / Feed

### 3.1 Buyer Dashboard `/dashboard` (buyer mode) `[BUILT]`
- **AppBar:** Title + Transactions button (→ 7.1)
- **Marketplace Context Selector:** B2C / B2B / C2C toggle chips
- **Welcome Card:**
  - "Hi, [First Name]!" greeting
  - Quick stats row (active posts, total offers received, completed)
- **[Create Post]** CTA button → 4.1
- **Posts List** (pull-to-refresh, infinite scroll):
  - PostCard for each post:
    - Post title
    - Category tag
    - Budget range
    - Timeline/urgency badge
    - Offer count badge
    - Status badge (Active/Draft/Filled/Expired)
    - Tap → 5.1 (Post Detail)

### 3.2 Seller Feed `/dashboard` (seller mode) `[BUILT]`
- **AppBar:** "Browse Requests" title
- **Search bar** in AppBar bottom (text field with search/clear icons)
- **Marketplace Context Selector:** B2C / B2B / C2C toggle chips
- **Urgency Filter Chips** (horizontal scroll): All | Urgent | High | Medium | Low
- **Post Cards List** (infinite scroll, pull-to-refresh):
  - PostCard for each buyer request:
    - Post title
    - Budget range
    - Timeline/urgency badge
    - Buyer rating (stars)
    - Distance from seller
    - Offer count
    - Category tag
    - Tap → 5.2 (Post Detail - Seller View)
- **Empty state:** illustration + "No matching requests" message

---

## 4. Post Creation Flow

### 4.1 Create Post Method Screen `/posts/create` `[BUILT]`
- **AppBar:** "Create a Post" + back arrow
- "How would you like to create your post?" title
- **Two Method Cards:**
  - **AI-Assisted** (sparkle icon) — "Describe what you need in plain language" → 4.2
  - **Manual Form** (edit icon) — "Fill out the details yourself" → 4.3

### 4.2 AI Post Creation Screen `/posts/create/ai` `[BUILT]`
- **AppBar:** "AI-Assisted Post" + back arrow
- **Describe Phase:**
  - **Text area:** "Describe what you need..." (large, multi-line)
  - **[Generate Post]** button
- **Preview Phase** (after AI generates draft):
  - **AI-generated fields** (all editable): Title, Description, Category, Budget, Urgency
  - **Condition picker** (if Products category)
  - **Photos (optional):** photo picker grid (up to 10, 5 MB each) — added Issue #25
  - **[Save Draft]** / **[Post Now]** buttons

### 4.3 Manual Post Creation Screen `/posts/create/manual` `[BUILT]`
- **AppBar:** "Create Post" + back arrow
- **Multi-step form / scrollable form:**
  - **Title** text field (10-100 chars)
  - **Description** text area (50-1000 chars)
  - **Category** dropdown (with dynamic subcategory)
  - **Budget** — Min / Max currency fields
  - **Location** — Address field (with Google Places autocomplete) or "Use my location"
  - **Photos** — Upload grid (up to 10, max 5MB each), tap to add/remove
  - **Timeline Selector:** ASAP | 1 Week | 2 Weeks | Flexible | Specific Date (date picker)
  - **Post Duration:** 24h | 3 Days | 7 Days | 14 Days (chip selector)
  - **Seller Requirements** (optional section):
    - Minimum rating slider (1-5 stars)
    - "Verified sellers only" toggle
    - "Licensed only" toggle
    - "Business accounts only" toggle
  - **Category-Specific Fields** (dynamic, based on category):
    - Products: Condition preference, brand, model
    - Services: Property type, urgency, special requirements
    - Jobs: Job type (full/part/contract), experience level, skills, remote/hybrid/onsite
- **[Preview Post]** button → preview modal
- **[Save as Draft]** button
- **[Submit Post]** button (primary)

### 4.4 Post Created Screen `/posts/created/:postId` `[BUILT]`
- Success checkmark animation
- "Your post is live!" title
- Post summary card (title, category, budget)
- **[View My Post]** button → 5.1
- **[Create Another Post]** button → 4.1
- **[Go to Dashboard]** button → 3.1

---

## 5. Post Detail & Offers

### 5.1 Post Detail Screen `/posts/:postId` (buyer view) `[BUILT]`
- **AppBar:** "Post Details" + back arrow + overflow menu (Edit, Delete, Extend, Mark Filled, Repost)
- **Photo Carousel** (PageView with dot indicators)
- **Post Title** + Status Badge (Active/Draft/Filled/Expired/Cancelled)
- **Category** tag chip
- **Budget Range** display
- **Timeline** display
- **Location** with map pin icon
- **Description** (expandable text)
- **Seller Requirements** section (badges: Licensed, Verified, etc.)
- **Offer Count** display
- **[View Offers]** button → 5.3
- **Post metadata:** Posted date, expiration date, view count
- **Action Buttons** (contextual):
  - **[Edit Post]** → 4.3 (pre-filled)
  - **[Extend Duration]** → duration selector modal
  - **[Mark as Filled]** → confirmation modal
  - **[Delete Post]** → confirmation modal
  - **[Repost]** → confirmation → 4.4
  - **[Renew Post]** → bumps post to top of feed (like Facebook Marketplace renew; Feb 6th session)

### 5.2 Post Detail Screen `/posts/:postId` (seller view) `[BUILT]`
- **Photo Carousel** (PageView with dot indicators)
- **Post Title** + Status Badge (Active/Draft/Filled/Expired/Cancelled)
- **Category** tag chip
- **Budget Range** display
- **Timeline** display
- **Location** with map pin icon
- **Description** (expandable text)
- **Seller Requirements** section (badges: Licensed, Verified, etc.)
- **Offer Count** display
- **Buyer Profile Card:**
  - Buyer name, avatar, rating
  - Member since date
  - **[View Profile]** → 9.3
- **Earnings Calculator** (inline):
  - "If you quote $___" input
  - Platform fee display (8%)
  - "Your payout: $___" calculated
- **Competition Info:** "X offers submitted" count
- **[Submit Offer]** button (primary) → 5.5
- **[Message Buyer]** button → 8.2

### 5.3 Post Offers Screen `/posts/:postId/offers` (buyer view) `[BUILT]`
- **AppBar:** "Offers on [Post Title]" + back arrow
- **Sort Selector:** Lowest Price | Highest Rated | Fastest Response | Closest | Most Relevant
- **Filter Options:**
  - Rating range slider
  - Price range slider
  - Verification status toggles
  - Availability filter
- **Offer Cards List** (scrollable):
  - OfferCard for each offer:
    - Seller avatar + name + rating (stars)
    - Verification badges (Licensed, Insured, etc.)
    - Quote amount (highlighted)
    - Timeline / start date
    - Message preview snippet
    - Distance from post location
    - **[View Details]** → 5.4
    - **[Accept]** → 5.6
    - **[Decline]** → confirmation modal
    - **[Message Seller]** → 8.2
- **[Compare Offers]** button (select up to 3) → 5.7
- **Empty state:** "No offers yet" + illustration

### 5.4 Offer Detail Screen `/offers/:offerId` `[BUILT]`
- **AppBar:** "Offer Details" + back arrow
- **Seller Profile Card:**
  - Avatar, name, rating, review count
  - Verification badges
  - Member since, response time
  - **[View Full Profile]** → 9.3
- **Offer Details Section:**
  - Quote/Price amount (large, bold)
  - Pricing type (Flat Rate / Hourly / Quote)
  - Start date
  - Completion timeline
  - Seller's message (full text)
  - Attachments (portfolio photos, resume — tappable gallery)
  - Category-specific fields:
    - Services: Warranty, emergency available, estimated hours
    - Products: Condition, delivery options, return policy
    - Jobs: Hours/week, salary/rate, availability
- **Cost Breakdown** (buyer view):
  - Offer price
  - + Platform fee (5% buyer)
  - + Stripe processing fee
  - = **Total you pay**
- **Action Buttons:**
  - **[Accept Offer]** (primary) → 5.6
  - **[Counter Offer]** → Counter-Offer Modal (5.4a)
  - **[Decline]** → confirmation modal
  - **[Message Seller]** → 8.2
- **Seller Action Buttons** (if seller's own offer):
  - **[Edit Offer]** → 5.5 (pre-filled)
  - **[Withdraw Offer]** → confirmation modal

### 5.5 Submit Offer Screen `/posts/:postId/submit-offer` (seller) `[BUILT]`
- **AppBar:** "Submit Offer" + back arrow
- **Post Summary Card** (collapsed: title, budget, category)
- **Offer Form:**
  - **Quote/Price** currency field
  - **Pricing Type** selector: Flat Rate | Hourly | Quote
  - **Estimated Hours** (if hourly)
  - **Start Date** date picker
  - **Completion Timeline** text field
  - **Message to Buyer** text area (50-1000 chars)
  - **Attachments** — Upload grid (portfolio photos, resume, certifications)
  - **Category-Specific Fields:**
    - Services: Warranty terms, emergency available toggle
    - Products: Condition, delivery options, return policy
    - Jobs: Hours/week, salary expectations, availability
- **Fee Preview** (live-updating):
  - Your quote: $___
  - Platform fee (8%): -$___
  - **Your payout: $___**
- **[Preview Offer]** → Offer Summary Modal (5.5a)
- **[Submit Offer]** button (primary)

#### 5.5a Offer Summary Confirmation Modal `[MODAL]`
- Full offer recap
- Earnings breakdown (quote - platform fee = payout)
- Buyer will pay breakdown (quote + buyer fee + Stripe = total)
- **[Confirm & Submit]** button
- **[Edit]** button (dismiss modal)

#### 5.4a Counter-Offer Modal `[BUILT — Issue #16]`
- Original offer summary (seller name, quote amount, timeline)
- Round indicator (e.g. "Round 2 of 5")
- **Counter Amount** currency field (buyer's proposed price)
- **Counter Message** text area (optional, explain reasoning)
- **Below Market Value Warning** (if counter is significantly below market rate — April 14th session decision)
- **[Send Counter]** button (primary)
- **[Cancel]** button

### 5.6 Accept Offer Confirmation Modal `[NOT BUILT]`
- Offer summary (seller name, quote amount)
- **Cost Breakdown:**
  - Offer price
  - + Buyer platform fee (5%)
  - + Stripe processing fee
  - = **Total charge**
- **Payment Method Selector:**
  - Saved cards list
  - **[Add New Card]** → Stripe card input
  - Apple Pay / Google Pay (if available)
- **[Confirm & Pay]** button (primary)
- **[Cancel]** button

### 5.7 Compare Offers Screen (modal/overlay) `[NOT BUILT]`
- Side-by-side comparison table (up to 3 offers)
- Columns per offer:
  - Seller name + avatar
  - Rating + review count
  - Badges
  - Price
  - Timeline
  - Distance
  - Key differentiators
- **[Accept]** button under each column
- **[Close]** button

---

## 6. Tab 2 — My Posts / My Offers

### 6.1 My Posts Screen `/my-posts` (buyer mode) `[BUILT]`
- **AppBar:** "My Posts"
- **Filter Chips** (horizontal scroll): All | Active | Draft | Filled | Archived | Expired
- **Sort Options:** Newest | Most Offers | Expiring Soon
- **Post Cards List** (infinite scroll):
  - PostCard per post:
    - Title, category tag, budget range
    - Status badge
    - Offer count badge
    - Posted date, expiration countdown
    - Tap → 5.1
- **Empty state:** illustration + "No posts yet" + **[Create Your First Post]** button

### 6.2 My Offers Screen `/my-posts` (seller mode) `[BUILT]`
- **AppBar:** "My Offers"
- **Filter Chips** (horizontal scroll): All | Pending | Accepted | Declined | Countered | Withdrawn
- **Offer Cards List** (infinite scroll):
  - OfferCard per offer:
    - Post title (what this offer is for)
    - Offer amount
    - Buyer rating
    - Status badge (Pending/Accepted/Declined/Withdrawn)
    - Submitted date
    - Tap → 5.4
- **Empty state:** illustration + "No offers yet" + "Browse requests to submit your first offer"

---

## 7. Transactions

### 7.1 Transactions Screen `/transactions` `[BUILT]`
- **AppBar:** "Transactions"
- **Filter Chips** (horizontal scroll): All | In Progress | Awaiting Approval | Completed | Cancelled
- **Transaction Cards List** (infinite scroll):
  - TransactionCard per transaction:
    - Post title
    - Counterparty name + avatar
    - Amount
    - Status badge (with color coding)
    - Category icon
    - Date
    - Next action indicator
    - Tap → 7.2 or 7.3

### 7.2 Transaction Detail Screen `/transactions/:id` (buyer view) `[BUILT]`
- **AppBar:** "Transaction Details" + back arrow
- **Status Timeline** (vertical stepper):
  - Payment Secured
  - Seller Contacted
  - Work In Progress / Shipped
  - Completed
  - Funds Released
  - (current step highlighted, future steps grayed)
- **Transaction Info Section:**
  - Post title (tappable → 5.1)
  - Seller info card (avatar, name, rating → 9.3)
  - Accepted offer amount
  - Platform fee
  - Total paid
  - Payment method used
  - Transaction date
- **Photos Section:**
  - Before photos (uploaded at start)
  - After/completion photos (uploaded by seller)
- **Seller Contact:** **[Message Seller]** button → 8.2
- **Action Buttons** (contextual by status):
  - If "Awaiting Approval":
    - **[Approve & Release Funds]** → confirmation modal
    - **[Request Changes]** → text input modal (reason required)
  - If "In Progress":
    - **[Cancel Transaction]** → confirmation modal (with reason)
  - If "Completed":
    - **[Leave Review]** → 10.1
- **Dispute Link:** "Having an issue? **Report a problem**" → 7.4

### 7.3 Seller Transaction Detail Screen `/transactions/:id/seller` (seller view) `[BUILT]`
- **AppBar:** "Transaction Details" + back arrow
- **Status Timeline** (same stepper as 7.2)
- **Transaction Info Section:**
  - Post title
  - Buyer info card (avatar, name, rating)
  - Accepted offer amount
  - Platform fee deduction
  - **Your payout** (highlighted)
  - Payout status (Pending / Processing / Paid)
- **Action Buttons** (contextual by status):
  - If "In Progress":
    - **[Upload Completion Photos]** → photo picker (required)
    - **[Mark as Complete]** → triggers buyer approval flow
    - **[Message Buyer]** → 8.2
  - If shipped product:
    - **[Enter Tracking Number]** → text field modal
  - If local pickup:
    - **[Generate QR Code]** → QR display
    - **[Confirm Handoff]** → confirmation modal

### 7.4 Dispute Detail Screen `/transactions/:id/dispute` `[NOT BUILT]`
- **AppBar:** "Dispute Details" + back arrow
- **Dispute Status Badge** (Under Review / Escalated / Resolved / Appealed)
- **Dispute Timeline** (vertical stepper):
  - Dispute filed
  - Evidence submitted
  - Under review (support agent assigned)
  - Resolution issued
- **Transaction Summary** (post title, counterparty, amount, original transaction date)
- **Evidence Section:**
  - Your submitted photos (tappable gallery)
  - Your messages/description of issue
  - Counterparty's completion photos (if applicable)
- **Support Agent Status:**
  - Agent assigned indicator
  - Agent message/notes (if any)
- **Resolution Details** (if resolved):
  - Outcome (Full refund / Partial refund / Dismissed)
  - Resolution reasoning
- **Action Buttons:**
  - **[Add Evidence]** → photo/text upload (if dispute still open)
  - **[Appeal Decision]** → appeal form (if resolved and within appeal window)
  - **[Message Support]** → support chat
  - **[Close Dispute]** → confirmation modal

---

## 8. Tab 3 — Messages

### 8.1 Conversations Screen `/messages` `[BUILT]`
- **AppBar:** "Messages" + filter menu icon
- **Filter Menu:** All | Active | Archived
- **Search bar** (search by contact name)
- **Conversations List** (infinite scroll, pull-to-refresh):
  - ConversationTile per conversation:
    - Participant avatar
    - Participant name + role badge (Buyer/Seller)
    - Last message preview (truncated)
    - Timestamp
    - Unread count badge (if any)
    - Post context (linked post title, small)
    - Tap → 8.2
- **Empty state:** illustration + "No conversations yet"
- **Real-time (Session 13):**
  - Socket.IO `notification` listener (type: `message_received` → auto-refresh list)
  - Polling fallback at 60s intervals (silent, no loading indicators)
  - Unread count updated in real-time via `unreadCountProvider`

### 8.2 Chat Screen `/chat/:conversationId` `[BUILT]`
- **AppBar:** Participant name + avatar + back arrow
  - Subtitle: Role badge + rating
  - Overflow menu: View Profile, Report Conversation
- **Post/Offer Context Banner** (top, collapsible):
  - Linked post title + status
  - Offer amount (if applicable)
  - Tap → 5.1 or 5.4
- **Typing Indicator** (above input bar, shows when other user is typing) **(Session 13)**
- **Message List** (scrollable, infinite load older messages):
  - MessageBubble per message:
    - Text content
    - Timestamp
    - Read receipt indicator (sent/delivered/read)
    - Sender indicator (left/right alignment)
    - Pending state for optimistic messages (temp ID) **(Session 13)**
    - Attachment thumbnails (tappable → fullscreen viewer)
  - Auto-scroll to latest message on new message arrival **(Session 13)**
- **Message Input Bar** (bottom, sticky):
  - Text input field ("Type a message...")
  - Emits `typing_start`/`typing_stop` events via Socket.IO **(Session 13)**
  - **Attachment button** (camera icon) → photo/file picker
  - **[Send]** button (arrow icon)
- **Real-time (Session 13):**
  - Socket.IO `new_message` listener (instant delivery from other participant)
  - Socket.IO `typing_start`/`typing_stop` listeners (typing indicator with 4s auto-clear)
  - Socket.IO `messages_read` listener (read receipt updates)
  - Optimistic message sends (temp ID, replaced on server confirmation, removed on failure)
  - Auto-joins `conv:{conversationId}` room on screen open, leaves on dispose
  - Polling fallback at 30s intervals (silent, no loading indicators)
  - Message pagination (load more on scroll-to-top)

---

## 9. Tab 4 — Profile

### 9.1 Profile Screen `/profile` `[BUILT]`
- **AppBar:** "Profile"
- **User Info Card:**
  - Profile photo (large circular, initials fallback)
  - Full name
  - Email
  - Account type badge (Buyer/Seller/Both)
  - Member since date
- **Profile Menu List:**
  - **Edit Profile** → 9.2
  - **Switch to Seller/Buyer Mode** (toggle)
  - **Seller Profile** (if seller) → 9.4
  - **Verification Status** → 9.5
  - **My Transactions** → 7.1
  - **Saved Sellers** → saved/connected sellers list (Feb 6th session: "connect with them... go back to them in the future")
  - **Earnings Dashboard** (seller) → 9.6
  - **Payment Methods** → 9.7
  - **Settings** → 9.8
  - **Language Settings** → 9.9
  - **Help & Support** → 9.10
  - **[Sign Out]** button (danger style)

### 9.2 Edit Profile Screen `[BUILT — Session 14]`
- **AppBar:** "Edit Profile" + back arrow + **[Save]** button
- **Profile Photo** (tappable to change, camera overlay icon)
- **First Name** text field
- **Last Name** text field
- **Email** text field (may be read-only or require re-verification)
- **Phone** text field
- **ZIP Code** text field
- **Bio** text area
- **[Change Password]** → 9.2a

#### 9.2a Change Password Modal/Screen `[BUILT]`
- **Current Password** text field
- **New Password** text field + strength indicator
- **Confirm Password** text field
- **[Update Password]** button

### 9.3 Public Profile Screen (viewing another user) `[BUILT — Issue #21]`
- **AppBar:** User's name + back arrow + overflow menu (Report)
- **Profile Header:**
  - Photo (initials fallback), name, rating (stars + count)
  - Member since
  - Account type
  - Verification badges row
- **Bio** section
- **Stats Row:** Completed transactions | Response time | Rating
- **Reviews List** (scrollable):
  - ReviewCard per review:
    - Reviewer name + avatar
    - Star rating
    - Review text
    - Transaction date
    - "Verified Transaction" badge
- **[Message]** button (if different user)
- **[Save Seller / Unsave]** button (animated bookmark icon — toggles via `savedSellersProvider`; optimistic update)

### 9.3a Saved Sellers Screen `/saved-sellers` `[BUILT — Issue #21]`
- **AppBar:** "Saved Sellers" + back arrow
- **Saved Seller Cards List** (scrollable):
  - SavedSellerCard per entry:
    - Avatar (initials fallback)
    - Display name + location label
    - Rating + review count
    - **[Unsave]** button (bookmark-filled icon, optimistic remove)
    - Tap → 9.3 (Public Profile)
- **Empty state:** bookmark icon + "No saved sellers yet" + "Browse seller profiles to save your favorites"

### 9.4 Seller Profile Screen `/seller/profile` `[BUILT]`
- **AppBar:** "Seller Profile" + back arrow + **[Edit]** button
- **Profile Strength Indicator** (0-100% progress bar)
- **Business Info:**
  - Business name
  - Business type (Individual/LLC/Corporation)
  - Bio/description
  - Years of experience
  - Website
- **Categories** (chip list of selected categories)
- **Service Area:**
  - Location display
  - Radius (e.g., "25 miles")
  - Mini map visualization
- **Availability:** Days/hours display
- **Pricing:** Hourly / Flat Rate / Quotes Only
- **Verification Badges** section (earned badges displayed)
- **[Edit Seller Profile]** → 9.4a
- **[Manage Verification]** → 9.5
- **[Stripe Dashboard]** → 9.4b

#### 9.4a Seller Profile Setup/Edit Screen `/seller/profile/setup` `[BUILT]`
- **AppBar:** "Seller Profile Setup" + back arrow
- **Business Name** text field (optional)
- **Bio** text area (500 char max)
- **Service Radius** text field (default: 25 miles)
- **Years of Experience** number field
- **Website** text field (optional)
- **Category Picker** (multi-select with category tree)
- **Availability Selector** (day/time grid)
- **Pricing Structure:** Hourly | Flat Rate | Quotes Only (radio)
- **Emergency Services** toggle
- **[Save Profile]** button

#### 9.4b Stripe Onboarding Screen `/seller/stripe-onboard` `[BUILT]`
- **AppBar:** "Payment Setup" + back arrow
- Stripe Connect status card:
  - Not started / In progress / Complete / Requires attention
- **[Start Stripe Onboarding]** or **[Continue Setup]** button → opens Stripe-hosted flow
- Bank account status
- Payout schedule info

### 9.5 Verification Screen `/seller/verification` `[BUILT]`
- **AppBar:** "Verification" + back arrow
- **Verification Badges Grid:**
  - Email Verified (auto, checkmark or pending)
  - Phone Verified (status + verify button)
  - ID Verified (status + upload button)
  - Licensed (status + upload button)
  - Insured (status + upload button)
  - Background Check (status + initiate button, only for high-risk categories)
- Each badge card shows:
  - Badge icon
  - Status (Not Started / Pending Review / Verified / Rejected)
  - **[Upload Document]** or **[Verify Now]** button
  - Rejection reason (if rejected)

### 9.6 Seller Earnings Dashboard `[NOT BUILT]`
- **AppBar:** "Earnings" + back arrow
- **Earnings Summary Cards:**
  - Total Earnings (all time)
  - This Month
  - Pending (awaiting buyer approval)
  - Available for Payout
- **Earnings Chart** (line/bar chart, monthly breakdown)
- **Recent Payouts List:**
  - Payout amount, date, status (Processing/Completed), bank last 4
- **[Export to CSV]** button
- **[View Stripe Dashboard]** link (external)
- **Tax Documents Section:**
  - 1099-K availability (if eligible)

### 9.7 Payment Methods Screen `[NOT BUILT]`
- **AppBar:** "Payment Methods" + back arrow
- **Saved Cards List:**
  - Card brand icon + last 4 digits
  - Expiry date
  - Default badge
  - **[Remove]** button
- **[Add New Card]** button → Stripe card input
- **Apple Pay / Google Pay** toggle (if device supports)

### 9.8 Settings Screen `/settings` `[BUILT — Session 14]`
- **AppBar:** "Settings" + back arrow
- **NOTIFICATIONS section:**
  - Push Notifications toggle
  - Email Notifications toggle
- **ACCOUNT section** (classic accounts only):
  - Upgrade to Business → upgrade-to-business screen
- **PREFERENCES section:**
  - Language → 9.9
  - Dark Mode (Coming Soon)
- **ABOUT section:**
  - Privacy Policy (external link)
  - Terms of Service (external link)
  - Contact Support (mailto link)
- **[Sign Out]** gradient button
- **DANGER ZONE section:**
  - **Deactivate Account** — confirmation sheet (data retained, reactivate by logging in)
  - **Delete Account** — confirmation sheet (permanent, GDPR, reviews retained)

### 9.9 Language Settings Screen `/settings/language` `[BUILT]`
- **AppBar:** "Language" + back arrow
- Language list with radio selection:
  - English (default)
  - Spanish
  - (additional languages)
- Auto-applies on selection

### 9.10 Help & Support Screen `[NOT BUILT]`
- **AppBar:** "Help & Support" + back arrow
- **FAQ Section** (expandable accordion)
- **Contact Support:**
  - **[Email Support]** button
  - **[Report a Bug]** button
- **Legal Links:**
  - Terms of Service
  - Privacy Policy
  - Community Guidelines

---

## 10. Reviews

### 10.1 Submit Review Screen (post-transaction) `[BUILT — Session 14]`
- **AppBar:** "Leave a Review" + back arrow
- **Transaction Summary** (seller name, service/product, amount)
- **Star Rating** selector (1-5 tappable stars)
- **Review Text** area (optional but encouraged)
- **Photo Upload** (optional, before/after or evidence)
- **[Submit Review]** button
- "Verified Transaction" badge preview

---

## 11. Admin Dashboard (admin users only)

### 11.1 Admin Dashboard `/admin` `[NOT BUILT]`
- **Platform Stats Cards:**
  - Total users, active posts, transactions today, revenue
  - Pending verifications count
  - Open disputes count
  - Flagged content count
- Quick action links to each admin section

### 11.2 User Management `[NOT BUILT]`
- **Search bar** (by name, email)
- **Users Table/List:**
  - Name, email, type, status, join date
  - **[View]** → user detail
  - **[Suspend]** / **[Ban]** / **[Reactivate]** buttons
  - **[Force Logout]** button

### 11.3 Verification Review `[NOT BUILT]`
- **Pending Verifications List:**
  - Seller name, verification type, submitted date
  - Document preview (tappable)
  - **[Approve]** / **[Reject]** buttons (reject requires reason)

### 11.4 Dispute Management `[NOT BUILT]`
- **Disputes List:**
  - Transaction reference, parties involved, amount, status
  - **[View Details]** → dispute detail
  - **[Resolve]** → resolution form (refund/partial/dismiss)

### 11.5 Content Moderation `[NOT BUILT]`
- **Flagged Content List:**
  - Type (review/message/post), content preview, flag reason
  - **[View]** → content detail
  - **[Remove Content]** / **[Dismiss Flag]** / **[Warn User]** / **[Ban User]**

### 11.6 Transaction Monitor `[NOT BUILT]`
- **All Transactions List** (searchable, filterable)
  - ID, buyer, seller, amount, status, date
  - **[View]** → transaction detail

### 11.7 Audit Logs `[NOT BUILT]`
- **Logs List** (searchable, filterable by action/user/date)
  - Timestamp, user, action, target, details

---

## 12. Promotions (Phase 2 — deferred until user base established)

> *Designed in Feb 12th session. Agreed to skip at launch; document here for roadmap.*

### 12.1 Create Promotion Post (seller) `[PHASE 2]`
- **AppBar:** "Create Promotion" + back arrow
- **Promotion Type:** Sale / Discount / New Service / Limited-Time Offer (radio)
- **Title** text field
- **Description** text area (what's being promoted, discount details)
- **Category** dropdown (auto-filled from seller profile categories)
- **Promotion Duration** — Start date / End date pickers
- **Target Criteria:**
  - Service area radius
  - Match to buyer post history / categories
- **Lead Budget** — How many buyers to reach (e.g., 50 / 100 / 200+)
- **Cost Preview** — Estimated cost based on lead count
- **[Preview Promotion]** button
- **[Post Promotion]** button (primary)

### 12.2 Buyer Promotions Feed `[PHASE 2]`
- **AppBar:** "Promotions" (accessible from buyer dashboard or as tab)
- **Promotions List** (scrollable newsfeed, infinite scroll):
  - PromotionCard per promotion:
    - Seller name + avatar + rating
    - Promotion title + description
    - Discount/offer details (highlighted)
    - Category tag
    - Distance from buyer
    - Valid until date
    - **[View Details]** → 12.3
    - **[Message Seller]** → 8.2
- Auto-matched based on: buyer's location, past post categories, past seller interactions
- Higher-paying sellers appear first in feed
- **Empty state:** "No promotions in your area" illustration

### 12.3 Promotion Detail Screen `[PHASE 2]`
- **AppBar:** "Promotion Details" + back arrow
- **Seller Profile Card** (avatar, name, rating, badges, distance)
- **Promotion Details:**
  - Title + description
  - Discount/offer terms
  - Valid dates
  - Category
  - Service area
- **[Message Seller]** button → 8.2
- **[View Seller Profile]** → 9.3

---

## 13. Modals & Overlays (appear on top of screens)

| Modal | Triggered From | Contents |
|-------|---------------|----------|
| **Delete Confirmation** | Post/Offer actions | Warning text + [Delete] + [Cancel] |
| **Cancel Transaction** | Transaction detail | Reason text field + [Confirm Cancel] + [Go Back] |
| **Extend Duration** | Post detail | Duration selector (24h/3d/7d/14d) + [Extend] |
| **Cost Breakdown** | Accept offer flow | Line items (price + fees = total) |
| **Report Issue** | Various | Issue type dropdown + description + [Submit] |
| **QR Code Display** | Local pickup transaction | QR code image + instructions |
| **Photo Lightbox** | Chat, Post detail, Transaction | Fullscreen image viewer with swipe |
| **Offer Summary** | Submit offer | Full recap + earnings breakdown + [Confirm] |
| **Counter-Offer** | Offer detail (5.4) | Counter amount + message + below-market-value warning + [Send Counter] |
| **Below Market Value Warning** | Counter-offer / low offers | Inline warning: "This offer is below the standard market rate" |

---

## 14. Screen Count Summary

| Section | Total | Built | Remaining |
|---------|-------|-------|-----------|
| Auth & Onboarding | 5 | 5 | 0 |
| Splash | 1 | 0 | 1 |
| Dashboard/Feed | 2 | 2 | 0 |
| Post Creation | 4 | 4 | 0 |
| Post Detail & Offers | 9 | 7 | 2 |
| My Posts / My Offers | 2 | 2 | 0 |
| Transactions | 4 | 3 | 1 |
| Messages | 2 | 2 | 0 |
| Profile & Settings | 14 | 11 | 3 |
| Reviews | 1 | 1 | 0 |
| Admin | 7 | 0 | 7 |
| Promotions (Phase 2) | 3 | 0 | 3 |
| **Total** | **~54** | **37** | **17** |

### Changes from Transcript Audit (April 16, 2026)
- **Added 5.4a** Counter-Offer Modal (Feb 6th, April 14th sessions)
- **Added 7.4** Dispute Detail Screen for users (Feb 6th, Feb 8th, PRD)
- **Added 12.1-12.3** Promotions screens — Phase 2 (Feb 12th session)
- **5.2** Budget Range kept visible on Seller View (overridden — seller needs to see buyer budget)
- **Added** "Countered" filter to My Offers (6.2)
- **Added** "Renew Post" action to Post Detail (5.1)
- **Added** "Saved Sellers" to Profile menu (9.1) and Public Profile (9.3)
- **Added** Below Market Value Warning to counter-offer flow (April 14th session)
- **Added** Counter-Offer and Below Market Value Warning to Modals table

### Changes from Phase 3 / Epic #8 Closeout (June 10, 2026)
- **9.3 Public Profile** marked `[BUILT — Issue #21]`; document updated to reflect animated save/unsave button and overflow menu
- **9.3a Saved Sellers Screen** added as new entry `[BUILT — Issue #21]`
- **5.4a Counter-Offer Modal** marked `[BUILT — Issue #16]`; round indicator added to element list
- **4.2 AI Post Creation** preview phase documented with optional photo picker (Issue #25)
- **9.2a Change Password** marked `[BUILT]`
- **Reviews row** corrected: 10.1 Submit Review is built (was incorrectly showing 0)
- **All row counts recounted** — Profile & Settings expanded to 14 entries (was approximate "10+"); total corrected to ~54 / 37 built
