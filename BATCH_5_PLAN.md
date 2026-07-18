# Batch 5: Transactions — Execution Plan

Restyle the transaction/payment tracking experience (4 screens) to match the TSX designs.

## Prerequisites (from Batches 1–4 ✅)
- All shared widgets, gradient system, seller avatar pattern
- StatusBadge with pulsing dot

---

## Step 1: Restyle `transactions_screen.dart` (TransactionsScreen)

**Design ref:** `TransactionsScreen.tsx`
**Flutter file:** `mobile/lib/features/transactions/presentation/screens/transactions_screen.dart`

**Keep:** `transactionsProvider`, role-based rendering (buyer/seller), navigation.

**Restyle:**
1. **Header:** "Transactions" (22px, w900) + role indicator badge
2. **Stats summary row:** 4 colored stat pills (Active, Pending, Completed, Total Value)
3. **Filter tabs:** All, In Progress, Awaiting Approval, Completed, Cancelled
   - Same gradient pill style as My Posts screen
4. **Sort dropdown:** Purple-bordered pill
5. **Transaction cards:** Each card:
   - Left accent bar (3px, color by status)
   - Counterparty avatar + name + verified badge
   - Post title (14px, w600, 1 line)
   - Amount badge: Large purple text
   - Status badge (reuse StatusBadge)
   - Progress bar: Milestones done / total (gradient fill)
   - Escrow indicator: Lock icon + "Funds held in escrow"
   - Next action button: "Approve", "Release Payment", "Leave Review", etc.
   - Time ago (11px, grey)
6. **Empty state:** Transaction illustration + "No transactions yet"

---

## Step 2: Restyle `transaction_detail_screen.dart` (TransactionDetailScreen — buyer view)

**Design ref:** `TransactionDetailScreen.tsx`
**Flutter file:** `mobile/lib/features/transactions/presentation/screens/transaction_detail_screen.dart`

**Keep:** `transactionDetailProvider`, action handlers (approve, release, dispute).

**Restyle:**
1. **Header:** Back button + "Transaction" + overflow menu
2. **Status banner:** Full-width colored bar with status + icon
3. **Counterparty card:** Avatar + name + rating + "Message" button
4. **Post reference:** Title + category badge (tappable to view post)
5. **Payment breakdown card:** (purple-tinted bg, rounded-18)
   - Offer amount
   - Platform fee
   - Total paid
   - Escrow status indicator (locked/released)
6. **Milestone timeline:** Vertical stepper
   - Completed steps: green checkmark + line
   - Current step: pulsing purple dot
   - Pending steps: grey dot
   - Steps: Payment → Work Started → Before Photos → After Photos → Approval → Payout
7. **Before/After photos section:** Side-by-side comparison grid
8. **Action buttons:** Contextual based on status
   - "Approve & Release" gradient (when awaiting approval)
   - "Request Changes" outline
   - "Open Dispute" red outline
9. **Activity log:** Collapsible timeline of events

---

## Step 3: Restyle `seller_transaction_detail_screen.dart` (SellerTransactionDetailScreen)

**Design ref:** `SellerTransactionDetailScreen.tsx`
**Flutter file:** `mobile/lib/features/transactions/presentation/screens/seller_transaction_detail_screen.dart`

**Keep:** Upload photos logic, mark complete, provider.

**Restyle:**
1. Same structure as buyer detail but with seller-specific actions:
   - "Upload Before Photos" button (when work started)
   - "Upload After Photos" button (when work completed)
   - "Mark as Complete" gradient button
2. **Photo upload grid:** 3-column, dashed border empty cells, thumbnail filled cells
3. **Earnings card:** Shows amount after fees + estimated payout date
4. **Client info section:** Buyer name + rating
5. **Requirements checklist:** From post requirements field

---

## Step 4: Restyle `dispute_detail_screen.dart` (DisputeDetailScreen)

**Design ref:** `DisputeDetailScreen.tsx`
**Flutter file:** `mobile/lib/features/transactions/presentation/screens/dispute_detail_screen.dart`

**Keep:** Dispute provider, resolution logic.

**Restyle:**
1. **Red-tinted header banner:** "Dispute Open" with warning icon
2. **Dispute info card:** Reason, filed date, status
3. **Evidence section:** Photos/screenshots uploaded by both parties
4. **Message thread:** Communication between parties + admin
5. **Resolution options:** "Resolve" / "Escalate" buttons
6. **Timeline:** Dispute events

---

## Execution Order

| # | Task | Depends On | Complexity |
|---|------|-----------|------------|
| 1 | `transactions_screen.dart` | StatusBadge | High |
| 2 | `transaction_detail_screen.dart` | — | High |
| 3 | `seller_transaction_detail_screen.dart` | — | High |
| 4 | `dispute_detail_screen.dart` | — | Medium |

---

## Key Design Tokens (Batch 5)

| Token | Value | Usage |
|-------|-------|-------|
| Progress bar height | 6px | Milestone progress |
| Progress bar bg | `#E5E7EB` | Unfilled track |
| Progress bar fill | gradient | Filled portion |
| Escrow lock color | `#7C3AED` | Lock indicator |
| Milestone dot active | 12px, gradient | Current step |
| Milestone dot done | 12px, green | Completed step |
| Milestone dot pending | 8px, grey | Future step |
| Dispute banner bg | `rgba(239,68,68,0.08)` | Dispute header |
| Photo grid cell | 1:1 aspect, rounded-12 | Upload grids |
