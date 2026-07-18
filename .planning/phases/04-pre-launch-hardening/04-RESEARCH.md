# Phase 4 Research: Pre-Launch Hardening

**Researched:** 2026-04-30
**Domain:** CI/CD canary, observability, load + perf, security + PCI, accessibility, DR drill, 20-user UAT, mobile shell carry-over
**Confidence:** HIGH on stack choices, integration points, and pitfalls (verified via codebase reads + official docs). MEDIUM on PCI-DSS SAQ-A applicability for our exact integration shape (Connect Standard + Separate Charges + Identity hosted-flow) — needs Stripe support confirmation before plan ships. MEDIUM on the "right" Sentry `tracesSampleRate` for MVP-scale traffic — anchored at the Sentry-recommended 10–20% production starting band, but final number is a quota-budget call.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**CI/CD Canary Architecture (NFR-cicd, SC#5):**
- **D-01:** Canary infrastructure = 2nd VPS + Nginx weighted upstream. Provision a second Hetzner-style VPS, Nginx in front with weighted `upstream` blocks, GitHub Actions flips weights per stage (10 → 50 → 100). Stays inside the existing SSH + docker-compose deploy model. ~$15–30/mo.
- **D-02:** Canary stage progression = manual gate at each stage. GitHub Actions `environments` with required reviewer = Faisal. Solo-founder rationale: no on-call team to recover from misfiring auto-promotion.
- **D-03:** One-click rollback = Nginx weight flip back to old VPS. Old version stays running on VPS-A while new is on VPS-B during the canary window. `gh workflow run rollback.yml` re-applies prior Nginx config (weight 100 → VPS-A, 0 → VPS-B). Recovery target <60 s. After 100% promotion + soak window, VPS-A becomes the next fresh target (alternating roles). DB migrations are forward-compatible only (D-04).
- **D-04:** Forward-compatible-only migration contract during canary windows. Every Prisma migration must be additive-only: new columns nullable, new tables, no DROPs, no `NOT NULL` on existing without backfill. Destructive migrations ship in a follow-up release after the prior version has fully drained. **Lock as ADR in `.planning/intel/decisions.md` and reference from CLAUDE.md before any Phase 4 plan ships.**

**Observability Stack (NFR-monitoring, NFR-error-handling, SC#4):**
- **D-05:** Distributed tracing = Sentry Performance (extend existing Sentry SDK in `backend/src/config/sentry.ts` and `mobile/lib/main.dart`). ~$26/mo Sentry Team plan covers MVP traffic. Zero new infrastructure.
- **D-06:** On-call paging = Slack-only. Sentry + Prometheus AlertManager fire into `#sorcyn-prod-alerts`. Mobile push from Slack acts as the page. Cost: $0.
- **D-07:** Centralized logging = Better Stack (Logtail) via `pino-logtail` transport. ~$24/mo for ~30 GB/month. Hosted log aggregation, search + alert + dashboard in one tool.
- **D-08:** Synthetic incident verification (SC#4) = both quarterly chaos drill via `scripts/synthetic-incident.sh` + Better Stack continuous HTTP synthetic monitors from multiple regions (1–5 min cadence).

### Claude's Discretion

The 7 areas below were explicitly handed to Claude with documented defaults; this research confirms or refines each:

1. **Load test tooling + target environment** — default k6 + dedicated staging cluster mirroring prod shape with anonymized prod data clone.
2. **Mobile shell carry-over from Phase 3** — default fold into Phase 4 as a sub-plan (NOT 999.x backlog).
3. **Test coverage gap path** — default measure first via existing `backend/vitest.config.ts`, then prioritize CONCERNS.md High items.
4. **Accessibility tooling** — default Flutter `accessibility_test` package + manual VoiceOver/TalkBack walkthrough + axe-core for any web touchpoints.
5. **DR drill mechanics** — default restore-to-different-region with timed RTO/RPO + signed-off `docs/runbooks/dr-drill.md` + quarterly cadence.
6. **20-user UAT recruitment + script** — default 10 buyers + 10 sellers DFW (Sorcyn waitlist + DFW Reddit + Faisal's local network); script covers full transaction loop + Phase 3 closeout surfaces.
7. **PCI-DSS attestation timing** — default research Stripe SAQ-A coverage path during research; file `docs/PCI_SAQ_A.md` as a Phase 4 deliverable. Surface re-scoping if Stripe says SAQ-A doesn't apply.

### Deferred Ideas (OUT OF SCOPE)

- Kubernetes + Argo Rollouts canary, Datadog APM, PagerDuty, Sentry Logs single-vendor consolidation, OpenTelemetry → Jaeger, automated time-windowed canary promotion, two-deploy expand/contract migration pattern, Slack-triggered canary promotion, Better Stack status pages, multi-device FCM token storage, broader webhook idempotency-key infrastructure (test-coverage gap-fill is in scope; the infrastructure refactor is not), message moderation actions, N+1 conversation listing refactor unless load test surfaces it as a blocker.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-launch-readiness | Umbrella: every NFR gating DFW launch is passing | All sections below |
| NFR-performance | API <200 ms median / <500 ms p95; search <500 ms; payment <3 s; DB <100 ms p95 | k6 thresholds (Tooling Decisions) + Sentry Perf p95 dashboards (D-05) |
| NFR-throughput | 1,000 concurrent users; 1,000 req/s peak API | k6 ramp-and-hold scenario (Implementation Approach §1) |
| NFR-data-growth | Capacity validated for 10K users / 5K posts/mo / 1K txns/mo / 50K msgs/mo / 100GB images/mo | Load test seed fixture sizing (Implementation Approach §1) |
| NFR-uptime | 99.9% MVP; maintenance Sun 2–4 AM UTC with 48h notice | Better Stack continuous monitors (D-08) + status-page deferred |
| NFR-disaster-recovery | RTO <4h / RPO <1h; daily backups separate region; quarterly drill | Supabase PITR + R2 cross-region replication (Implementation Approach §11) |
| NFR-error-handling | Auto-retry 3 attempts exp. backoff; circuit breaker after 5 failures; cached fallback non-critical | Existing graceful-stub pattern + Sentry alert rules (Implementation Approach §6) |
| NFR-accessibility | WCAG 2.1 AA across 40 customer-facing Flutter screens | `accessibility_test` package + manual SR walkthrough (Implementation Approach §8) |
| NFR-test-coverage | ≥70% with 70/20/10 split; OWASP ZAP + Snyk; 20-user UAT | Coverage gap-fill from CONCERNS.md High items (Implementation Approach §9) |
| NFR-cicd | Canary 10/50/100 + one-click rollback | Nginx weighted upstream + GitHub Actions environments (Implementation Approach §1) |
| NFR-monitoring | Centralized logging, distributed tracing, alerts, dashboards | D-05 Sentry Perf + D-07 Better Stack + D-06 Slack alerts (Implementation Approach §3, §4, §6) |
| NFR-security | TLS, AES-256, JWT rotation, rate limit, parameterized queries, PCI-DSS via Stripe, GDPR/CCPA | OWASP ZAP + Snyk + SAQ-A (Implementation Approach §12, §13) |

## Validation Architecture

| SC | Behavior to validate | Sample technique | Pass/fail threshold | Acceptance artifact (file or doc) |
|----|----------------------|------------------|---------------------|-----------------------------------|
| SC#1 (perf/throughput) | 1,000 concurrent users sustained 15 min | k6 ramp 0→1000 over 5 min, hold 15 min, ramp-down; Prometheus remote-write + Sentry Perf p95 panels | API p95 <500 ms, search p95 <500 ms, payment <3 s, DB p95 <100 ms, error rate <1%, no 5xx burst alert | `docs/load-test-report.md` with k6 JSON summary + Sentry trace screenshot at peak; audit suite parses k6 JSON and asserts thresholds |
| SC#2a (test coverage) | ≥70% coverage with 70/20/10 unit/integration/E2E | `npm run test:coverage` (V8 reporter; existing vitest config currently sets 80/75/65/80 per-file thresholds, see Pitfall §3) | Lines ≥70%, functions ≥70%, integration tests ≥20% of total test count, E2E ≥10% (smoke tests) | `coverage/coverage-summary.json` checked into CI artifact; audit suite parses JSON and asserts |
| SC#2b (security scans) | OWASP ZAP + Snyk return zero HIGH/CRITICAL | ZAP baseline + active scan against staging API with seeded JWT; `snyk test` in 4th CI job | Zero HIGH, zero CRITICAL on each tool; warnings logged but non-blocking | `docs/security-scans/zap-report.html` + `docs/security-scans/snyk-report.json`; audit suite asserts files exist and parse |
| SC#2c (PCI-DSS) | SAQ-A attestation filed | Stripe support confirms SAQ-A applies to Connect Standard + Separate Charges + Identity hosted-flow integration shape; download SAQ-A v4.0 from PCI council, fill, attest internally | `docs/PCI_SAQ_A.md` exists with attestation date + Stripe support thread reference | `docs/PCI_SAQ_A.md`; audit suite asserts file exists |
| SC#3 (accessibility) | WCAG 2.1 AA across 40 Flutter screens | `accessibility_test` package widget tests (`androidTapTargetGuideline`, `iOSTapTargetGuideline`, `labeledTapTargetGuideline`, `textContrastGuideline`) + manual TalkBack/VoiceOver per screen | Every screen PASS; per-screen entry in `docs/A11Y_AUDIT.md` | `docs/A11Y_AUDIT.md` table; audit suite parses table, asserts every customer-facing screen has PASS |
| SC#4 (DR + observability) | RTO <4h, RPO <1h; observability verified by synthetic incident | Restore prod backup into different Supabase region; timed; capture lag from last backup to restore complete; chaos drill trips each alert path | RTO measured ≤4h, RPO ≤1h; all 4 alert types fired in `#sorcyn-prod-alerts` within target latency (5xx <1 min, latency <2 min, container down <1 min, webhook fail <1 min) | `docs/runbooks/dr-drill.md` + `docs/runbooks/observability-drill.md` with timestamps + Slack screenshots; audit suite asserts files exist and parse RTO/RPO timestamps |
| SC#5a (canary CI/CD) | 10/50/100 canary + one-click rollback | GitHub Actions workflow_dispatch on `deploy-canary.yml` (3 stages with `environment: staging-canary-10` etc.) + `rollback.yml` flips Nginx weights | Canary workflow exists; rollback workflow exists; rollback completes in <60 s in dry-run | `.github/workflows/deploy-canary.yml`, `.github/workflows/rollback.yml`; audit suite asserts files exist + dry-run timing recorded |
| SC#5b (UAT) | 20 beta users complete UAT script | 10 buyers + 10 sellers DFW; script covers post → offer → accept → escrow → completion → review + Phase 3 closeout surfaces (counter-offer, Stripe Identity, EIN registration, Jobs lead-pricing) | All 20 sign-offs captured; ≤3 P0 bugs surfaced (P0 = blocks transaction loop); P0s fixed before launch | `docs/UAT_REPORT.md` with sign-off table; audit suite asserts file exists + sign-off count ≥20 |

**Sampling rate:**
- Per task commit: full unit suite (`npm test`) — already ~30s.
- Per wave merge: `npx vitest run tests/audit` — single CI gate command.
- Per phase gate: full audit + coverage + ZAP + Snyk + load test report parse, all green.

**CI gate command (preserved from Phase 3):** `npx vitest run tests/audit` — Phase 4 NFR audits extend the existing 26-assertion suite with new `describe` blocks per success criterion.

## Implementation Approach

### 1. Nginx weighted-upstream canary (D-01, D-02, D-03)

**Architecture (recommended):**

```
                    ┌──────────────┐
                    │  Nginx (LB)  │  ← single Nginx in front
                    │  api.sorcyn  │
                    └──────┬───────┘
                  ┌────────┴────────┐
                  │ weighted upstream │
        ┌─────────┴─────────┐  ┌────┴─────────┐
        │  VPS-A (stable)   │  │  VPS-B (canary)│
        │  docker-compose   │  │  docker-compose│
        │  + Postgres pooler│  │  + Postgres pooler│
        └───────────────────┘  └────────────────┘
                  │                    │
                  └─────── shared ─────┘
                          Supabase
```

The single Nginx becomes the SPOF, but reusing the existing Nginx + SSL stack from Phase 1 stays inside D-01's "no platform migration" mandate. Phase 6 can revisit by moving Nginx to a third tiny VPS or using Cloudflare Load Balancer.

**Nginx config shape** (extend the existing `upstream api { server api:3000; }` block in `nginx/nginx.conf`):

```nginx
upstream api_pool {
    # Sticky routing for Socket.IO (Pitfall 7) — required because Socket.IO
    # uses HTTP long-polling fallback that creates affinity-bound sessions.
    ip_hash;

    server vps-a.internal:3000 weight=100;
    server vps-b.internal:3000 weight=0;
    keepalive 32;
}
```

`ip_hash` + `weight=N` is supported; the docs explicitly confirm "weights with the least-connected and ip-hash load balancing in recent versions of nginx" [CITED: nginx.org/en/docs/http/load_balancing.html]. Stage transitions update the weights:

| Stage | VPS-A (stable) | VPS-B (canary) | Action |
|-------|----------------|----------------|--------|
| Initial | 100 | 0 | baseline |
| 10% | 90 | 10 | deploy + manual gate |
| 50% | 50 | 50 | manual gate |
| 100% | 0 | 100 | manual gate, soak 60 min |
| Promote | 100 (now B) | 0 (now A=fresh target) | role swap, A becomes next canary target |
| Rollback | 100 | 0 | weight flip via `rollback.yml` |

**Weight render mechanism (recommended):**

A small `nginx/render-canary.sh` script reads a saved-state JSON file (`nginx/canary-state.json`) and renders `nginx/canary-upstream.conf` via `envsubst`. The deploy workflow updates the JSON on the LB host, runs the script, and reloads Nginx (`nginx -s reload` — graceful, no dropped connections):

```bash
# nginx/canary-state.json
{ "stable_host": "vps-a.internal", "canary_host": "vps-b.internal", "stable_weight": 90, "canary_weight": 10 }
```

```bash
# nginx/render-canary.sh
jq -r '
  "upstream api_pool { ip_hash; server \(.stable_host):3000 weight=\(.stable_weight); server \(.canary_host):3000 weight=\(.canary_weight); keepalive 32; }"
' nginx/canary-state.json > nginx/canary-upstream.conf
```

**GitHub Actions workflow shape:**

```yaml
# .github/workflows/deploy-canary.yml
name: Deploy Canary
on:
  workflow_dispatch:
    inputs:
      stage:
        type: choice
        options: [canary-10, canary-50, canary-100]
jobs:
  canary-deploy:
    environment: ${{ inputs.stage }}  # required reviewer = Faisal
    runs-on: ubuntu-latest
    steps:
      - name: Pull image on canary VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.CANARY_VPS_HOST }}
          script: |
            cd /opt/sorcyn && docker compose pull api && docker compose up -d --no-deps api
      - name: Update Nginx weights on LB host
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.LB_HOST }}
          script: |
            cd /opt/sorcyn-lb && ./set-weights.sh ${{ inputs.stage }} && nginx -s reload
      - name: Health check on canary path
        run: ./scripts/canary-health-check.sh ${{ inputs.stage }}
```

```yaml
# .github/workflows/rollback.yml
name: Rollback Canary
on:
  workflow_dispatch:
jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: production-rollback  # no required reviewer — must be fast
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.LB_HOST }}
          script: |
            cd /opt/sorcyn-lb && ./set-weights.sh rollback && nginx -s reload
```

**Recovery time math (target <60 s):**
- SSH connect: ~2 s
- `set-weights.sh` (jq + cp): ~1 s
- `nginx -s reload`: ~1 s (graceful, no in-flight drop)
- LB DNS TTL: not in path (Nginx is the LB, no DNS flip)
- **Total: <10 s typical, <30 s worst case** — comfortably under <60 s SLO.

**Rollback reviewer-permission gap (Pitfall 8):** The `production-rollback` environment must NOT require a reviewer (rollback must be one-click). To prevent abuse, gate the workflow on branch protection (only Faisal can trigger workflow_dispatch on `main`).

### 2. Forward-compatible Prisma migration ADR (D-04, highest stakes)

**Rule set (lock in `.planning/intel/decisions.md` as `DEC-forward-compatible-migrations`):**

ALLOWED during canary windows:
- `ADD COLUMN <name> TYPE NULL` (nullable; default OK)
- `CREATE TABLE`
- `CREATE INDEX CONCURRENTLY` (Prisma 7 supports via raw SQL)
- `ALTER TABLE ... ADD CONSTRAINT NOT VALID` followed by `VALIDATE CONSTRAINT` in next release
- New enum values via `ALTER TYPE ... ADD VALUE` (Postgres 12+ supports without downtime)

FORBIDDEN during canary windows:
- `DROP COLUMN`, `DROP TABLE`, `DROP INDEX` (without CONCURRENTLY)
- `ALTER COLUMN ... SET NOT NULL` on existing column (requires backfill)
- `RENAME COLUMN`, `RENAME TABLE`
- Type changes that rewrite the table (`ALTER COLUMN ... TYPE` for non-USING-cast)
- Removing enum values (Postgres can't safely drop enum values)

**Expand → migrate → contract pattern (canonical example for the ADR):**

Renaming `seller_profiles.bio` to `seller_profiles.about`:

| Release | Operation | Code reads from | Code writes to |
|---------|-----------|-----------------|----------------|
| R1 | `ADD COLUMN about TEXT NULL` (additive) | `bio` | both `bio` AND `about` |
| R2 | Backfill: `UPDATE seller_profiles SET about = bio WHERE about IS NULL` (after R1 fully drained) | `about` (fall back to `bio`) | both |
| R3 | After R2 fully drained: code switches reads/writes to `about` only | `about` | `about` |
| R4 | After R3 soak: `DROP COLUMN bio` (final contraction) | — | — |

**CI enforcement (recommended — extend audit suite):**

Add a `describe` block in `tests/audit/closeout-audit.test.ts` that runs `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-migrations prisma/migrations --script` against the latest migration and parses the output for forbidden tokens:

```typescript
describe('Forward-compatible migration audit', () => {
  it('latest migration has no DROP, RENAME, or NOT NULL on existing column', () => {
    const latestMigration = readLatestMigrationSQL();
    expect(latestMigration).not.toMatch(/^\s*DROP\s+(COLUMN|TABLE|INDEX(?!\s+CONCURRENTLY))/im);
    expect(latestMigration).not.toMatch(/^\s*ALTER\s+TABLE\s+\S+\s+RENAME/im);
    expect(latestMigration).not.toMatch(/SET\s+NOT\s+NULL/i);
    // Note: enum DROP VALUE is impossible in Postgres so no regex needed
  });
});
```

This is the forcing function — destructive migrations fail CI before they ship.

### 3. Sentry Performance setup (D-05)

**Backend (`backend/src/config/sentry.ts`):**

The existing init already sets `tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0` — **the foundation is already in place.** What's missing is:
1. **Auto-instrumentation imports** (Fastify integration, Prisma instrumentation, BullMQ instrumentation)
2. **`Sentry.startSpan()` wrappers** at hot-path boundaries (offer accept, payment intent create, message send)
3. **`profilesSampleRate`** for CPU profiling (set to 0 at MVP — extra cost; revisit Phase 6)

```typescript
// backend/src/config/sentry.ts (Phase 4 additions)
import * as Sentry from '@sentry/node';
import { httpIntegration, prismaIntegration } from '@sentry/node';

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.NODE_ENV,
  tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,  // EXISTING — keep at 10%
  // NEW Phase 4:
  integrations: [
    httpIntegration(),       // auto-instrument outbound HTTP (Stripe, SendGrid, R2)
    prismaIntegration(),     // DB span breakdown
  ],
  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    return event;
  },
});

// Fastify integration (separate plugin call after app.register):
await app.register(Sentry.fastifyIntegration);
```

[CITED: docs.sentry.io/platforms/javascript/guides/node/tracing/] — "Start with 100% in development, 10–20% in production." Our existing 0.1 (10%) is at the lower bound and stays inside the Team plan ~$26/mo quota.

**Mobile (`mobile/lib/main.dart`):**

The existing init already sets `tracesSampleRate = isProduction ? 0.1 : 1.0`. Phase 4 additions:
1. Wrap `Dio` client with `sentry_dio` interceptor (already in pubspec? — verify in plan)
2. Wrap Riverpod Provider observers with `sentry_riverpod` (or use manual `Sentry.startTransaction` at navigation boundaries)
3. Confirm `sentry-trace` header propagation from mobile → backend (frontend↔backend correlation)

**Frontend↔backend trace correlation:** Sentry SDK auto-injects the `sentry-trace` and `baggage` headers on outbound HTTP via `sentry_dio` (mobile) and reads them on inbound via `httpIntegration` (backend). Result: a single trace shows mobile button-tap → REST call → DB query.

**Alert config (Sentry → Slack #sorcyn-prod-alerts):**

Use Sentry's native Slack integration (Settings → Integrations → Slack). Recommended alert rules for Phase 4 launch:

| Alert | Condition | Severity | Slack channel |
|-------|-----------|----------|---------------|
| Error spike | ≥5 unique errors in 1 min | High | #sorcyn-prod-alerts |
| New issue | First seen, env=production | Medium | #sorcyn-prod-alerts |
| Performance regression | p95 transaction duration >500 ms over baseline 5 min | High | #sorcyn-prod-alerts |
| Webhook failure | `payment_intent.payment_failed` event count spike | Critical | #sorcyn-prod-alerts |

### 4. Better Stack (Logtail) pino transport (D-07)

**Package:** `@logtail/pino` (npm), Pino v7+ required; backend already uses `pino` via Fastify default logger [CITED: betterstack.com/docs/logs/javascript/pino/].

**Lazy-singleton pattern (matches existing `getStripe()` / `getGemini()`):**

```typescript
// backend/src/config/logtail.ts (NEW)
import pino from 'pino';
import { env } from './env.js';

let logger: pino.Logger | null = null;

export function getLogger(): pino.Logger {
  if (logger) return logger;

  const targets: pino.TransportTargetOptions[] = [
    // Always log to stdout (Docker captures)
    { target: 'pino/file', options: { destination: 1 }, level: env.LOG_LEVEL },
  ];

  if (env.BETTER_STACK_TOKEN) {
    targets.push({
      target: '@logtail/pino',
      options: {
        sourceToken: env.BETTER_STACK_TOKEN,
        options: { endpoint: env.BETTER_STACK_INGEST_URL ?? 'https://in.logs.betterstack.com' },
      },
      level: 'info',
    });
  }

  logger = pino({
    level: env.LOG_LEVEL,
    transport: { targets },
    // Structured fields convention (read by Better Stack search):
    base: { service: 'sorcyn-api', env: env.NODE_ENV },
  });
  return logger;
}
```

**Wire into Fastify (`backend/src/app.ts`):**

```typescript
import { getLogger } from './config/logtail.js';
const app = Fastify({ logger: getLogger() });
```

**Env additions to `backend/src/config/env.ts`:**

```typescript
BETTER_STACK_TOKEN: z.string().optional(),
BETTER_STACK_INGEST_URL: z.string().url().optional(),
```

**Production gate via `validateProductionEnv`:**

```typescript
if (!config.BETTER_STACK_TOKEN) errors.push('BETTER_STACK_TOKEN is required in production');
```

**Plan tier sizing (~30 GB/month at MVP):**

At 1K DAU with structured pino logs (~500 bytes per log line), ~10 log lines/request, ~100 req/user/day = 5M log lines/day = ~2.5 GB/day = ~75 GB/month. **The 30 GB/month plan tier is undersized at 1K DAU.** Recommend the next tier up (~$48/mo, 100 GB) OR drop log level to `warn` in production for non-error paths. Better Stack supports per-source retention tuning. Surface in plan-time as a knob.

**Structured fields convention (always include):**

| Field | Source | Purpose |
|-------|--------|---------|
| `requestId` | Fastify `request.id` middleware (Phase 1, already wired) | Correlate logs to a single request |
| `userId` | `request.user?.id` if authenticated | Filter to a single user's session |
| `route` | `request.routeOptions.url` | Aggregate by endpoint |
| `latencyMs` | onResponse hook | Latency dashboards |
| `service` | static `'sorcyn-api'` | Source filter when multiple services log |

### 5. k6 load test scripts + thresholds (NFR-throughput, SC#1)

**Why k6 over Artillery / Gatling:**

| Tool | TS support | Prometheus output | Free tier | Verdict |
|------|------------|-------------------|-----------|---------|
| **k6** | JS native (TS via Babel) | First-class via `xk6-output-prometheus-remote` | Fully open-source, no SaaS lock-in | RECOMMENDED |
| Artillery | YAML or JS | Plugins (less mature) | Free OSS + paid SaaS Cloud | Acceptable, but k6 has stronger TS DX |
| Gatling | Scala / Kotlin / Java DSL | Via Graphite/InfluxDB | Free OSS | Wrong language ecosystem for our TS team |

[CITED: oneuptime.com/blog/post/2026-01-28-k6-prometheus-integration] confirms k6's `xk6-output-prometheus-remote` is production-ready as of v0.42.0. **Recommend k6.**

**Test scenario shape (`backend/load-tests/scenarios/transaction-loop.ts`):**

```typescript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    transaction_loop: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 1000 },   // ramp up
        { duration: '15m', target: 1000 },  // hold (SC#1 explicit)
        { duration: '2m', target: 0 },      // ramp down
      ],
    },
  },
  thresholds: {
    'http_req_duration{type:api}': ['p(95)<500'],       // NFR-performance
    'http_req_duration{type:search}': ['p(95)<500'],
    'http_req_duration{type:payment}': ['p(95)<3000'],
    'http_req_failed': ['rate<0.01'],                    // <1% error rate (SC#1)
    'iteration_duration': ['p(95)<5000'],                // full loop bound
  },
};

export default function () {
  // Login (cached token via setup/teardown)
  // Create post → fetch feed → submit offer → accept → message send
  // Each request tagged by type ({type: 'api'|'search'|'payment'})
}
```

**DB threshold (<100 ms p95):** Not directly measurable from k6 (it sees end-to-end HTTP). Use Sentry Performance DB span p95 as the source of truth, captured during the same load test window. Audit-suite assertion parses Sentry export.

**Staging environment:**

- Mirror prod VPS class (same Hetzner CX21 or whatever D-01 chooses)
- **Anonymized prod data clone:** `pg_dump` from prod → run `backend/scripts/anonymize.sql` (PLANNER MUST WRITE this script — pseudonymize emails to `loadtest+{user_id}@sorcyn.test`, redact `phone`, redact `bio` to lorem-ipsum, randomize `firstName`/`lastName` from a fixed dictionary, NULL `stripe_customer_id` since staging uses Stripe test mode) → restore into staging Supabase
- **Seeded test users:** Reuse `backend/tests/helpers.ts` `createTestUser` patterns adapted for k6 setup — pre-create 100 buyer + 100 seller test accounts via API once, cache JWTs in a JSON file the load test reads

**CI integration:**

Separate workflow `.github/workflows/load-test.yml` with `workflow_dispatch` (manual) + weekly cron. NOT in the per-commit pipeline (load tests take ~25 min). Outputs k6 JSON summary as a CI artifact; the audit suite parses it.

### 6. Slack alert routing (D-06)

**Three sources fire into `#sorcyn-prod-alerts`:**

1. **Sentry → Slack** via Sentry's native Slack integration (workspace-level OAuth install). Configured per-project alert rules (see §3 above).
2. **Prometheus AlertManager → Slack** via `slack_configs` block with incoming-webhook URL. Existing `prom-client` metrics in Phase 1 feed AlertManager.
3. **Better Stack → Slack** via Better Stack's built-in Slack alerts (configured in Better Stack UI per source).

**AlertManager `slack_configs` (deploy with the LB or a tiny ops VPS):**

```yaml
# alertmanager.yml
route:
  receiver: 'sorcyn-prod-alerts'
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 1h
receivers:
  - name: 'sorcyn-prod-alerts'
    slack_configs:
      - api_url: ${SLACK_WEBHOOK_URL}
        channel: '#sorcyn-prod-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

**Recommended alert rules (Prometheus):**

```yaml
groups:
  - name: sorcyn-prod
    rules:
      - alert: ApiHigh5xxBurst
        expr: rate(http_requests_total{status=~"5.."}[1m]) > 0.05 * rate(http_requests_total[1m])
        for: 1m
        annotations: { summary: ">5% 5xx rate over 1 min" }
      - alert: ApiP95LatencyBreach
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        annotations: { summary: "API p95 >500ms over 5 min" }
      - alert: ContainerDown
        expr: up{job="sorcyn-api"} == 0
        for: 1m
        annotations: { summary: "API container down" }
      - alert: BullMQBacklog
        expr: bullmq_queue_waiting_count{queue="notifications"} > 100
        for: 5m
        annotations: { summary: "Notifications queue backlog >100" }
      - alert: StripeWebhookFailureSpike
        expr: rate(stripe_webhook_failures_total[5m]) > 0.1
        for: 2m
        annotations: { summary: "Stripe webhook failure rate >10%" }
```

**Alert-fatigue mitigation (solo-founder context):**

- **Severity tagging:** Critical (paged immediately), High (15 min digest), Medium (hourly digest). Use Slack channel routing: critical → `#sorcyn-prod-alerts`, lower → `#sorcyn-prod-monitoring` (separate channel; mute notifications).
- **Deduplication:** AlertManager `group_interval: 5m` + `repeat_interval: 1h` prevent spam.
- **NO quiet hours** — solo-founder = always on-call. Document in runbook.

### 7. Synthetic incident drill + Better Stack monitors (D-08)

**`scripts/synthetic-incident.sh` runbook structure:**

```bash
#!/bin/bash
# Run quarterly against staging. Captures Slack screenshot evidence.
set -euo pipefail

echo "=== Step 1: Container down (uptime alert) ==="
ssh staging-vps 'docker compose stop api'
sleep 90  # wait for Better Stack monitor + AlertManager to detect
echo "Verify: ContainerDown alert fired in #sorcyn-prod-alerts. Press enter."
read
ssh staging-vps 'docker compose start api'

echo "=== Step 2: 5xx burst (error-rate alert) ==="
for i in {1..50}; do
  curl -X GET https://staging.sorcyn.com/api/v1/__test/force-500 &
done; wait
sleep 90
echo "Verify: ApiHigh5xxBurst fired. Press enter."
read

echo "=== Step 3: Slow query (latency alert) ==="
ssh staging-vps 'docker exec api psql $DATABASE_URL -c "SELECT pg_sleep(2);"' &
# Drive load through endpoint that triggers slow query path
k6 run scripts/synthetic-slow-query.js
sleep 300  # 5 min for p95 over window
echo "Verify: ApiP95LatencyBreach fired. Press enter."
read

echo "=== Step 4: Stripe webhook secret revoke (webhook-failure alert) ==="
ssh staging-vps 'docker exec api sh -c "STRIPE_WEBHOOK_SECRET=invalid_secret docker compose up -d api"'
# Trigger a webhook from Stripe Dashboard → test mode → resend last event
sleep 180
echo "Verify: StripeWebhookFailureSpike fired. Press enter."
read

echo "=== Restoration ==="
ssh staging-vps 'docker compose up -d api'  # restore correct env
echo "Drill complete. Capture Slack screenshots from #sorcyn-prod-alerts."
```

**Backend instrumentation gap (PLANNER MUST DECIDE):** Step 2 requires a `/api/v1/__test/force-500` endpoint. Either (a) gated behind `NODE_ENV !== 'production'` AND a `X-Test-Token` header matching a secret, or (b) implemented as a dummy route on the staging-only docker-compose override. Recommend (a) for simpler ops; the planner finalizes.

**Better Stack continuous monitors:**

| Monitor | Endpoint | Cadence | Pass criteria |
|---------|----------|---------|---------------|
| API health | `https://api.sorcyn.com/health` | 1 min | 200 OK + body `{"status":"ok"}` |
| Auth login | `POST /api/v1/auth/login` (synthetic creds) | 5 min | 200 OK + JWT in body |
| Posts feed | `GET /api/v1/posts?limit=1` (synthetic auth) | 5 min | 200 OK + array body |
| Stripe webhook reachability | `POST /api/v1/payments/webhook` (signed test event) | 5 min | 200 OK |

Multi-region check (US-East, US-West, EU) per Better Stack default configuration.

### 8. Flutter accessibility tooling (NFR-accessibility, SC#3)

**Package recommendation:**

`accessibility_test` is the user-locked default in CONTEXT.md. Research surfaces an alternative — `flutter_accessibility_scanner` (pub.dev) — that explicitly targets WCAG 2.1 Level AA with checks for non-text content, contrast (4.5:1 ratio), non-text contrast, and keyboard support [CITED: pub.dev/packages/flutter_accessibility_scanner]. Either works; recommend keeping `accessibility_test` (Flutter's first-party guideline API) for widget tests + adding `flutter_accessibility_scanner` only if the planner finds gaps in coverage during phase execution.

**Built-in Flutter Guideline API (always available, no package needed for these):**

```dart
// mobile/test/accessibility/screens_a11y_test.dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('home screen passes Flutter Guideline API', (tester) async {
    await tester.pumpWidget(const SorcynApp());
    await tester.pumpAndSettle();

    final handle = tester.ensureSemantics();
    await expectLater(tester, meetsGuideline(textContrastGuideline));        // WCAG 1.4.3 (4.5:1 contrast)
    await expectLater(tester, meetsGuideline(androidTapTargetGuideline));    // 48×48 dp Android
    await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));        // 44×44 pt iOS
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));    // every tap target has semantic label
    handle.dispose();
  });
}
```

[CITED: docs.flutter.dev/ui/accessibility/accessibility-testing] — Flutter's built-in `meetsGuideline` checker is the canonical WCAG 2.1 AA validator for widget tests.

**Manual screen-reader walkthrough script (per screen, ~5 min):**

For each of the 40 customer-facing screens:
1. Enable VoiceOver (iOS) or TalkBack (Android)
2. Swipe-navigate end to end — every element MUST announce semantic label
3. Test custom widgets specifically: `gradient_fab`, `bottom_nav_bar`, `welcome_card`, `post_card`, `status_badge`, `urgency_chip` (Phase 2 deliverables — verify each has `Semantics(label:)` wrapper)
4. Test gradient buttons against white background — flag any contrast <4.5:1 (gradient `#7C3AED → #A855F7` against white passes for the lighter shade only at large text size; verify AA at small text)
5. Test 44×44 px touch targets — the `gradient_fab` and `bottom_nav_bar` icons in particular

**Per-screen pass/fail tracking in `docs/A11Y_AUDIT.md`:**

```markdown
| Screen | Tap Target | Contrast | SR Label | Keyboard | Status |
|--------|-----------|----------|----------|----------|--------|
| LoginScreen | PASS | PASS | PASS | N/A (mobile) | PASS |
| PostDetailScreen | PASS | FAIL → REMEDIATED (raised gradient overlay) | PASS | N/A | PASS |
| ... (40 rows) | | | | | |
```

**Common remediations (likely needed):**
- Missing `Semantics(label: '...')` on icon-only buttons (gradient_fab, share buttons)
- Low-contrast purple gradient text on white (especially on `welcome_card` headers — verify with axe contrast checker)
- 44×44 touch target on `bottom_nav_bar` icons — current Phase 2 spec is 56 px button height; nav icons may be smaller
- `axe-core` for any web touchpoints — only one: the Stripe Identity hosted-flow page, which is Stripe's responsibility, NOT ours. Document that we don't ship web pages and skip axe-core.

### 9. Test coverage gap-fill priorities (NFR-test-coverage, SC#2)

**Step 1 — measure baseline:**

```bash
cd backend && npm run test:coverage
```

Existing `backend/vitest.config.ts` already configures V8 coverage with thresholds (lines: 80, functions: 75, branches: 65, statements: 80) — these are PER-FILE thresholds, NOT overall, and are aspirational targets that may already be failing (see Pitfall §3). Phase 4 must establish the actual baseline number first.

**Step 2 — gap-fill priorities (from CONCERNS.md High items):**

| Priority | Gap | File | New tests | Notes |
|----------|-----|------|-----------|-------|
| P0 | Payment webhook idempotency | `backend/tests/payments.test.ts` | Duplicate `payment_intent.succeeded` event handling, partial refunds, failed refunds, Stripe account suspended mid-transaction | Existing `stripe:event:{event.id}` SETNX dedup is the mechanism; tests assert no double-release |
| P0 | Transaction state transitions | `backend/tests/transactions.test.ts` | Invalid transitions (e.g., `completed → awaiting_approval`), concurrent status updates | Tests exercise `status_transitions_by_type` ADR |
| P0 | Auth session rotation | `backend/tests/auth.test.ts` | Refresh token reuse detection with concurrent requests, token rotation race conditions, session invalidation on password reset during active session | Tests assert `auth:refresh:{userId}:*` SCAN-based revocation |
| P1 | Phase 3 deferred backend smoke tests (folded here) | `backend/tests/sellers.test.ts` + `backend/tests/auth.test.ts` | (a) `POST /sellers/identity/verify` happy path returns Stripe Identity URL; (b) Identity webhook auto-creates approved `VerificationRequest`; (c) `POST /auth/register` rejects business account without EIN | Already deferred in 03-VERIFICATION.md Known Gaps; folding here per Phase 3 carry-over |
| P2 | Admin actions and audit trail | `backend/tests/admin.test.ts` | Admin suspension of active seller mid-transaction; admin refund of held escrow | Lower priority — internal tooling, not buyer-facing |
| P2 | Message rate limiting + payment regex | `backend/tests/messages.test.ts` | Boundary at exactly 50/hr; payment regex variant spellings | Lower priority — not launch-critical |

**Mobile coverage path:**

```bash
cd mobile && flutter test --coverage
genhtml coverage/lcov.info -o coverage/html  # if lcov installed
```

Mobile target = same 70% with 70/20/10 split. Flutter coverage tooling already wired in Phase 1.

**70/20/10 split definition:**

| Type | What counts | Where |
|------|-------------|-------|
| Unit (70%) | Pure-function tests, schema validation, fee calc, regex tests | Currently mixed in module test files |
| Integration (20%) | `app.inject()` HTTP-level tests against real Prisma + Redis | Most existing backend tests |
| E2E (10%) | Full user-journey scripts (curl bash scripts already exist + new k6 smoke scenarios) | `backend/tests/api/*.sh` (18 existing) |

The split is calculated from test count, not coverage percentage. Audit suite asserts the split.

### 10. Mobile shell carry-over wiring (Phase 3 deferral)

**Files to add (per 03-VERIFICATION.md Known Gaps; reuses Phase 2 Sorcyn design tokens):**

| File | Action | Pattern reused |
|------|--------|----------------|
| `mobile/lib/features/sellers/presentation/screens/identity_verify_screen.dart` | NEW | `url_launcher` opens Stripe Identity hosted URL; `WidgetsBindingObserver` refetches profile on `AppLifecycleState.resumed` (same shape as Phase 3 03-02 `stripe_onboard_screen.dart`) |
| `mobile/lib/features/sellers/providers/seller_provider.dart` | EDIT | Add `startIdentityVerification` action that calls repository |
| `mobile/lib/features/sellers/data/repositories/seller_repository.dart` | EDIT | Add `POST /sellers/identity/verify` Dio call |
| `mobile/lib/features/auth/presentation/screens/register_screen.dart` | EDIT | EIN `TextFormField` shown when `isBusiness` toggle is on; client-side regex `/^\d{2}-\d{7}$/`; reuse Phase 2 `app_input_field` widget (52 px height, gradient focus) |
| `mobile/lib/app.dart` | EDIT | Register `IdentityVerifyScreen` route at `/seller/identity/verify` |
| `mobile/lib/features/posts/presentation/screens/manual_post_creation_screen.dart` | EDIT | `roleTier` `DropdownButtonFormField` shown when category is Jobs (entry / mid / specialized_senior); reuse Phase 2 input styling |
| `backend/tests/sellers.test.ts` | EDIT | Identity-session API smoke (folded into §9 P1 above) |
| `backend/tests/auth.test.ts` | EDIT | EIN-gate API smoke (folded into §9 P1 above) |

**Design tokens (reused from Phase 2, no new contract):**
- Primary `#7C3AED`, secondary `#A855F7`, gradient `linear-gradient(135deg, #7C3AED, #A855F7)`
- Button shadow `0 8px 20px rgba(124,58,237,0.35)`, 12/16/24 px radii, 52/56 px input/button heights
- Spring transitions stiffness 320 damping 32, `active:scale-[0.97]` tap

**Estimated work:** 2 new screens + 1 dropdown + 1 route + 2 backend tests = ~half a wave.

### 11. DR drill mechanics (Claude discretion, SC#4)

**Supabase backup-and-restore mechanics:**

- **PITR (Point-in-Time Recovery):** Available on Pro plan and above ($25/mo); 7-day retention, 1-min granularity. Already presumed enabled per CLAUDE.md Supabase usage. Verify in Supabase dashboard → Settings → Backups.
- **Daily backups:** Automatic, kept 7 days on Pro, 14 days on Team. NFR-disaster-recovery requires 30-day retention → may need plan upgrade OR explicit `pg_dump`-to-R2 nightly job. **Recommend nightly `pg_dump` to R2** — costs ~$0.015/GB/mo at R2 pricing, far cheaper than Supabase plan upgrade.

**Restore-to-different-region procedure (drill):**

```
1. Spin up new Supabase project in alternate region (us-west-1 if prod is us-east-2)
2. Trigger pg_restore from latest pg_dump in R2:
   pg_restore -h <new-host> -d postgres -U postgres /backups/sorcyn-2026-XX-XX.dump
3. Apply post-restore tasks: refresh materialized views, rebuild GIN search indexes
4. Reconfigure backend env: NEW DATABASE_URL → restart docker-compose
5. Smoke test: login → fetch feed → submit offer (validate FK integrity)
6. Capture timestamps:
   - T0 = decision to restore
   - T1 = restore complete
   - T2 = backend pointed at new DB
   - T3 = smoke test green
   - RTO = T3 - T0 (target <4h)
   - RPO = backup_timestamp - T0 (target <1h, satisfied by hourly pg_dump)
```

**R2 cross-region replication for image evidence:**

CONCERNS.md flags this as missing. Cloudflare R2 supports Object Lifecycle and Worker-based replication, but native cross-region replication is more limited than AWS S3. Two options:

| Option | Cost | RPO impact |
|--------|------|------------|
| (a) Cloudflare Workers cron job nightly: `aws s3 sync s3://r2-prod s3://r2-dr` | ~$0.50/mo per 1M objects | RPO = 24h (acceptable for image evidence; payment-critical data is in DB) |
| (b) Same-region multi-bucket with Worker-driven async replication | similar | RPO ~minutes |

**Recommend (a)** — DR for images can tolerate 24h RPO; transaction data drives the <1h RPO requirement.

**Quarterly cadence enforcement:**

- Calendar event in Faisal's Google Calendar with `gsd-review-backlog` reminder
- `docs/runbooks/dr-drill.md` records each drill date + RTO/RPO measurements
- Audit suite asserts `docs/runbooks/dr-drill.md` exists; manual review confirms cadence

### 12. PCI-DSS SAQ-A attestation (NFR-security, SC#2)

**Sorcyn integration shape vs SAQ-A eligibility:**

Sorcyn's payment surface:
- Stripe Connect Standard (sellers' Stripe accounts; Stripe handles seller KYC)
- Separate Charges + Transfers (buyer payment via Stripe-hosted Payment Element / Stripe SDK on mobile via `flutter_stripe`)
- Stripe Identity hosted-flow (PII verification; no card data)

[CITED: stripe.com/guides/pci-compliance] confirms: "If you use Stripe Elements (embedded fields that send data directly to Stripe), you qualify for SAQ A." `flutter_stripe` mounts the equivalent of Stripe Elements (PaymentSheet) — card data never touches our backend.

**Best-case SAQ-A path (HIGH likelihood per research):**

- Filing: download SAQ-A v4.0 from PCI council (PCI-DSS-v4-0-SAQ-A.pdf, 31 questions across general security)
- Internal attestation: Faisal signs as merchant
- No external auditor required (SAQ-A is self-assessment for merchants accepting <6M Visa transactions/year)
- Document: `docs/PCI_SAQ_A.md` summarizing scope + attestation date

**Worst-case SAQ-A-EP path (LOW likelihood, ~10% per PCI-DSS 4.0 update):**

[CITED: hyperproof.io/resource/pci-dss-4-0-update-new-saq-a-eligibility-criteria] notes: "PCI-DSS 4.0 introduced FAQ 1588 with new SAQ A eligibility criteria; merchants using iframes/embedded payment forms have two compliance paths to qualify for SAQ A, including PCI DSS Requirements 6.4.3 and 11.6.1."

If Stripe support says we need SAQ A-EP, the additional requirements (6.4.3 = script integrity for payment page; 11.6.1 = change-detection for payment-page scripts) apply only to web payment pages. Sorcyn is mobile-first; the only web touchpoint is Stripe's own hosted page. **Likely still SAQ-A.**

**Surface as a blocker:** STATE.md flags this as the open Phase 4 blocker. Plan-time MUST include "Stripe support ticket open + answer recorded" as a gate before the security plan ships. The ticket question template:

> "Our integration uses Stripe Connect Standard (sellers as connected accounts), Separate Charges + Transfers escrow flow via PaymentIntents created from our backend, Stripe-hosted PaymentSheet on mobile (flutter_stripe SDK 11.x), and Stripe Identity hosted verification flow (no Sorcyn-rendered web payment page). Card data never reaches our servers. Does our integration qualify for SAQ-A self-assessment, or do we need SAQ-A-EP?"

**Deliverable shape (`docs/PCI_SAQ_A.md`):**

```markdown
# PCI-DSS SAQ-A Attestation

**Filed:** 2026-XX-XX
**Stripe support ticket:** [link or thread ID]
**Stripe response:** [paste authoritative answer]

## Integration Surface
- Stripe Connect Standard (DEC-stripe-connect-standard)
- Separate Charges + Transfers (DEC-separate-charges-and-transfers)
- flutter_stripe PaymentSheet on mobile (DEC-flutter-stripe)
- Stripe Identity hosted verification (Phase 3 03-06)

## SAQ-A Self-Assessment
[answer each of the 31 SAQ-A questions]

## Attestation
Signed: Faisal Idris, NiftyByte LLC, [date]
```

### 13. OWASP ZAP + Snyk dependency audit (NFR-security)

**OWASP ZAP scan profile:**

- **Baseline scan:** Passive crawl of API surface, no aggressive payloads. Run via `zaproxy/zap-baseline` Docker image in CI.
- **Active scan:** Full attack vector scan with seeded test JWT (auth-aware). Run weekly, NOT per-commit.
- **Pass criterion:** Zero HIGH, zero CRITICAL findings. MEDIUMs logged but non-blocking pre-launch.
- **Auth shape:** ZAP supports JWT replacement strategy via context script — generate a long-lived test JWT, configure ZAP to inject it on every request.
- **Target:** `https://staging.sorcyn.com/api/v1` (NOT production — ZAP's active scan can trigger destructive operations).

**Snyk for dependency audit:**

- **Backend:** `snyk test` against `backend/package-lock.json`
- **Mobile:** `snyk test --file=mobile/pubspec.yaml` (Snyk supports Dart/Flutter)
- **Pass criterion:** Zero HIGH, zero CRITICAL CVEs in dependencies.
- **CI integration:** Add 4th job `security-scan` between `test` and `build-and-push` in `.github/workflows/ci.yml`. Fails the pipeline on HIGH/CRITICAL.

**Evidence capture:**

- ZAP HTML report → `docs/security-scans/zap-report-{date}.html`, retained 90 days as CI artifact
- Snyk JSON report → `docs/security-scans/snyk-report-{date}.json`, retained 90 days as CI artifact
- `gitignore` `docs/security-scans/` (large reports, regenerable)

**4th CI job shape:**

```yaml
security-scan:
  name: Security Scan (Snyk + ZAP baseline)
  runs-on: ubuntu-latest
  needs: [test]
  steps:
    - uses: actions/checkout@v4
    - name: Snyk backend
      uses: snyk/actions/node@master
      env: { SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }} }
      with:
        args: --file=backend/package-lock.json --severity-threshold=high
    - name: Snyk mobile (Dart)
      run: |
        npm install -g snyk
        snyk test --file=mobile/pubspec.yaml --severity-threshold=high
    - name: ZAP Baseline
      uses: zaproxy/action-baseline@v0.13.0
      with:
        target: 'https://staging.sorcyn.com'
        rules_file_name: '.github/zap-rules.tsv'  # ignore expected MEDIUM findings
        fail_action: true
```

### 14. Audit suite expansion (CONTEXT.md specifics, all 5 SCs)

Phase 4 NFR audits extend `backend/tests/audit/closeout-audit.test.ts` with new `describe` blocks per success criterion. The CI gate stays single-command: `npx vitest run tests/audit`.

**New describe blocks (rough sketch):**

```typescript
describe('Phase 4 Pre-Launch — SC1: Load test thresholds', () => {
  it('docs/load-test-report.md exists with k6 JSON summary', () => {
    expect(existsSync(resolve(rootPath, 'docs/load-test-report.md'))).toBe(true);
  });
  it('k6 JSON summary asserts API p95 < 500ms', () => {
    const summary = JSON.parse(readFileSync(resolve(rootPath, 'docs/load-test-summary.json'), 'utf-8'));
    expect(summary.metrics['http_req_duration{type:api}'].values['p(95)']).toBeLessThan(500);
  });
  // ... assertions for search, payment, DB, error rate
});

describe('Phase 4 Pre-Launch — SC2a: Test coverage thresholds', () => {
  it('coverage-summary.json shows lines >= 70%', () => {
    const cov = JSON.parse(readFileSync(resolve(rootPath, 'backend/coverage/coverage-summary.json'), 'utf-8'));
    expect(cov.total.lines.pct).toBeGreaterThanOrEqual(70);
  });
});

describe('Phase 4 Pre-Launch — SC2b: Security scan zero-HIGH', () => { /* ZAP + Snyk report parses */ });
describe('Phase 4 Pre-Launch — SC2c: PCI-DSS SAQ-A filed', () => { /* docs/PCI_SAQ_A.md exists + dated */ });
describe('Phase 4 Pre-Launch — SC3: A11Y per-screen pass', () => { /* docs/A11Y_AUDIT.md every row PASS */ });
describe('Phase 4 Pre-Launch — SC4: DR + observability drills', () => { /* runbooks exist + RTO/RPO under target */ });
describe('Phase 4 Pre-Launch — SC5a: Canary workflows exist', () => {
  it('.github/workflows/deploy-canary.yml exists', () => {
    expect(existsSync(resolve(rootPath, '.github/workflows/deploy-canary.yml'))).toBe(true);
  });
  it('.github/workflows/rollback.yml exists', () => {
    expect(existsSync(resolve(rootPath, '.github/workflows/rollback.yml'))).toBe(true);
  });
});
describe('Phase 4 Pre-Launch — SC5b: UAT signed off', () => { /* docs/UAT_REPORT.md sign-off count >= 20 */ });
describe('Phase 4 Pre-Launch — D-04 Forward-compat migrations', () => { /* latest migration has no DROP/RENAME/SET NOT NULL */ });
```

The pattern matches Phase 3's audit-as-CI-gate convention (`backend/tests/audit/closeout-audit.test.ts` line 3 comment: "One describe block per Phase X Success Criterion").

## Pitfalls

1. **Stripe shared webhook secret pattern (Phase 3 RESEARCH.md continuity).** Stripe assigns ONE signing secret per endpoint URL — Connect events AND Identity events on `/api/v1/payments/webhook` use the SAME `STRIPE_WEBHOOK_SECRET`. **DO NOT add `STRIPE_IDENTITY_WEBHOOK_SECRET` or any new webhook env var in Phase 4.** Any new event types (e.g., `charge.dispute.created` for SAQ-A workflow) flow through the existing endpoint with the existing secret. [CITED: docs.stripe.com/webhooks]

2. **Sentry SDK lazy-init.** CLAUDE.md "Critical Design Patterns" mandates `getStripe()` / `getGemini()` / Sentry-init pattern: SDKs initialized on first call, not on import. This prevents test crashes when env vars are absent. The existing `backend/src/config/sentry.ts` already follows this — Phase 4 additions (Performance integrations) MUST stay inside `initSentry()`, not at module scope. Mobile equivalent in `mobile/lib/main.dart` already does the same.

3. **Forward-compatible migration enforcement gap.** D-04 is the highest-stakes decision. WITHOUT a CI-level forcing function (audit suite regex check on latest migration), a future plan can silently ship a destructive migration that corrupts data during the 10/90 canary split. **The audit-suite regex assertion in §2 above is the gate.** Lock the ADR in `.planning/intel/decisions.md` AND add the audit assertion as part of the same Wave-0 plan, before any other Phase 4 plan ships.

4. **k6 vs `prom-client` metric collision.** Sorcyn already exports `prom-client` Prometheus metrics on `/metrics`. k6's `xk6-output-prometheus-remote` writes load-test metrics to a separate Prometheus instance via remote_write. **DO NOT point k6 at the production Prometheus** — the load-test metrics will pollute the prod-scope time-series and break dashboards. Recommend a dedicated staging Prometheus (or a separate `job` label on remote-write).

5. **Better Stack token leak via process.env in browser builds.** `BETTER_STACK_TOKEN` is a server secret. The Flutter mobile app does NOT use Better Stack directly (mobile uses Sentry for crash reporting, NOT Better Stack for logs). **Confirm `BETTER_STACK_TOKEN` is read only in `backend/src/config/logtail.ts` and never exposed via `--dart-define` to the mobile build.**

6. **Sentry Performance trace quota explosion if `tracesSampleRate` is set too high.** The Team plan has a finite trace volume (~250K traces/month at $26/mo). At 1K DAU × 100 req/user/day × 30 days = 3M requests; sampling 100% would burn through quota in days. Existing config of 0.1 (10%) gives 300K traces/month — already over the Team quota at 1K DAU. **Recommend lowering production `tracesSampleRate` to 0.05 (5%) BEFORE soft-launch traffic ramps up**, OR upgrade to Business plan ($80/mo). Plan-time decision.

7. **Nginx weighted upstream sticky-session trap (Socket.IO).** Default Nginx `upstream` uses round-robin, which breaks Socket.IO long-polling fallback (sequential polls land on different backends, sessions get lost). **Solution: `ip_hash;` directive in the `upstream` block** [CITED: nginx.org/en/docs/http/load_balancing.html]. `ip_hash` is compatible with `weight=N` per recent Nginx versions, so canary weights still work. Caveat: corporate NATs (multiple users behind one IP) cause uneven load distribution. At MVP scale (1K DAU, mostly DFW residential IPs), this is acceptable. Phase 6 may revisit with Nginx Plus's `sticky` cookie module.

8. **GitHub Actions environments require reviewer GitHub permissions — solo-founder availability.** D-02 requires Faisal as reviewer for canary stage progression. If Faisal is unavailable (sleeping, traveling, sick), the canary cannot promote past 10%, BUT old version stays serving 90% so users are unaffected. **More importantly: rollback must NOT require a reviewer** (must be one-click). The `production-rollback` GitHub Actions environment must be configured WITHOUT required reviewers; access controlled via branch protection (only Faisal can dispatch on `main`). Document this distinction in `docs/runbooks/rollback.md`.

9. **Per-file vitest coverage thresholds in existing config don't equal "70% overall."** `backend/vitest.config.ts` declares `lines: 80, functions: 75, branches: 65, statements: 80` — these are PER-FILE thresholds. SC#2 asks for ≥70% overall with 70/20/10 unit/integration/E2E split. The vitest config's per-file 80% is a stricter LOCAL gate; the audit suite's overall ≥70% gate is a separate assertion. **Don't conflate the two.** Plan-time: confirm whether existing 80% per-file threshold is currently passing (may already be failing — measure first).

10. **Audit suite parses brittle text artifacts.** SC#1 (k6 report), SC#2a (coverage JSON), SC#3 (A11Y_AUDIT.md table), SC#4 (runbooks RTO/RPO timestamps), SC#5b (UAT sign-off table) all depend on the audit suite parsing files that humans write. Any deviation from the documented format breaks the audit. **Strict templates with `<!-- AUDIT-MARKER -->` HTML comments around the parseable fields** make the parser robust against formatting drift. Apply this pattern to every Phase 4 doc artifact.

## Tooling Decisions

| Tool | Version pin | Rationale | Install command | Conflict check |
|------|-------------|-----------|-----------------|----------------|
| **k6** | v0.50+ (latest stable) | Native Prometheus remote-write; TS scenarios; OSS no SaaS lock-in [CITED: oneuptime.com 2026-01-28] | `brew install k6` (mac dev), `k6` Docker image in CI | None — net-new tool, not a runtime dep |
| **`@logtail/pino`** | latest (Pino 7+ required) | Better Stack official Pino transport [CITED: betterstack.com/docs/logs/javascript/pino] | `npm install @logtail/pino` in `backend/` | Pino is already the Fastify default logger (DEC-fastify-framework); compatible |
| **`accessibility_test`** Flutter package | per CONTEXT.md default | First-party Flutter Guideline API; covers WCAG 2.1 AA (textContrast, tapTarget, labeledTapTarget) [CITED: docs.flutter.dev/ui/accessibility/accessibility-testing] | already in Flutter SDK | None |
| **`flutter_accessibility_scanner`** (optional add) | 0.x latest | Adds explicit WCAG 2.1 Level AA contrast (4.5:1) and keyboard checks; supplements `accessibility_test` | `flutter pub add flutter_accessibility_scanner --dev` | None |
| **Snyk CLI** | latest | Dependency CVE scan for Node + Dart [CITED: snyk.io/docs] | `npm install -g snyk` in CI; `SNYK_TOKEN` GitHub secret | None |
| **OWASP ZAP** | 2.16+ via `zaproxy/action-baseline@v0.13.0` | Standard API security scanner; auth-aware via JWT replacement | Docker image in CI | Active scan must hit staging (NOT prod); destructive |
| **Sentry SDK additions** | `@sentry/node` already installed; verify `@sentry/profiling-node` if profilesSampleRate is enabled (recommend NOT for MVP) | Existing SDK; only config changes | none | None — extends existing |
| **`xk6-output-prometheus-remote`** | bundled with k6 v0.42+ | Prometheus remote-write for k6 metrics (separate scope from prod Prom) | bundled | Pitfall #4 — separate Prometheus instance |
| **`pino-logtail-cli`** for Logtail Live Tail (optional dev tool) | 0.x | Better Stack live-tail in terminal | `npm install -g @logtail/cli` | None |

**No new runtime dependencies expected** beyond `@logtail/pino` on backend. All other tools are CI-side or dev-side.

## Phase 3 Carry-Over Wiring

**Goal:** Add the 5 mobile files + 1 dropdown + 2 backend smoke tests deferred from Phase 3 (per 03-VERIFICATION.md "Known Gaps") so Phase 4 can audit the FULL customer-facing surface for SC#3 + SC#5.

**Single plan:** `04-MOBILE-SHELL-CARRYOVER-PLAN.md` (or whatever numbering the planner chooses; recommend Wave 1 alongside Wave 0 ADR lock so the surface is complete before A11Y + UAT).

**Files:**

| File | Type | Purpose |
|------|------|---------|
| `mobile/lib/features/sellers/presentation/screens/identity_verify_screen.dart` | NEW | Stripe Identity hosted-flow launcher (`url_launcher` + `WidgetsBindingObserver` resume hook) |
| `mobile/lib/features/sellers/providers/seller_provider.dart` | EDIT | Add `startIdentityVerification` action |
| `mobile/lib/features/sellers/data/repositories/seller_repository.dart` | EDIT | Add `POST /sellers/identity/verify` Dio call |
| `mobile/lib/features/auth/presentation/screens/register_screen.dart` | EDIT | EIN field shown when `isBusiness` toggle on; client-side regex |
| `mobile/lib/app.dart` | EDIT | Register `IdentityVerifyScreen` route |
| `mobile/lib/features/posts/presentation/screens/manual_post_creation_screen.dart` | EDIT | `roleTier` `DropdownButtonFormField` (Jobs only) |
| `backend/tests/sellers.test.ts` | EDIT | Identity-session API smoke (folded into §9 P1) |
| `backend/tests/auth.test.ts` | EDIT | EIN-gate API smoke (folded into §9 P1) |

**Reuses Phase 2 Sorcyn design tokens; no new design contract; no new requirement IDs (already covered by `REQ-verification-badges` + `REQ-business-account-ein` + `REQ-jobs-lead-gen` from Phase 3).**

**Estimated effort:** ~half a wave (2 new screens + 1 edit each in 5 files + 2 tests).

## Per-Plan Skeleton Recommendations

**Recommended structure: 7 plans across 5 waves.** Front-loaded D-04 ADR lock as Wave 0 prerequisite (HIGHEST stakes per CONTEXT.md `<specifics>`).

### Wave 0 — Prerequisite (cannot skip, blocks every other plan)

- **`04-00-PLAN.md` — Forward-compatible migration ADR lock (D-04)**
  - Lock new `DEC-forward-compatible-migrations` ADR in `.planning/intel/decisions.md`
  - Surface in `CLAUDE.md` "Critical Design Patterns" section
  - Add audit-suite regex assertion in `tests/audit/closeout-audit.test.ts` (forbidden tokens: DROP, RENAME, SET NOT NULL on existing column)
  - **Estimated: 1 task, very small**

### Wave 1 — Surface completion + observability foundation (parallel-safe; both unblock A11Y + UAT in later waves)

- **`04-01-PLAN.md` — Mobile shell carry-over (Phase 3 deferral)**
  - 5 mobile files + dropdown + 2 backend smoke tests (per Phase 3 Carry-Over Wiring section above)
  - **Estimated: ~6 tasks, half a wave**

- **`04-02-PLAN.md` — Observability stack wiring (D-05 + D-06 + D-07)**
  - Sentry Performance integrations (httpIntegration, prismaIntegration, fastifyIntegration)
  - `@logtail/pino` transport + `BETTER_STACK_TOKEN` env addition + `validateProductionEnv` gate
  - AlertManager `slack_configs` + 5 alert rules + Sentry Slack integration
  - Sentry trace quota verification (Pitfall #6 — drop tracesSampleRate to 0.05 if Team plan)
  - **Estimated: ~5 tasks, full wave**

### Wave 2 — Canary CI/CD + DR drill (parallel-safe; both depend on observability for verification)

- **`04-03-PLAN.md` — Canary CI/CD pipeline (D-01 + D-02 + D-03)**
  - 2nd VPS provisioning + docker-compose duplication
  - Nginx config refactor: `upstream api_pool` with `ip_hash` + weights, `nginx/canary-state.json` + `render-canary.sh`
  - `.github/workflows/deploy-canary.yml` with environment gates per stage
  - `.github/workflows/rollback.yml` (NO required reviewer; branch-protection gated)
  - `docs/runbooks/rollback.md`
  - **Estimated: ~6 tasks, full wave**

- **`04-04-PLAN.md` — DR drill + R2 cross-region replication (Claude discretion + SC#4 partial)**
  - Nightly `pg_dump` to R2 (cron job; satisfies 30-day retention)
  - Cloudflare Worker for R2 nightly sync (DR images)
  - First DR drill executed: restore-to-different-region with timed RTO/RPO
  - `docs/runbooks/dr-drill.md` + signed-off attestation
  - Quarterly cadence calendar reminder
  - **Estimated: ~5 tasks, full wave**

### Wave 3 — Synthetic incident + load test + security scans (depends on Wave 1 + Wave 2)

- **`04-05-PLAN.md` — Synthetic incident drill + Better Stack monitors (D-08 + SC#4 close)**
  - `scripts/synthetic-incident.sh` runbook
  - Better Stack continuous HTTP monitors (4 endpoints, multi-region)
  - First chaos drill executed against staging
  - `docs/runbooks/observability-drill.md` + Slack screenshot evidence
  - **Estimated: ~4 tasks, half a wave**

- **`04-06-PLAN.md` — k6 load test + security scans + PCI-DSS (NFR-throughput + NFR-security + SC#1 + SC#2)**
  - k6 scenario `backend/load-tests/scenarios/transaction-loop.ts`
  - Anonymized prod-data clone script `backend/scripts/anonymize.sql`
  - Staging Prometheus instance for k6 remote-write
  - Load test executed; report `docs/load-test-report.md`
  - 4th CI job `security-scan` (Snyk + ZAP)
  - PCI-DSS Stripe support ticket + `docs/PCI_SAQ_A.md` filing
  - Test coverage gap-fill from CONCERNS.md High items (folded into payments + transactions + auth tests)
  - **Estimated: ~8 tasks, full wave (largest plan)**

### Wave 4 — Accessibility + 20-user UAT + audit suite expansion (final gate; depends on EVERY prior wave)

- **`04-07-PLAN.md` — A11Y audit + 20-user UAT + Phase 4 audit suite expansion (SC#3 + SC#5b + audit close)**
  - `accessibility_test` widget tests for 40 screens
  - Manual TalkBack/VoiceOver walkthrough; remediation cycle
  - `docs/A11Y_AUDIT.md` per-screen pass/fail
  - 20-user UAT recruitment (10 buyers + 10 sellers DFW); UAT script execution
  - `docs/UAT_REPORT.md` with sign-offs
  - Phase 4 NFR audit blocks added to `tests/audit/closeout-audit.test.ts`
  - Audit-suite green: `npx vitest run tests/audit` exits 0 with all SC blocks
  - **Estimated: ~6 tasks, full wave**

**Total: 7 plans across 5 waves. Estimated ~40 tasks total.**

## Open Questions for Planner / User

1. **PLANNER MUST DECIDE: Sentry tracesSampleRate target.** Existing 0.1 (10%) at 1K DAU produces ~300K traces/month — over the Team plan quota (~250K). Either drop to 0.05 (5%) OR upgrade to Business ($80/mo, ~25× quota). At MVP traffic (<1K DAU), 0.05 is recommended; revisit at scale.

2. **PLANNER MUST DECIDE: Better Stack plan tier.** ~75 GB/month log volume estimate at 1K DAU exceeds the ~$24/mo Team tier (30 GB). Either upgrade to next tier (~$48/mo, 100 GB) OR drop log level to `warn` in production for non-error paths. Recommend dropping log level + reviewing volume after 1 week of soft-launch traffic.

3. **PLANNER MUST DECIDE: `/api/v1/__test/force-500` endpoint shape.** Synthetic incident drill Step 2 needs a way to trigger a 5xx burst on staging. Either (a) gated dev-only endpoint behind `NODE_ENV !== 'production'` AND `X-Test-Token` header, or (b) staging-only docker-compose override that mounts a dummy route. Recommend (a) for simpler ops.

4. **USER MUST CONFIRM: PCI-DSS SAQ-A applicability.** Stripe support ticket must be filed and answered before the security plan ships. STATE.md flags this as a Phase 4 blocker. Question template provided in §12 above. If Stripe says SAQ-A-EP applies (low-likelihood), re-scope adds web-payment-page change-detection per PCI-DSS 4.0 6.4.3 / 11.6.1 (we have no such page; should still be SAQ-A).

5. **PLANNER MUST DECIDE: Better Stack `BETTER_STACK_INGEST_URL` regional choice.** Better Stack offers US + EU ingest endpoints; latency from DFW to US-East is best. Confirm `https://in.logs.betterstack.com` resolves to US-East (default).

6. **PLANNER MUST DECIDE: 2nd VPS hosting parity.** D-01 says Hetzner-style. Recommend identical Hetzner CX21 (or current prod class) in the SAME region as VPS-A (DFW-relevant region) to minimize cross-VPS latency for the LB → backend path.

7. **PLANNER MUST DECIDE: Anonymization SQL script ownership.** §5 mentions `backend/scripts/anonymize.sql` for staging-data-clone — this is net-new code. Plan-time author + content review required. Suggest reusing the email-prefix soft-delete pattern from `DEC-soft-delete-email-prefix` for emails (`anon_{user_id}@sorcyn.test`).

8. **USER MUST CONFIRM: 20-user UAT recruitment channel mix.** CONTEXT.md default is "Sorcyn waitlist + DFW Reddit + Faisal's local network." If waitlist is empty pre-launch, this collapses to local network only; that may bias the UAT toward friends-of-founder. Surface this risk; consider supplementing with a TestFlight beta-tester service if needed.

9. **PLANNER MUST DECIDE: Coverage baseline measurement timing.** Run `npm run test:coverage` BEFORE writing the gap-fill plan to know the current baseline number. The gap-fill scope depends entirely on this — if baseline is already 65%, only ~5% delta to fill (small plan); if baseline is 40%, delta is 30% (much larger plan, may need to be split).

10. **PLANNER MUST DECIDE: Whether to fold the existing per-file vitest coverage thresholds (lines 80, functions 75, branches 65, statements 80) into Phase 4 or relax them.** They may already be failing; verify before Phase 4 sets a 70% overall target on top.

## RESEARCH COMPLETE
