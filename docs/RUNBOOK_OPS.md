# Post-Launch Ops Runbook

> Third-party outage playbooks + on-call rotation for Sorcyn v1.1 launch.
> Scope: human/process side of incidents. Infrastructure drills live in `docs/runbooks/` (canary, rollback, DR, observability).
> Issue: [v1.1-E3-04] #40. REQ: NFR-uptime + REQ-cold-start-launch. Phase: 5.
>
> **User-facing language rule:** Never name our payment provider in any user-visible string. Always say "our payment processor" — internal docs and code may use "Stripe."

---

## 1. On-Call Rotation (v1.1 — Faisal / Mohamed)

Sorcyn launches with a two-person on-call rotation between Faisal and Mohamed. Cadence is **as-needed swap** — whoever is available picks up the alert; the other backs them up. No fixed weekly rotation. The primary on a given incident owns initial response; the other auto-escalates if the primary does not acknowledge within 15 minutes or explicitly escalates.

| Role | Primary | Backup | Hours | Swap cadence |
|------|---------|--------|-------|--------------|
| Incident Commander | Faisal / Mohamed | The other | 24/7 | As-needed basis swap |
| Engineering | Faisal / Mohamed | The other | 24/7 | As-needed basis swap |
| Customer Comms | Faisal / Mohamed | The other | Business hours (08:00–20:00 CT) | As-needed basis swap |
| Payments | Faisal / Mohamed | The other | 24/7 | As-needed basis swap |

**Acknowledgement protocol:**
- "Acknowledged" means replying to the alert in the paging tool (Better Stack's native Ack button counts).
- Default ack window: **15 minutes**. After 15 min with no ack, Better Stack escalates to the backup.
- 10-min and 30-min ack windows are documented future options; revisit during a tabletop or after first real incident.

**Customer comms during incidents:** Primary handles user-facing messaging by default. If the secondary is also available and offers, the primary takes the technical fix and the secondary takes user comms. The model is open-ended collaboration — not a strict handoff — but **one of them owns user comms at all times.**

Both Faisal and Mohamed are in **Central Time (CT)** — DFW-based.

**Hand-off trigger to a 3-person rotation:** Expand to a 3-person rotation when **any** of the following is true:
- 6 months post-launch, AND budget allows for a third responder
- 500+ active sellers on the platform
- Faisal and Mohamed jointly decide a third responder is needed (capital, burnout, coverage gaps, or any other reason)

The third trigger exists because the first two could miss legitimate scaling pain — if Faisal and Mohamed agree the load justifies it, that decision overrides the headline targets. If the first two trigger but budget doesn't allow, document the deferral in `docs/incidents/` so it's not lost.

### 1a. Paging Stack

**Decision (revised 2026-05-25 per vendor stack audit, refined 2026-05-25 to drop Slack):** **Better Stack (free tier)** — single tool for paging, incident threading, uptime monitoring, and the public status page. Total cost $0/mo.

Originally specified Opsgenie + Slack. **Opsgenie is being shut down** — Atlassian stopped new Opsgenie signups in June 2025 and the product reaches full end-of-support on **April 5, 2027**. The vendor audit (May 2026) flagged this as a SWAP. Slack was retained briefly as a chat/handoff layer but has now also been dropped for incident coordination — Better Stack threads incidents natively, so a second tool just adds bookkeeping overhead for a 2-person team.

- **Better Stack** — paging + uptime + status page + incident threading. Free tier covers: phone-call ringing escalation (the "P1 wake-up at 2 AM" behavior), push, SMS, ack workflow, escalation policies, mobile app, uptime monitors, public status page (status.sorcyn.com), and native incident objects (each alert opens a thread where acks, comments, and post-mortem notes attach). Sentry integration available. Account setup + alert routing is **manual in the Better Stack dashboard** — tracked in a separate issue (see §9).

**Why no Slack (or any second chat tool) for incidents:** Better Stack threads incidents natively — alerts, acks, comments, post-mortem notes all live on the incident object. For a 2-person team, a separate chat tool for on-call adds overhead — context-switching between tools, duplicated thread bookkeeping, two sources of incident truth — without adding signal. Slack is **explicitly out of scope for incident coordination at launch**. If Faisal and Mohamed adopt Slack later for general team chat (non-incident), that's fine and does not require revisiting this section.

**Why Better Stack instead of Opsgenie:** Opsgenie EOL April 2027. Atlassian's migration path requires both Jira Service Management + Compass (two paid products). Existing free accounts function but the product is in maintenance mode with no new features. Don't build new infrastructure on a sunsetting tool.

**Why Better Stack instead of PagerDuty:** No free tier for production paging on PagerDuty anymore ($21+/user/mo). Better Stack matches the feature set for $0 and additionally collapses the status-page tool into the same vendor.

**Why Better Stack instead of SMS-only via Twilio:** No thread/history, no team context, no native ack workflow. Pay-per-message means a flapping monitor could rack up cost.

**Notification privacy:**
- iOS native setting: **Settings → Notifications → Show Previews → Never** hides notification content on lock screen and Notification Center; only the app name and a generic "Notification" label show until Face ID / passcode unlocks the device.
- Per-app override: same path, scroll to Better Stack → Show Previews → Never.
- Both Faisal and Mohamed must configure their phones this way before the tabletop exercise.

**Paging path (once provisioned):**
```
Better Stack monitor / Sentry alert
        ↓
Better Stack on-call (rings + pushes both phones)
        ↓
First responder acks → owns incident
If no ack in 15 min → escalates to backup
        ↓
Discussion + ack notes stay in the Better Stack incident thread
        ↓
Public incident posted to status.sorcyn.com (Better Stack status page)
        ↓
Post-mortem appended to the same Better Stack incident + filed to docs/incidents/
```

### 1b. Vendor Secrets — Doppler

**Decision (revised 2026-05-25 per vendor stack audit):** **Doppler** is the canonical secrets manager.

Originally specified Bitwarden free org. The vendor audit flagged that **Bitwarden is a password vault, not a secrets manager** — it has no CI/CD injection, no environment-scoped configs (dev/staging/prod), and no runtime secret rotation. Doppler is purpose-built for this:

- Free tier covers small teams; environment-scoped configs (dev / staging / prd) with inheritance
- `doppler run -- npm start` injects secrets as env vars at runtime — no `.env` files in production
- GitHub Actions integration injects secrets directly into workflows
- CLI: `doppler setup`, `doppler secrets`, `doppler run`
- Per-config audit log + access control

**Repo state:**
- `doppler.yaml` at project root maps `backend/` → `sorcyn-backend` project / `dev_personal` config
- `.gitignore` already excludes `.doppler/` (local auth state) and `backend/.env.doppler`
- `docs/SECRETS_INVENTORY.md` lists every secret by name (no values) and where it lives now
- See `CLAUDE.md` § "Secrets Management — Doppler" for CLI setup steps

Provisioning + migration of secrets from local `.env` into Doppler is tracked in a separate issue (see §9).

**Bitwarden is still useful for non-secret credentials** — Stripe Dashboard logins, Hetzner console passwords, Cloudflare account login — but it is no longer the system of record for runtime secrets. Sorcyn does not currently use Bitwarden either; if Faisal/Mohamed want a shared password manager for login credentials, set that up separately (Bitwarden free org is still fine for that purpose).

### Escalation Contacts

Status legend: **LIVE** = account exists and is wired into the app | **CODE-READY** = integration code is wired in the backend, but the vendor account has not been provisioned yet | **PLANNED** = no code and no account yet.

| Vendor | Used for | Channel | Account / Status |
|--------|----------|---------|------------------|
| Stripe | Escrow payments (Stripe Connect), buyer charges, seller payouts, webhook events | https://support.stripe.com (logged-in chat) + status.stripe.com | **CODE-READY** — Connect integration wired in `backend/src/modules/payments/`; live keys not yet provisioned |
| Google AI Studio (Gemini) | **API key origin** — where the `GEMINI_API_KEY` is generated and free-tier 1K req/day quota is tracked | https://aistudio.google.com (key management) + AI Studio support | **CODE-READY** — `getGeminiModel()` wired in `backend/src/config/gemini.ts`; key generated separately by Faisal/Mohamed |
| Google Cloud (Gemini billing/project) | Billing escalation + paid-tier upgrade path when free-tier 1K req/day is exhausted | https://status.cloud.google.com + Cloud Console support | **PLANNED** — only needed if/when we move off the AI Studio free tier |
| Firebase (FCM) | Push notifications to Flutter mobile clients (iOS + Android) | https://status.firebase.google.com + Firebase Console | **CODE-READY** — `firebase-admin` SDK wired in `backend/src/common/utils/push.ts`; Firebase project not yet created (env vars optional, push is stubbed if unset) |
| Resend (email) | Transactional email — verification, password reset, payment receipts, dispute updates, review reminders | https://status.resend.com + support@resend.com | **CODE-READY** — `resend` SDK wired in `backend/src/common/utils/email.ts` (swap from SendGrid landed 2026-06-15); Resend account not yet provisioned (env var optional, email is stubbed if unset) |
| Cloudflare (R2) | File storage (before/after photos, avatars, attachments) via S3-compatible R2 | https://www.cloudflarestatus.com + dashboard | **CODE-READY** — R2 client wired in `backend/src/common/utils/storage.ts`; R2 bucket + Cloudflare account not yet provisioned (env vars optional, uploads fail if unset). Domain currently on **name.com** (registrar); Cloudflare needed for R2 only at first, point name.com nameservers at Cloudflare when status page is set up |
| Supabase | Primary PostgreSQL database (16 Prisma models) | https://status.supabase.com + dashboard | **LIVE** — connection string in `prisma.config.ts`, app actively reads/writes |
| Hetzner (VPS) | Production hosting (VPS-A primary, VPS-B canary) | https://status.hetzner.com + console | **PLANNED** — deploy infra targets Hetzner but VPS nodes not yet provisioned |
| Better Stack | Paging (phone-call ringing) + native incident threading + uptime monitors + public status page (status.sorcyn.com) | https://status.betterstack.com + in-app support | **PLANNED** — account exists for log ingest (`BETTER_STACK_TOKEN` env var); on-call + status page features not yet enabled. Manual dashboard setup tracked in separate issue (see §9) |
| Doppler | Secrets manager (runtime env-var injection for backend) | https://status.doppler.com + in-app support | **CODE-READY** — `doppler.yaml` committed at project root (`sorcyn-backend` project / `dev_personal` config); Doppler account + project not yet created. See `docs/SECRETS_INVENTORY.md` |

Vendor account IDs (Stripe Dashboard login, Cloudflare login, etc.) live in a shared password manager once Faisal/Mohamed pick one. Runtime API keys + secrets live in Doppler per the inventory document. Do not commit either here.

---

## 2. Payment Processor Outage

> User-facing language: always say "our payment processor" — never name Stripe in any user-visible string.

**Detection:**
- Better Stack monitor on `/api/v1/payments/webhook` fails 2-of-3 regions
- `StripeWebhookFailureSpike` alert reaches Opsgenie via Better Stack integration
- status.stripe.com shows incident

**User impact:** Depends on transaction type. See behavior matrix below.

### Behavior matrix (locked decision)

| Transaction type | Behavior during payment-processor outage | User-facing message |
|---|---|---|
| **Local cash** (no payment-processor involvement, $0 fee) | Fully working, completely unaffected | None |
| **Standard transactions (under $500)** | Offer acceptance succeeds. Payment-intent creation is **queued** for retry once payment processor is back. Buyer's card is not yet charged. | *"Our payment processor is currently unavailable. Your offer is saved — we'll process your payment once our payment processor is back online."* |
| **High-value transactions ($500 and above)** | Offer acceptance is **blocked**. Buyer is told to try again shortly. | *"We're currently experiencing an outage with our payment processor. High-value transactions are paused. Please try again shortly or contact support."* |
| **Existing escrow** (already-paid, mid-transaction) | Fully working — funds already held, no payment-processor call needed | None |

**The $500 threshold is a placeholder for v1.1 launch.** Post-launch, after we have real Sorcyn transaction data from the soft launch, the threshold is to be re-evaluated based on actual distribution of transaction values, dispute rates at each value band, and buyer behavior. See follow-up issue (linked in §9).

### Graceful degrade (operator steps)

1. Set feature flag `STRIPE_DEGRADED=true` (env var on both VPS nodes, then `nginx -s reload`).
   - API queues payment-intent creation for offers under $500 (returns 202 Accepted with a "queued" status)
   - API returns 503 on payment-intent creation for offers $500 and above
   - API returns 503 on `POST /payments/refund` for all values
   - Other endpoints unaffected; messaging, posts, offers, search continue working
   - Local cash transactions continue working
2. Post status update via admin announcement endpoint — populates the in-app banner with the matrix wording (Flutter app reads `system_announcements`, see §9 issue 40b)
3. Post incident to status.sorcyn.com via BetterStatus (manual update from the operator)
4. Cross-post to social media (Twitter / Instagram / LinkedIn / TikTok) if outage exceeds 30 minutes — use the social-media template in `docs/incidents/social-media-templates.md` (template TBD)
5. If outage exceeds 24 hours, email blast to active users via Resend (admin endpoint, see §9 issue 40b)

### Recovery

1. Wait for status.stripe.com to mark resolved
2. Unset `STRIPE_DEGRADED`, reload Nginx
3. Verify with curl: `POST /api/v1/payments/intent` returns 200 against a test offer
4. Trigger the queued payment-intent retry worker to process the backlog of <$500 queued attempts
5. Spot-check `transactions` table for stuck `PENDING` rows; resume manually if needed
6. Update status.sorcyn.com to "resolved" with a brief incident summary
7. Send "we're back" social-media update (template TBD)

**Do not:**
- Do not release escrow funds manually during the outage
- Do not refund out-of-band — the payment processor will reconcile once back online
- Do not name "Stripe" in any user-facing message

**Backup payment processor (Square / Braintree as fallback): explicitly rejected.** Doubles PCI compliance scope, doubles fraud-detection surface, doubles webhook handling, and the payment processor's actual uptime SLA is 99.99%. Reasoning recorded in `ReverseMktplPRD.md` open-questions section. Do not relitigate without compelling new data.

---

## 3. Gemini API Outage

**Detection:**
- Spike in 503s on `POST /api/v1/posts/ai-assist`
- Sentry errors mentioning `getGeminiModel` or quota errors
- status.cloud.google.com shows incident in the Gemini region

**User impact:** AI-assisted post creation degrades. Manual post form continues working — this fallback is already wired (`backend/src/modules/posts/ai-assist.service.ts:189-190`).

**Graceful degrade:** No action needed. The AI assist endpoint already throws `AppError(503, 'AI service is not configured. Please create your post manually.')` when Gemini is unavailable. The Flutter client catches this and falls back to the manual form.

**Optional (if outage is prolonged >30 min):**
1. Post in-app banner: *"AI-assisted posting is temporarily slow. Use the manual form below."*
2. Monitor `ai:rate:{userId}` Redis keys for retry storms; consider lowering the 20/hr rate limit to 5/hr if abuse spikes

**Recovery:** Automatic. Once Gemini returns, the next request succeeds and the banner can be cleared.

**Do not:**
- Do not switch providers mid-outage (Claude Haiku is the planned future provider but requires a deploy + cost approval per `CLAUDE.md`)

---

## 4. FCM (Firebase Cloud Messaging) Outage

**Detection:**
- Push delivery failure spike (Sentry: `sendPush` errors)
- status.firebase.google.com shows incident

**User impact:** Push notifications to mobile devices are delayed or dropped.

**Graceful degrade:** No action needed. Fallback is already wired:
- `sendPush()` is fire-and-forget — never throws (see `backend/src/common/utils/push.ts`)
- Notifications are also written to the in-app `notifications` table — users see them on next app open
- Email fallback for critical notifications (offer accepted, payment received, dispute opened) — already wired via the notification module

**Optional (if outage is prolonged):**
1. Increase email send rate for critical notification types
2. Consider in-app banner on next app open

**Recovery:** Automatic. Queued in-app notifications remain visible; new push events resume once FCM is back.

---

## 5. Email Provider (Resend) Outage

**Detection:**
- Email delivery failure spike (Sentry: `sendEmail` errors)
- status.resend.com shows incident
- User reports of missing verification emails / password resets

**User impact:** Transactional emails (verification, password reset, payment receipts, dispute updates) are delayed.

**Graceful degrade:** No action needed for app stability:
- `sendEmail()` is fire-and-forget — never throws (see `backend/src/common/utils/email.ts`)
- In-app notifications continue working for users already signed in
- New sign-ups requiring email verification will be blocked from full access

**Critical mitigation:**
1. Post status banner on auth screens: *"Email delivery is delayed. Verification emails may take longer than usual."*
2. If outage exceeds 2 hours, temporarily relax email verification gate via admin endpoint (manual approval flow); document each manual approval in `audit_logs`
3. Manually trigger password reset for users who contact support (admin endpoint)
4. Post incident to status.sorcyn.com
5. If outage exceeds 24 hours, social-media + email-blast comms (where possible — the email blast itself may be impaired)

**Recovery:**
1. Resend auto-retries failed sends; verify retry behavior + retention window during account onboarding
2. After recovery, verify a test verification email reaches the inbox
3. Re-enable email verification gate if it was relaxed

---

## 6. Public Status Page (status.sorcyn.com)

**Tool:** BetterStatus free tier.
**Domain:** status.sorcyn.com (CNAME from name.com DNS once Cloudflare is provisioned, or directly from name.com to BetterStatus per BetterStatus DNS instructions).
**Branding:** Matches Sorcyn brand (purple accent on white). Logo upload + theme color customization confirmed available on free tier. Full custom CSS is paid-tier — revisit if needed.
**Integration:** Better Stack monitors auto-feed BetterStatus when both products are linked (same account).

**What the status page shows (content spec — TBD in §9 issue 40c):**
- API uptime (overall + per-endpoint group)
- Payments processing (degraded / outage / operational)
- Push notification delivery
- File uploads
- Search
- Recent incidents with timeline
- Subscriber email list (users can opt-in for outage emails)

**Update protocol during incident:**
1. Operator manually marks affected component as "degraded" or "major outage"
2. Operator posts incident description (use the "our payment processor" wording rule)
3. Operator updates incident as it progresses (Investigating → Identified → Monitoring → Resolved)
4. After resolution, operator writes a brief post-mortem in the incident entry

---

## 7. Tabletop Exercise (Required Before Launch)

Run once before launch day. Re-run if any vendor in §1 changes.

**Cadence:** Once pre-launch (Phase 5). Re-run annually or after major architecture changes.

**Format:** 60–90 min, paper exercise (no real outages triggered). Same room or video call preferred; async (each responder writes responses independently then compares) is the fallback.

### Pre-Exercise Checklist

The tabletop is ready to run when all of these are true. Faisal will sequence + track these via the GitHub issue checklist on #40.

- [ ] Better Stack on-call configured (escalation policies, both phones tested for push + phone-call ringing) — see §9
- [ ] Doppler project (`sorcyn-backend`) created, both responders have access, secrets migrated from `backend/.env` — see §9
- [ ] iPhone notification privacy configured (Show Previews → Never) on both phones
- [ ] As-needed swap protocol acknowledged by both responders (write it down somewhere persistent — Better Stack runbook notes, a pinned entry in your shared password manager, or the project README)
- [ ] All four outage runbook sections (§2–§5) reviewed for current accuracy by both responders
- [ ] Status page bookmarks confirmed working for all vendors in §1
- [ ] Vendor accounts that are currently CODE-READY but not provisioned (Stripe live keys, FCM project, Resend, R2 bucket, Hetzner VPS, Gemini paid key) — each has a provisioning plan with a target date
- [ ] Stripe degrade behavior (§2 matrix) implemented in code (issue #40a)
- [ ] Admin announcement banner endpoint deployed (issue #40b)
- [ ] status.sorcyn.com live (issue #40c)
- [x] SendGrid → Resend swap shipped 2026-06-15 (code in `backend/src/common/utils/email.ts`; account provisioning pending)

### Scenarios

For each scenario, walk through: **detection → user impact → degrade steps → recovery → comms (in-app banner + status page + social media + email blast threshold)**.

1. **Payment-processor outage during peak hour** — 50 active checkouts in flight. Walk through each transaction type (local cash, <$500, ≥$500, in-flight escrow). Verify the "our payment processor" wording is used everywhere.
2. **Gemini quota exhaustion mid-day** — free-tier 1K req/day exhausted at 14:00 CT. What's the user message? When do we upgrade?
3. **FCM degraded delivery for 4 hours** — what fraction of users actually notice? What's the recovery comms (if any)?
4. **Email provider outage during a new-seller onboarding wave** — verification emails stuck. How do we manually unblock signups without abuse?
5. **Cascading: payment processor + R2 both down** — payment intent + image uploads fail simultaneously. Which gets the status banner first? How do we comm both on social media without confusing users?

### Exercise Evidence

<!-- AUDIT-MARKER:TABLETOP -->
| Exercise date | Scenarios covered | Runbook gaps found | Participants | Status |
|---------------|-------------------|---------------------|--------------|--------|
| 2026-XX-XX    | TBD               | TBD                 | TBD          | TBD    |
<!-- /AUDIT-MARKER:TABLETOP -->

`Status: PASS` only if all 5 scenarios walked through and any gaps filed as backlog issues before launch day.

Commit results with:
```
git commit -m "docs(v1.1-E3-04): record pre-launch tabletop exercise — N/5 scenarios PASS"
```

---

## 8. Incident Reporting

For any real incident (not drill):

1. File `docs/incidents/{YYYY-MM-DD}-{title}.md` with: timeline, user impact, root cause, recovery actions, action items
2. Update the relevant section of this runbook if a gap was found
3. If the incident involved a vendor on the §1 list, attach vendor incident ID for cross-reference
4. Update status.sorcyn.com with the resolved post-mortem entry

---

## 9. Open Sub-Issues Tracked Separately

The following work is in-flight via separate GitHub issues. #40 stays open until all of these complete + the tabletop runs.

| Issue | Scope |
|-------|-------|
| #84 ([v1.1-E3-04a]) | Stripe degrade + offline queue (feature flag, queue table, retry worker, $500 threshold, Flutter banner) |
| #85 ([v1.1-E3-04b]) | In-app banner + admin announcement endpoint (system_announcements table, admin POST endpoint, Flutter banner widget, email-blast trigger) |
| #86 ([v1.1-E3-04c]) | status.sorcyn.com setup on Better Stack (custom domain, branding, content spec, monitor integration) |
| #87 ([v1.1-E3-04d]) | Vendor audit follow-through (home for the AI-chat vendor-audit report) — superseded by audit landing 2026-05-25; this issue tracks remaining audit-driven swaps |
| #88 | ~~SendGrid → Resend swap (code)~~ — **SHIPPED 2026-06-15**; only account provisioning + sender verification remain |
| ~~#89~~ | ~~Bitwarden setup~~ — **CLOSED** in favor of Doppler; see new Doppler setup issue |
| ~~#90~~ | ~~Opsgenie + Slack provisioning~~ — **CLOSED**; Opsgenie EOL April 2027 per audit. See new Better Stack on-call setup issue |
| #91 | Post-launch high-value threshold review (data-driven re-evaluation of $500 placeholder) |
| (new) | Doppler setup (project creation, secrets migration from `backend/.env`, GitHub Actions integration) |
| (new) | Better Stack on-call + status page provisioning (dashboard config, escalation policies, custom domain status.sorcyn.com) |
| (new) | Gemini paid-tier flip pre-launch (rotate `GEMINI_API_KEY` from AI Studio free to paid) |

---

## 10. Related Runbooks

| Runbook | Scope |
|---------|-------|
| `docs/runbooks/canary-deploy.md` | New version deploy via weighted Nginx |
| `docs/runbooks/rollback.md` | One-click rollback (<60 s) |
| `docs/runbooks/dr-drill.md` | Disaster recovery (DB restore, RTO) |
| `docs/runbooks/observability-drill.md` | Quarterly alert-path chaos drill |
| `docs/RUNBOOK_OPS.md` | **This file** — third-party outages + on-call |
