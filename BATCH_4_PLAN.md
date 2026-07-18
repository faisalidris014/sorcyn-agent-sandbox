# Batch 4: Messages — Execution Plan

Restyle the messaging experience (2 screens) to match the TSX designs.

## Prerequisites (from Batches 1–3 ✅)
- All shared widgets, AppColors, gradient system
- Seller avatar pattern established in Batch 3

---

## Step 1: Restyle `conversations_screen.dart` (MessagesScreen)

**Design ref:** `MessagesScreen.tsx`
**Flutter file:** `mobile/lib/features/messages/presentation/screens/conversations_screen.dart`

**Keep:** `conversationsProvider`, navigation to chat, unread counts.

**Restyle:**
1. **Header:** "Messages" title (22px, w900) + search icon button (40×40 rounded-12 container)
2. **Search bar** (collapsible): Animated expand below header on search icon tap
   - Rounded-14, grey bg, search icon prefix, clear button
3. **Filter tabs:** Horizontal scroll — All, Unread, Buyers, Sellers
   - Active: gradient bg pill, white text
   - Inactive: white pill, border
   - Unread count badge on "Unread" tab
4. **Conversation cards:** Each row:
   - Avatar: 48px gradient circle with initials + online status dot (bottom-right, green/yellow/grey)
   - Content column:
     - Row 1: Name (14px, w700) + time (11px, grey, right-aligned)
     - Row 2: Post title context line (11px, purple, truncated)
     - Row 3: Last message preview (12px, grey, 1 line) — bold if unread
   - Unread badge: Purple gradient circle with count (right side)
   - Pinned indicator: Small pin icon (top-right of avatar)
   - Offer badge: "$X offer" purple pill if hasOffer
5. **Swipe actions:** Swipe left for pin/mute/archive (dismissible)
6. **Empty state:** Chat bubble illustration + "No messages yet"
7. **Staggered entrance:** Cards fade-in with 40ms delay each

---

## Step 2: Restyle `chat_screen.dart` (ChatScreen)

**Design ref:** `ChatScreen.tsx`
**Flutter file:** `mobile/lib/features/messages/presentation/screens/chat_screen.dart`

**Keep:** WebSocket/API message sending, message provider, real-time updates.

**Restyle:**
1. **App bar:**
   - Back button (38×38 container)
   - Avatar (36px) + Name + Online status text
   - More options button (triple dot, 38×38)
2. **Message bubbles:**
   - Sent (right): Gradient bg (#7C3AED → #A855F7), white text, rounded-18 (no bottom-right radius)
   - Received (left): #F3F4F6 bg, dark text, rounded-18 (no bottom-left radius)
   - Timestamp below each cluster (11px, grey, centered)
   - "Seen" indicator for sent messages
3. **Offer message card:** Special bubble type
   - Purple-tinted card, shows offer amount + "View Offer" button
   - Distinct from regular message bubbles
4. **Date separators:** Pill-shaped ("Today", "Yesterday", "Apr 14")
5. **Typing indicator:** 3 bouncing dots in received bubble style
6. **Input bar:**
   - Rounded-24 container with white bg + border
   - Attachment button (left)
   - Text input (flex-1)
   - Send button: 40×40 gradient circle, arrow icon, disabled when empty
   - Max height: 120px (expands with text)
7. **Quick replies** (optional): Horizontal scroll of suggested responses above input

---

## Execution Order

| # | Task | Depends On | Complexity |
|---|------|-----------|------------|
| 1 | `conversations_screen.dart` | — | High |
| 2 | `chat_screen.dart` | — | High |

---

## Key Design Tokens (Batch 4)

| Token | Value | Usage |
|-------|-------|-------|
| Avatar size (list) | 48px | Conversation cards |
| Avatar size (chat header) | 36px | Chat app bar |
| Sent bubble bg | gradient #7C3AED → #A855F7 | Chat sent messages |
| Received bubble bg | `#F3F4F6` | Chat received messages |
| Bubble radius | 18px | Both sent/received |
| Input bar height | 52px (min) | Chat input |
| Send button size | 40px | Chat input |
| Online dot | 10px, `#10B981` | Status indicators |
| Away dot | 10px, `#F59E0B` | Status indicators |
| Unread badge | gradient circle | Conversation list |
