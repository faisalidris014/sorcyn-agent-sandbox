# Sorcyn Vendor Stack Audit — May 2026
**Scope:** Blank-slate selection for Year 1 (2,500 users, DFW launch, pre-revenue). Optimization criteria: cost → reliability → Year 1 scale. Migration effort explicitly excluded.

---

## 1. Push Notifications — FCM (Firebase Cloud Messaging)

### Top 3 Alternatives

| Vendor | Free Tier | Paid Entry | Notes |
|---|---|---|---|
| **OneSignal** | Unlimited mobile push; 10K web push subs | $19/mo + $0.012/MAU | Managed, segmentation, journeys |
| **Pusher Beams** | 1,000 devices | $49/mo (100K devices) | Lightweight, SDK-focused |
| **Amazon SNS** | 1M publishes/mo | Pay-as-you-go | Tight AWS integration, complex setup |

### Reliability (Last 12 Months)
FCM had **5 notable incidents in 2025** including an 18-hour notification delivery disruption in July and a multi-day Chromium webpush outage in January. Independent benchmarks show a **0.02% daily error rate** over a 90-day window routing 25–100M messages — strong for a free service. OneSignal and Pusher Beams have comparable or better track records at scale.

### Recent Incidents / Controversies (Last 6 Months)
- Dec 2025: FCM web push topic subscriptions throttled for ~10 hours.
- No major controversies for FCM itself. Google continues to sunset other Firebase products (e.g., Remote Config disruptions), raising mild ecosystem concern.

### Verdict

| Vendor | Status |
|---|---|
| **FCM** | ✅ **KEEP** |
| OneSignal | 🔵 Monitor (upgrade path if segmentation needed) |
| Pusher Beams | ❌ Skip (pricing jumps fast, limited value-add) |

**Rationale:** FCM is free, has the best Flutter SDK support, and a 0.02% error rate is acceptable for a consumer marketplace at Year 1 scale. The July 2025 18-hour incident is the one flag worth watching — build a fallback retry mechanism. OneSignal's free tier is better for multi-channel campaigns but adds dependency overhead you don't need yet.

---

## 2. Transactional Email — SendGrid

### Top 3 Alternatives

| Vendor | Free Tier | Paid Entry | Notes |
|---|---|---|---|
| **Resend** | 3,000 emails/mo (permanent) | $20/mo (50K emails) | React Email native, modern DX |
| **Postmark** | None (30-day trial) | $15/mo (10K emails) | Best deliverability reputation |
| **Amazon SES** | 62K/mo (if from EC2) | $0.10/1K emails | Cheapest at scale, DIY bounce handling |

### Reliability (Last 12 Months)
SendGrid permanently retired its free tier on **May 27, 2025** — new accounts get a 60-day trial then are pushed to $19.95/mo minimum. Shared IP reputation issues persist on lower plans. Resend launched in 2023 and has maintained solid deliverability; no major incidents reported. Postmark maintains the strongest inbox reputation in the industry.

### Recent Incidents / Controversies (Last 6 Months)
- **SendGrid free tier removal (May 2025)** — significant developer backlash; the product now has no free path.
- No major outages for SendGrid, Resend, or Postmark in this window.

### Verdict

| Vendor | Status |
|---|---|
| **SendGrid** | 🔄 **SWAP → Resend** |
| Resend | ✅ Recommended replacement |
| Postmark | 🔵 Monitor (upgrade if deliverability becomes critical) |

**Rationale:** SendGrid's free tier is dead. Resend gives you 3,000 free emails/month (covers Sorcyn's full Year 1 volume comfortably), React Email integration matches your Node.js stack, and the API is modern. At 2,500 users sending transactional emails (OTPs, escrow confirmations, offer notifications), you're well within the free tier. Move to Resend's $20/mo 50K plan when you exit free.

---

## 3. Object Storage — Cloudflare R2

### Top 3 Alternatives

| Vendor | Free Tier | Paid Entry | Notes |
|---|---|---|---|
| **Backblaze B2** | 10 GB + 1 GB/day egress free | $6/TB/mo storage, $0.01/GB egress | Cheaper storage, egress not free |
| **Hetzner Object Storage** | None | €5.94/TB/mo | Colocated with your VPS, S3-compatible |
| **AWS S3** | 5 GB (12 months) | $0.023/GB + egress | Feature-rich, expensive egress |

### Reliability (Last 12 Months)
R2 has maintained its zero-egress promise since launch with no major incidents. Cloudflare's global network underpins it with 11-nines durability. No meaningful outages in the monitoring window. Free tier: 10 GB storage + 10M read ops/month.

### Recent Incidents / Controversies (Last 6 Months)
- None for R2 specifically. Cloudflare had minor network routing events but no R2 storage outages.

### Verdict

| Vendor | Status |
|---|---|
| **Cloudflare R2** | ✅ **KEEP** |
| Hetzner Object Storage | 🔵 Monitor (colocated bonus if you move storage-heavy) |
| Backblaze B2 | ❌ Skip (egress fees negate savings for a media-heavy app) |

**Rationale:** R2's zero egress fees are a structural advantage for a marketplace serving user-uploaded photos. At Year 1, you'll likely stay in the 10 GB free tier entirely. At 10K users with average 2–3 photos per post, you're looking at ~30–50 GB storage = ~$0.75/mo on paid. Nothing else comes close on cost + durability + free egress for this use case. Hetzner Object Storage is worth revisiting if you colocate heavy writes with your VPS to reduce round-trip latency.

---

## 4. VPS Hosting — Hetzner

### Top 3 Alternatives

| Vendor | Entry Price | Transfer Included | Notes |
|---|---|---|---|
| **DigitalOcean** | ~$12/mo (2 vCPU/2 GB) | 2 TB | Managed add-ons, US-native, polished UX |
| **Vultr** | ~$12/mo (2 vCPU/2 GB) | 2 TB | Similar to DO, slightly more global PoPs |
| **Railway** | Free tier → $5/mo | Usage-based | PaaS-style, zero-ops, less control |

### Pricing (Post April 2026 Increase)
- CX23 (2 vCPU/4 GB/40 GB NVMe/20 TB): **€3.99/mo** (~$4.40)
- CPX22 (3 vCPU/4 GB, regular perf): **€7.99/mo**
- Price increased 30–37% on April 1, 2026 — still 50–60% cheaper than DigitalOcean/Vultr equivalent.

### Reliability (Last 12 Months)
Hetzner publishes a 99.9% SLA but no formal cloud uptime SLA document. Third-party monitoring shows **~6 incidents in 12 months**, all short (8m–1h), mostly auth/console UI issues — not compute outages. Actual instance uptime is reported as **99.95%** measured. Major incidents were management-plane (can't log in to console), not data-plane (servers kept running).

### Recent Incidents / Controversies (Last 6 Months)
- Aug 2025: 8-minute incident (sites unresponsive, power-off blocked) — resolved quickly.
- Feb 2026: Load balancer + accounts maintenance event.
- No data loss incidents. No billing controversies.

### Verdict

| Vendor | Status |
|---|---|
| **Hetzner** | ✅ **KEEP** |
| DigitalOcean | 🔵 Monitor (if US-east latency becomes a user complaint) |
| Railway | ❌ Skip for primary (PaaS abstractions too limiting for Fastify + Supabase self-managed) |

**Rationale:** For a DFW-targeting app, Hetzner's Ashburn (US-East) location is solid. Even after the April price hike, you're getting 4 GB RAM + 20 TB transfer for ~$4.40/mo — unmatched. The incident history shows a stable data plane with occasional management-plane blips. Pair Cloudflare CDN in front for edge caching and the Hetzner + Cloudflare combo beats every alternative on cost-per-performance for early-stage. No formal SLA is a real gap — acceptable at Year 1, revisit at Year 2 if uptime becomes contractual.

---

## 5. Payments — Stripe Connect

### Top 3 Alternatives

| Vendor | Processing Fee | Marketplace Features | Notes |
|---|---|---|---|
| **Braintree (PayPal)** | 2.59% + $0.49 | Split payments, marketplace SDK | PayPal reach, higher base fee |
| **Adyen for Platforms** | Interchange+ (~1.5–2.5%) | Enterprise-grade split payments | Minimum volumes required |
| **Mangopay** | 1.8% + €0.18 (EU-focused) | Purpose-built for marketplaces | Better EU pricing, weak US support |

### Pricing
- Standard: 2.9% + $0.30 per transaction + 0.25% payout fee (capped at $25)
- Connect Express: $2/mo per active connected account
- No volume discount until negotiated contract

### Reliability (Last 12 Months)
Stripe had **109 incidents tracked in 2025**, but the vast majority were minor/partial degradations averaging 1–2 hours. Stripe's status communication is rated excellent (avg. <15 min acknowledgment). No catastrophic payment loss incidents. Functionally the most reliable payments infrastructure in the market.

### Recent Incidents / Controversies (Last 6 Months)
- Dec 2025: Two minor partial degradations (20 min each).
- Feb 2026: ~75-minute global payments partial outage.
- Ongoing: Account closure without notice remains the #1 community complaint for new marketplaces — especially for platforms with escrow/delayed payout patterns. Legitimate risk to monitor.

### Verdict

| Vendor | Status |
|---|---|
| **Stripe Connect** | ✅ **KEEP** |
| Braintree | ❌ Skip (higher fees, weaker DX) |
| Adyen | ❌ Skip (volume minimums, not startup-friendly) |

**Rationale:** Stripe is the only realistic choice at Year 1 for a US marketplace with escrow, delayed payouts, and embedded onboarding. No alternative matches its documentation quality, Flutter SDK, or KYC automation for connected accounts. The account-closure risk is real — mitigate by not structuring payouts in ways that trigger Stripe's fraud heuristics (document your escrow logic thoroughly in your Stripe account dashboard). Adyen becomes relevant at $1M+ monthly volume.

---

## 6. AI / LLM — Google AI Studio (Gemini Flash-Lite Free Tier)

### Top 3 Alternatives

| Vendor | Free Tier | Paid Entry | Notes |
|---|---|---|---|
| **Groq** | ~1,500 req/day on Llama models | Pay-as-you-go | Fastest inference (LPU), no Gemini |
| **OpenRouter** | Free access to multiple models | Pay-per-token | Model routing, wide variety |
| **Anthropic (Claude Haiku 4.5)** | None (API) | $0.80/M input tokens | Best quality/cost for reasoning tasks |

### Pricing (May 2026)
- Gemini free tier: 1,500 req/day, rate-limited — **data used for Google product training**
- Gemini 2.5 Flash-Lite paid: $0.10/M input tokens, $0.40/M output
- **⚠️ Note:** Free tier rate limits were cut 50–80% in December 2025 due to abuse. Pro models removed from free tier as of April 2026.

### Reliability (Last 12 Months)
Google AI Studio / Gemini API had no major outages affecting Flash models. Rate limit enforcement (sudden 429s on the free tier) is the primary reliability concern, not infrastructure uptime.

### Recent Incidents / Controversies (Last 6 Months)
- **Dec 2025:** Google silently reduced free tier rate limits by 50–80% citing abuse — no advance notice.
- **April 2026:** Pro models removed from free tier with limited warning.
- Pattern: Google aggressively shrinks free AI tiers without notice. This is a planning risk.

### Verdict

| Vendor | Status |
|---|---|
| **Google AI Studio (free)** | ⚠️ **MONITOR** — acceptable now, fragile long-term |
| Gemini paid (Flash-Lite) | ✅ Recommended upgrade path ($0.10/M input is cheap) |
| Groq | 🔵 Monitor (speed use cases: real-time chat responses) |

**Rationale:** The Gemini free tier is the right starting point — the cost is $0 and the quota covers early-stage usage. But Google has proven it will cut this tier without notice. Budget $10–30/mo for Gemini paid as a contingency and plan to flip to paid at first scale signal (>500 active users generating AI interactions daily). At $0.10/M input tokens, your Jarvis chatbot costs are negligible even at 10K users — this is not a meaningful budget line.

---

## 7. Database — Supabase

### Top 3 Alternatives

| Vendor | Free Tier | Paid Entry | Notes |
|---|---|---|---|
| **Neon** | 0.5 GB storage, serverless scaling | $19/mo | Serverless Postgres, scales to zero |
| **PlanetScale** | Revived in 2025; MySQL-based | $39/mo | Branching, not Postgres |
| **Self-hosted Postgres (on Hetzner)** | $0 (on existing VPS) | $0 (share VPS cost) | Full control, no managed features |

### Pricing
- Free: 500 MB DB, 1 GB storage, 50K MAU, 2 projects (pause after 1 week inactivity)
- Pro: **$25/mo** per project (includes compute credits, 8 GB storage, 250 GB bandwidth)
- **Note:** Free tier projects pause after 7 days inactivity — production apps need Pro.

### Reliability (Last 12 Months)
Supabase had several notable incidents:
- **Nov 2025:** 90% request failure for ~30 minutes (HTTP 556/500 errors) across multiple products.
- **Sept 2025:** UAE customers experienced multi-week outage due to DNS-level ISP blocking.
- **Realtime cluster instability** — multiple brief incidents.
- Incident communication is rated excellent (<15 min acknowledgment on StatusGator).

### Recent Incidents / Controversies (Last 6 Months)
- Nov 24, 2025: Major multi-product degradation (556 errors, 30 min).
- Ongoing: UAE DNS blocking (geographic risk for international expansion).
- May 2026: Scheduled pooler maintenance (V1 → V2 upgrade) ongoing.

### Verdict

| Vendor | Status |
|---|---|
| **Supabase** | ✅ **KEEP** |
| Neon | 🔵 Monitor (if bursty traffic pattern makes serverless pricing attractive) |
| Self-hosted Postgres | ❌ Skip (you lose Auth, Realtime, Storage bundled value) |

**Rationale:** Supabase's $25/mo Pro plan is the right target for pre-launch — the free tier's 7-day pause makes it unsuitable for production. The Nov 2025 incident is the most significant flag but was resolved quickly. For Year 1 DFW scale, Supabase's bundled Auth + Realtime + Storage + Edge Functions at $25/mo is unbeatable value. The UAE incident is irrelevant for DFW launch. Upgrade to Pro the week you flip to production.

---

## 8. Secrets Management — Bitwarden Free Org

### Top 3 Alternatives

| Vendor | Free Tier | Paid Entry | Notes |
|---|---|---|---|
| **Infisical** | Free cloud (limited); self-host free/unlimited | $8/user/mo cloud Pro | Open-source, E2E encrypted, CI/CD integrations |
| **Doppler** | Free (up to 3 users, unlimited secrets) | $7/user/mo | Best DX, env-file replacement |
| **AWS Secrets Manager** | None | $0.40/secret/mo + API calls | Deep AWS integration only |

### Pricing
- Bitwarden: Free org tier for password vault sharing; **Secrets Manager** is a separate product ($6/user/mo)
- Infisical: Free cloud tier exists; self-hosted Community Edition is completely free and unlimited
- Doppler: Free for up to 3 users — covers a small founding team indefinitely

### Reliability (Last 12 Months)
Bitwarden has a strong reliability record. Infisical and Doppler have had no major outages. Doppler is closed-source; Infisical is open-source (MIT) and growing fastest in the category.

### Recent Incidents / Controversies (Last 6 Months)
- No major incidents for any of the three.
- **Key flag:** Bitwarden Secrets Manager and Bitwarden password vault are **separate products**. The free org is for password sharing — it's not a proper secrets manager with CI/CD injection, environment syncing, or machine identity.

### Verdict

| Vendor | Status |
|---|---|
| **Bitwarden (for secrets)** | 🔄 **SWAP → Infisical or Doppler** |
| Infisical | ✅ Recommended (open-source, self-host option, free tier) |
| Doppler | ✅ Recommended (better DX, simpler if <3 devs) |

**Rationale:** Bitwarden free org is a password manager, not a secrets manager for CI/CD pipelines. It has no env injection, no GitHub Actions integration, and no service account management. Doppler's free tier (3 users, unlimited secrets) covers you indefinitely as a small team and integrates directly with your deployment pipeline. Infisical is the better long-term choice if you want open-source auditability or plan to self-host. Pick Doppler now for speed; migrate to Infisical when you need CI/CD automation depth.

---

## 9. Paging / On-Call — Opsgenie Free + Slack Free

### Top 3 Alternatives

| Vendor | Free Tier | Paid Entry | Notes |
|---|---|---|---|
| **PagerDuty** | 5 users, 100 SMS alerts | $21/user/mo | Industry standard, dated UI |
| **Better Stack** | 10 monitors + status page | $29/mo (incidents) | Modern, all-in-one |
| **ilert** | 5 responders free | ~$9/user/mo | EU-hosted, GDPR-friendly |

### ⚠️ Critical Finding
**Opsgenie is being shut down.** As of June 4, 2025, Atlassian stopped new Opsgenie signups. The product reaches **full end-of-support on April 5, 2027**, at which point all data is deleted. Atlassian's migration path requires both Jira Service Management AND Compass — two paid products. Existing free accounts can still function, but the product is in maintenance mode with no new features.

### Reliability (Last 12 Months)
Opsgenie itself is stable but in maintenance mode. PagerDuty has had minor incidents. Better Stack has had strong uptime. Grafana OnCall OSS (self-hosted alternative) was archived March 2026 — that path is dead.

### Recent Incidents / Controversies (Last 6 Months)
- **Atlassian confirmed EOL April 2027** — this is the dominant story.
- Squadcast (alternative) was acquired by SolarWinds March 2025 — roadmap uncertainty.
- Grafana OnCall OSS archived March 2026.

### Verdict

| Vendor | Status |
|---|---|
| **Opsgenie** | 🔄 **SWAP — EOL risk, migrate before April 2027** |
| Better Stack | ✅ Recommended (free tier covers status page + monitoring + basic on-call) |
| PagerDuty | 🔵 Monitor (free tier viable for small team, better if you want proven tooling) |

**Rationale:** Opsgenie will cease to exist in under 2 years. Don't build new infrastructure on it. Better Stack's free tier bundles uptime monitoring + status page + incident management — it replaces both Opsgenie AND BetterStatus in one tool. For a 2-person team at launch, PagerDuty's free 5-user tier is also a clean fit. Recommend swapping to Better Stack free now and collapsing items 9 and 10 into one tool.

---

## 10. Status Page — BetterStatus Free

### Top 3 Alternatives

| Vendor | Free Tier | Paid Entry | Notes |
|---|---|---|---|
| **Better Stack** | Free (10 monitors + status page) | $29/mo (incidents) | Replaces paging too |
| **Instatus** | Free (15 monitors, unlimited subscribers) | $20/mo | Best free limits, CDN-delivered |
| **Uptime Kuma** | Free (self-hosted) | $0 forever | Open-source, host on your Hetzner VPS |

### Pricing
- BetterStatus: Free tier exists but limited; couldn't confirm current pricing (low public profile)
- Instatus free: 15 monitors, unlimited status page subscribers, custom domain
- Better Stack free: 10 monitors, 1 status page, incident management

### Reliability (Last 12 Months)
No notable incidents for any of the three alternatives. Status page infrastructure is inherently low-risk for the provider.

### Recent Incidents / Controversies (Last 6 Months)
- None identified for BetterStatus, Instatus, or Better Stack status pages.

### Verdict

| Vendor | Status |
|---|---|
| **BetterStatus** | 🔄 **SWAP → Better Stack or Instatus** |
| Better Stack | ✅ Recommended (collapse paging + status page into one tool) |
| Instatus | ✅ Recommended if you want status-page-only with maximum free limits |
| Uptime Kuma | 🔵 Monitor (zero cost but adds VPS maintenance burden) |

**Rationale:** BetterStatus is low-profile with unclear long-term viability. Instatus offers 15 monitors + unlimited subscribers free with CDN-delivered pages — superior to BetterStatus on every metric. But the better move is to collapse items 9 and 10: swap Opsgenie + BetterStatus for **Better Stack free**, which handles on-call routing, uptime monitoring, incident management, and status pages in one platform at $0 until you scale.

---

## Summary Table

| # | Current Vendor | Verdict | Swap To |
|---|---|---|---|
| 1 | Firebase Cloud Messaging | ✅ KEEP | — |
| 2 | SendGrid | 🔄 SWAP | **Resend** |
| 3 | Cloudflare R2 | ✅ KEEP | — |
| 4 | Hetzner VPS | ✅ KEEP | — |
| 5 | Stripe Connect | ✅ KEEP | — |
| 6 | Google AI Studio | ⚠️ MONITOR | Budget for Gemini paid ($0.10/M tokens) |
| 7 | Supabase | ✅ KEEP (upgrade to Pro at launch) | — |
| 8 | Bitwarden Free Org | 🔄 SWAP | **Doppler** (free, <3 devs) or **Infisical** |
| 9 | Opsgenie | 🔄 SWAP (EOL 2027) | **Better Stack** free |
| 10 | BetterStatus | 🔄 SWAP | **Better Stack** free (collapse 9+10) |

## Estimated Monthly Cost at 10K Users (Post-Swap)

| Line | Cost |
|---|---|
| Hetzner CPX22 (~4GB/3vCPU) | ~$9 |
| Supabase Pro | $25 |
| Cloudflare R2 (est. 50–100 GB) | ~$1 |
| Stripe Connect | % of GMV |
| Resend (50K emails) | $20 |
| Gemini paid (Flash-Lite, est.) | $10–30 |
| FCM | $0 |
| Doppler / Infisical | $0 |
| Better Stack | $0 |
| **Total infra (ex-payments)** | **~$65–$85/mo** |

Well under the $1,000/mo target. Stripe fees are the dominant cost driver at scale, not infra.