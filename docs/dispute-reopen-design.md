# Dispute → Conversation Reopen with Admin (Future Design)

**Status:** Design only — NOT implemented. Captures a product decision so the work is
ready when the dispute resolution center is built.

## Context

When a transaction completes (buyer-approved or 7-day auto-release), its buyer↔seller
conversation is locked read-only via `Conversation.lockedAt` — the thread stays visible
but no new messages can be sent (see `MessagesService.lockConversationByTransactionId`
and the `lockedAt` guard in `MessagesService.sendMessage`). Conversations are created at
offer-submit time and seeded with the seller's pitch (#305).

**Desired future behavior:** if a *completed* transaction is later **disputed**, the
conversation must **reopen** so the buyer and seller can communicate again — but with a
**Sorcyn admin added as a participant** who can read the full message history. This is a
side effect of opening a dispute through the dispute resolution center.

**The blocker:** `Conversation` supports exactly two participants
(`participant1Id` / `participant2Id`). Adding an admin as a third participant requires a
schema change. All migrations must remain **additive / forward-compatible** (CI-enforced:
no DROP / RENAME / SET NOT NULL on existing columns).

## Schema change options for a 3rd participant

**Option A — `ConversationParticipant` join table (recommended).**
New table `(conversationId, userId, role: buyer|seller|admin, addedAt, removedAt?)`.
Supports N participants and an audit trail of who joined/left and when. Keep the existing
`participant1Id` / `participant2Id` columns for back-compat reads during a transition
period; backfill the join table lazily. Cleanest long-term; more code (every participant
lookup/auth check migrates to the join table).

**Option B — nullable `adminId` column on `Conversation`.**
Add `adminId String? @map("admin_id")` plus an `addedAt`. Minimal additive change and fast
to ship, but caps participation at three and bakes in the buyer/seller/admin role
assumption. Acceptable as an interim if only ever one admin joins; rejected as the
end-state because it doesn't generalize.

Either way: **additive only** — never rename `participant1Id`/`participant2Id`.

## Reopen flow (to implement later)

On dispute creation (`DisputesService.createDispute`, which already sets the transaction to
`disputed` and has `transactionId`):

1. Find the conversation by `transactionId` (already linked at offer acceptance — see
   `acceptOffer`'s post-commit reconciliation that sets `Conversation.transactionId`).
2. **Reopen** it. Prefer adding a distinct `disputeReopenedAt` timestamp rather than only
   clearing `lockedAt`, so "completed but reopened for dispute" stays distinguishable from
   "never completed". The `sendMessage` lock guard then treats a reopened-for-dispute
   thread as writable (e.g. writable when `lockedAt == null` **or** `disputeReopenedAt != null`).
3. **Add the admin participant** (Option A row with `role: 'admin'`, or set `adminId`).
   Assign/derive the admin from the dispute's `assignedAgentId` when present.
4. On dispute resolution/close, **re-lock** the thread (set `lockedAt` again, clear the
   reopen marker, optionally `removedAt` on the admin participant row).

## Admin full-history visibility

There is no per-message ACL today — message reads are gated only by conversation
participation. So once the admin is a participant, they automatically see the **entire**
message history, including any `flagged` / `moderationStatus: 'pending'` messages. Confirm
during build that the admin view intentionally surfaces flagged messages (it should, for
adjudication).

## Open question

Are admin messages visible to both buyer and seller (one shared thread), or should the
admin communicate through a separate admin-only side channel? This affects whether the
reopened thread is the same `Conversation` (recommended for full context) or a new one.
Decide with product when the dispute resolution center is scoped.

## Related code

- `backend/prisma/schema.prisma` — `Conversation` model (`lockedAt`, `transactionId`,
  participant columns).
- `backend/src/modules/messages/messages.service.ts` — `sendMessage` lock guard,
  `lockConversationByTransactionId`.
- `backend/src/modules/transactions/transactions.service.ts` (`approveAndRelease`) and
  `backend/src/config/bullmq.ts` (auto-release worker) — where threads get locked.
- `backend/src/modules/disputes/disputes.service.ts` — `createDispute` (the future reopen
  hook point).
