# Codebase Concerns

**Analysis Date:** 2026-02-27

## Tech Debt

**Large Monolithic Service Classes:**
- Issue: Service classes are extremely large (admin: 783 LOC, posts: 682 LOC, offers: 647 LOC, auth: 561 LOC, transactions: 554 LOC), mixing multiple responsibilities
- Files: `backend/src/modules/admin/admin.service.ts`, `backend/src/modules/posts/posts.service.ts`, `backend/src/modules/offers/offers.service.ts`, `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/transactions/transactions.service.ts`
- Impact: Difficult to test individual features, high cognitive load, increased risk of unintended side effects when modifying code, violation of single responsibility principle
- Fix approach: Extract helper classes/utilities from services (e.g., PaymentProcessor, OfferValidator, AdminAuditLog). Use composition over monolithic methods. Consider domain-driven design with separate aggregate roots.

**Manual Test Function in Tests Directory:**
- Issue: `backend/tests/manual-test.sh` exists in automated test suite, suggests incomplete test implementation or manual validation being tracked
- Files: `backend/tests/manual-test.sh`
- Impact: Risk of running manual scripts accidentally during CI/CD, unclear testing workflow
- Fix approach: Remove manual test scripts from test directory; document manual testing procedures in separate docs/testing guide or external wiki.

**Inconsistent Timeline/Audit Logging:**
- Issue: Timeline data stored as JSONB in transaction model; messages service manually constructs timeline entries; audit log pattern not standardized across modules
- Files: `backend/src/modules/payments/payments.service.ts` (line 289-295), `backend/src/modules/transactions/transactions.service.ts`
- Impact: Timeline serialization/deserialization inconsistencies, difficult to query audit trail, risk of data corruption with `Prisma.InputJsonValue` type coercion
- Fix approach: Create an `AuditLog` service with typed timeline entry creation. Use a dedicated audit log table or event sourcing pattern for critical operations.

**Redis Key Expiry Not Always Enforced:**
- Issue: `storeRefreshToken()` in auth service (line 449-468) relies on manual `EX` parameter in Redis operations; no centralized TTL management
- Files: `backend/src/modules/auth/auth.service.ts`
- Impact: Potential for stale tokens in Redis if TTL not properly set; inconsistent expiry values across different token types
- Fix approach: Create a `RedisTokenStore` class with typed methods for `setAccessToken()`, `setRefreshToken()`, `setVerificationToken()` that enforce consistent TTLs.

---

## Known Bugs

**Payment Intent Status Tracking Gap:**
- Symptoms: `handlePaymentIntentFailed` webhook only logs failed payment to timeline; doesn't update transaction status or notify user
- Files: `backend/src/modules/payments/payments.service.ts` (line 280-301)
- Trigger: Stripe `payment_intent.payment_failed` webhook for any transaction
- Workaround: Check transaction timeline in DB to diagnose payment failures. Manual user notification required via admin panel.
- Fix: Update transaction status to `cancelled` or `payment_failed` state; emit notification through NotificationsService with user email + push.

**AI Image Suggestions Always Use Unsplash:**
- Symptoms: `suggestProductImages()` always generates fake Unsplash URLs without actual image validation
- Files: `backend/src/modules/posts/ai-assist.service.ts` (line 90-123)
- Trigger: POST `/api/v1/posts/ai-assist/suggest-images` endpoint
- Workaround: None - users see placeholder URLs that may 404 or break on client
- Fix: Integrate real Unsplash API or remove feature until proper image service available.

**Category Slug Resolution Fallback is Silent:**
- Symptoms: If AI-generated category slug doesn't match any DB category, code silently falls back to first active category (line 231-238 in ai-assist.service.ts) without warning
- Files: `backend/src/modules/posts/ai-assist.service.ts` (line 222-252)
- Trigger: POST `/api/v1/posts/ai-assist/parse` when AI returns category slug that doesn't exist in database
- Workaround: Manually re-categorize post after creation via update endpoint
- Fix: Log warning with mismatched slug; return error or suggest correction to user instead of silent fallback.

---

## Security Considerations

**Webhook Signature Verification Missing Error Details:**
- Risk: Stripe webhook signature verification failure returns generic 400 "Invalid webhook signature" without logging suspicious activity
- Files: `backend/src/modules/payments/payments.webhook.ts` (line 28-36)
- Current mitigation: Request logging via Fastify logger (minimal)
- Recommendations: Log all webhook verification failures with signature value hash, IP address, and timestamp for fraud detection. Implement IP whitelist for Stripe webhooks.

**Password Reset Token Rate Limiting Logic Flaw:**
- Risk: `forgotPassword()` increments daily reset count but doesn't prevent token generation on subsequent attempts after limit exceeded (line 331 returns silently)
- Files: `backend/src/modules/auth/auth.service.ts` (line 317-343)
- Current mitigation: Silent return (prevents email enumeration but still accepts request)
- Recommendations: Return explicit error after limit exceeded OR disable password reset entirely for that email for 24h. Consider CAPTCHA on 2+ attempts.

**Timing Attack Vulnerability in Login:**
- Risk: Although code uses dummy hash comparison to prevent enumeration (line 129-130), the bcrypt.compare() operation may still have microsecond differences between valid/invalid passwords
- Files: `backend/src/modules/auth/auth.service.ts` (line 108-161)
- Current mitigation: Dummy hash used when user not found
- Recommendations: Use constant-time comparison library explicitly; consider adding jitter to response time to mask bcrypt timing.

**JWT Token Blacklist Not Garbage Collected:**
- Risk: Blacklisted access tokens stored in Redis with TTL set correctly, but no mechanism to handle Redis memory pressure or stale entries
- Files: `backend/src/modules/auth/auth.service.ts` (line 237-243)
- Current mitigation: TTL is set to access token lifetime
- Recommendations: Implement Redis eviction policy (allkeys-lru). Monitor Redis memory usage. Consider using token jti in a bloom filter instead of full Redis entries for scale.

**File Upload MIME Type Validation Only on Upload:**
- Risk: Client can spoof Content-Type header; server validates against whitelist but no deep inspection of actual file content
- Files: `backend/src/common/utils/storage.ts` (line 68-86)
- Current mitigation: MIME type whitelist enforced
- Recommendations: Use file magic bytes verification (e.g., `file-type` library) to validate actual file content before upload. Scan for malware in verification-docs and portfolio uploads.

**No Rate Limiting on AI Endpoints:**
- Risk: AI rate limit (20 req/hour per user) is enforced only in memory via Redis, no per-IP or per-session backup limiting
- Files: `backend/src/modules/posts/ai-assist.service.ts` (line 170-177)
- Current mitigation: Per-user Redis counter
- Recommendations: Add Fastify rate-limit middleware at route level. Implement exponential backoff for rate-limited users. Track suspicious patterns across multiple accounts.

**External Payment Service Detection Regex Not Exhaustive:**
- Risk: `PAYMENT_REGEX` in messages service (line 21) only detects common US payment apps (Venmo, Cash App, Zelle, PayPal); misses Apple Pay, Google Pay, cryptocurrency wallets, bank transfers
- Files: `backend/src/modules/messages/messages.service.ts` (line 21)
- Current mitigation: Regex pattern limited
- Recommendations: Expand regex to include all known payment methods. Implement machine learning-based pattern detection or manual review queue for suspicious messages.

---

## Performance Bottlenecks

**N+1 Query in Conversation Listing:**
- Problem: `listConversations()` fetches up to `limit` conversations with includes but doesn't batch-load participant and post data efficiently
- Files: `backend/src/modules/messages/messages.service.ts` (line 28-56)
- Cause: Prisma include with nested relationships on every conversation record
- Improvement path: Implement select instead of include where possible. Paginate with cursor-based pagination. Cache frequently accessed conversation metadata.

**Unoptimized Admin Audit Log Retrieval:**
- Problem: Admin service likely retrieves large audit log result sets without pagination or filtering by date range
- Files: `backend/src/modules/admin/admin.service.ts` (783 LOC - actual audit log methods not fully visible)
- Cause: Full table scans on large auditLog table as platform grows
- Improvement path: Add composite indexes on (userId, createdAt). Implement date range filtering UI. Archive audit logs older than 1 year to separate cold storage.

**Redis Scan in Auth Session Invalidation:**
- Problem: `invalidateAllSessions()` uses SCAN to delete all refresh tokens for a user; O(N) operation that blocks on large user base
- Files: `backend/src/modules/auth/auth.service.ts` (line 488-504)
- Cause: No index on Redis keys by userId prefix; scanning entire keyspace
- Improvement path: Use Redis Streams or sorted sets with userId + timestamp for faster lookups. Maintain session ID list per user in separate key.

**Notification Delivery Not Batched:**
- Problem: `NotificationsService` creates individual BullMQ jobs per notification; no batching for bulk notifications (e.g., new offers to multiple sellers)
- Files: `backend/src/modules/notifications/notifications.service.ts` (line 26-35)
- Cause: Single notification = single job
- Improvement path: Implement BullMQ batch queue. Group notifications by user and delivery channel. Aggregate email notifications into single digest.

**No Database Query Result Caching:**
- Problem: Categories tree, user profiles, seller profiles are likely queried on every request without caching
- Files: Multiple modules (categories, users, sellers)
- Cause: Reliance on Prisma without application-level caching
- Improvement path: Add Redis cache layer with 5-30 min TTL for reference data. Implement cache invalidation on update. Use stale-while-revalidate pattern for UI-driven queries.

---

## Fragile Areas

**Payment Processing State Machine:**
- Files: `backend/src/modules/payments/payments.service.ts`, `backend/src/modules/transactions/transactions.service.ts`
- Why fragile: Multiple services (PaymentsService, TransactionsService, PaymentsWebhook) coordinate escrow state changes. No transactional guarantee that webhook succeeds and DB updates atomically.
- Safe modification: Add transaction ID validation in every webhook handler. Implement idempotency keys for Stripe webhook processing. Add database-level triggers to validate state transitions.
- Test coverage: Payment state transitions have limited test coverage; webhook handler logic not fully tested.

**AI Post Parsing with Fallback Logic:**
- Files: `backend/src/modules/posts/ai-assist.service.ts` (line 26-86)
- Why fragile: Silent fallback to first category if AI returns unknown slug breaks user intent; no way to detect miscategorized posts later
- Safe modification: Return validation error instead of silently falling back. Implement post categorization review step for AI-generated posts.
- Test coverage: Category slug resolution fallback path not tested.

**Message Rate Limiting in Service Layer:**
- Files: `backend/src/modules/messages/messages.service.ts` (line 17-18)
- Why fragile: Rate limit enforced at service layer (50/hr per user) but no route-level backup. If service layer bypassed, limit can be exceeded.
- Safe modification: Move rate limiting to route-level middleware. Add distributed rate limiting with Redis that survives server restart.
- Test coverage: Rate limit logic likely tested for happy path but not for concurrent edge cases.

**Admin Action Audit Trail:**
- Files: `backend/src/modules/admin/admin.service.ts`
- Why fragile: Admin actions (user suspension, account deletion, payment holds) lack real-time notification to affected users. No confirmation email sent.
- Safe modification: Send notification email on every admin action affecting user account. Implement admin action approval workflow for critical operations.
- Test coverage: Admin action notifications not tested.

---

## Scaling Limits

**Redis Memory for Session Storage:**
- Current capacity: 1000s of concurrent users (each with 1-2 refresh tokens + various auth keys)
- Limit: At 1M DAU with 10% concurrent sessions, Redis could store 100k+ tokens. Each token entry ~200 bytes = ~20MB, plus overhead
- Scaling path: Migrate to Redis cluster or sentinel mode. Implement session TTL garbage collection. Switch to stateless JWT with signature verification only (remove Redis storage).

**Stripe Connect Account Creation Rate:**
- Current capacity: 1 Stripe account created per seller onboarding (~10/day in MVP)
- Limit: Stripe has undocumented per-minute rate limits; no exponential backoff or retry logic in `startSellerOnboarding()`
- Scaling path: Implement exponential backoff in Stripe API calls. Queue seller onboarding with BullMQ. Monitor Stripe API response codes for rate limit 429.

**Message Table Growth:**
- Current capacity: Unbounded message storage; no archival strategy
- Limit: At 1K conversations with 100 messages each (100K messages), pagination becomes slow without proper indexes
- Scaling path: Add (conversationId, createdAt) composite index. Implement message archival after 1 year (move to separate cold storage table). Implement full-text search with Elasticsearch (Phase 2).

**Notification Queue Throughput:**
- Current capacity: BullMQ can handle 1000s of jobs in Redis queue
- Limit: If 1M users receive notification simultaneously, queue backs up; Firebase Cloud Messaging may rate-limit
- Scaling path: Increase BullMQ concurrency. Batch notifications to FCM (up to 500 per request). Implement exponential backoff for failed pushes. Use SNS or Twilio for SMS scaling.

---

## Dependencies at Risk

**Prisma 7 Adapter Pattern (New):**
- Risk: `@prisma/adapter-pg` is relatively new (added in v7); migration path unclear if Prisma drops support
- Impact: Would require rewriting all data access if adapter deprecated
- Migration plan: Monitor Prisma roadmap. Consider abstraction layer over Prisma for critical paths. Have fallback plan to pg driver directly.

**Firebase Cloud Messaging Token Storage:**
- Risk: FCM tokens expire and change; no refresh mechanism implemented. Storing in `user.fcmToken` as single string limits to one device per user.
- Impact: Push notifications fail silently if token stale. Multi-device users only get push on last-registered device.
- Migration plan: Implement FCM token refresh on app startup. Store array of tokens per user. Implement token invalidation on push failure.

**Google Gemini Flash-Lite (Free Tier):**
- Risk: 1K requests/day free limit may be insufficient for MVP with 100+ DAU. No upgrade path documented. API may change post-preview.
- Impact: AI-assisted post creation unavailable after quota exceeded. Users forced to create posts manually.
- Migration plan: Implement queue with job backoff for exceeded quota. Upgrade to paid Gemini tier pre-launch. Have fallback to OpenAI GPT-4 Turbo or Anthropic Claude.

**BullMQ Redis Dependency:**
- Risk: BullMQ stores all job state in Redis; if Redis goes down, queued notifications/jobs lost (no persistence)
- Impact: Missed notifications, incomplete transactions, payment state inconsistencies
- Migration plan: Implement Redis persistence (AOF). Add database-backed queue as fallback (e.g., PostgreSQL-backed job queue). Monitor Redis memory and implement eviction policies.

**Stripe Connect Destination Charges Model:**
- Risk: Stripe Connect API changes or deprecation could break payment flow. No fallback payment processor integrated.
- Impact: Payments fail; escrow release broken; entire transaction flow blocked
- Migration plan: Evaluate Adyen, PayPal Commerce Platform as backup processors. Implement payment processor abstraction layer. Add feature flags for processor switching.

---

## Missing Critical Features

**No Idempotency for Webhook Processing:**
- Problem: Stripe webhooks can be replayed; if payment_intent.succeeded fires twice, transaction could be double-released
- Blocks: Safe payment processing at scale; compliance with PCI standards
- Fix: Implement idempotency key tracking (idempotency_key stored per webhook event). Check key before processing; return cached result if duplicate.

**No Dispute/Chargeback Handling:**
- Problem: Schema has Dispute table but no service or routes; Stripe chargebacks have no automated response
- Blocks: User confidence in refund/protection; compliance with card network rules
- Fix: Implement DisputesService with evidence upload flow. Auto-respond to Stripe chargebacks with evidence. Notify users of disputes with evidence submission deadline.

**No Seller Payout Scheduling:**
- Problem: Escrow release doesn't automatically trigger payout; no schedule for Stripe payout transfers
- Blocks: Sellers never receive funds; trust erosion
- Fix: Implement PayoutScheduler service. Daily batch payout creation at fixed time. Seller payout history dashboard.

**No Message Moderation/Content Filtering:**
- Problem: Messages service detects external payment mentions but takes no action; no spam/abuse filtering
- Blocks: Users can arrange payments off-platform; fraudster coordination possible
- Fix: Implement ModerationService with automated message flags. Manual review queue for flagged conversations. Soft-delete suspicious messages.

**No Notification Unsubscribe Flow:**
- Problem: No unsubscribe URL in transactional emails; users can't opt out of specific notification types via email link
- Blocks: Email deliverability degradation; GDPR/CAN-SPAM compliance
- Fix: Add one-click unsubscribe links in all transactional emails. Implement unsubscribe endpoint that updates notificationPreferences.

---

## Test Coverage Gaps

**Payment Webhook Edge Cases:**
- What's not tested: Duplicate webhooks (same payment_intent.succeeded fired twice), partial refunds, failed refunds, Stripe account suspended mid-transaction
- Files: `backend/src/modules/payments/payments.webhook.ts`, `backend/src/modules/payments/payments.service.ts`
- Risk: Silent failures in payment flow; data corruption in escrow_status
- Priority: High - payment failures directly cause financial loss

**Transaction State Transitions:**
- What's not tested: Invalid state transitions (e.g., completed → awaiting_approval), concurrent status updates, middleware state conflict
- Files: `backend/src/modules/transactions/transactions.service.ts`
- Risk: Transaction stuck in invalid state; user unable to complete or refund
- Priority: High - blocks core marketplace flow

**Admin Actions & Audit Trail:**
- What's not tested: Admin suspension of active seller, effect on in-progress transactions; admin refund of held escrow; concurrent admin + user actions
- Files: `backend/src/modules/admin/admin.service.ts`, `backend/src/modules/admin/admin.routes.ts`
- Risk: Inconsistent system state; audit trail corruption
- Priority: Medium - affects trust and compliance

**Message Rate Limiting & Payment Detection:**
- What's not tested: Rate limit boundary conditions (exactly 50 messages); concurrent messages from same user; payment regex edge cases (creative spellings)
- Files: `backend/src/modules/messages/messages.service.ts`
- Risk: Rate limit bypass; missed off-platform payment arrangements
- Priority: Medium - impacts user safety

**AI-Assisted Post Creation & Categorization:**
- What's not tested: Malformed AI responses; category fallback scenarios; image URL generation with invalid product names; concurrent AI requests
- Files: `backend/src/modules/posts/ai-assist.service.ts`
- Risk: Silent categorization failures; placeholder image URLs breaking in UI
- Priority: Medium - affects post quality and user experience

**Authentication Session Rotation:**
- What's not tested: Refresh token reuse detection with concurrent requests; token rotation race conditions; session invalidation on password reset during active session
- Files: `backend/src/modules/auth/auth.service.ts`
- Risk: Session hijacking; stale tokens accepted
- Priority: High - security-critical

---

*Concerns audit: 2026-02-27*
