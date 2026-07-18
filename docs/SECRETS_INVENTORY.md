# Secrets Inventory

> Names only — no values. **Doppler** (`sorcyn-backend` project, `dev` config)
> is the canonical store for all backend runtime secrets. New collaborators
> bootstrap with `bash scripts/bootstrap-doppler.sh` — see
> [docs/setup.md § 3](setup.md) and `CLAUDE.md` § "Secrets Management — Doppler".
>
> **Status as of 2026-05-26:** CODE-READY. The bootstrap script, `doppler.yaml`,
> and `sorcyn secrets {status|setup|pull}` commands are all in the repo. The
> Doppler workplace + bulk-upload of `backend/.env` → Doppler `dev` config
> happens manually by Faisal (one-time dashboard step). Until that completes,
> operators fall back to `backend/.env`; the doctor (`sorcyn doctor`) detects
> which source is active and validates the critical keys are populated.

## Legend

- **Origin** — which vendor or system issues the secret
- **Used by** — which part of the codebase consumes it
- **Where it lives** — Doppler `sorcyn-backend / dev` for everything below
  unless noted. `backend/.env` is treated as a local cache (offline fallback).
- **Rotate?** — flagged YES if there is risk the value is exposed (committed,
  shared casually, etc.) and should be regenerated before production. NO means
  it has only been in Doppler / `backend/.env` / GitHub Actions secrets /
  placeholder examples.

---

## Backend runtime secrets (Doppler `sorcyn-backend / dev`)

| Env var | Origin | Used by | Where it lives | Rotate? |
|---|---|---|---|---|
| `DATABASE_URL` | Supabase | `backend/src/config/database.ts`, Prisma | Doppler `dev` (fallback: `backend/.env`), GitHub Actions `secrets.DATABASE_URL` | NO (until production keys are minted) |
| `DIRECT_DATABASE_URL` | Supabase | Prisma migrations (bypasses pooler) | Doppler `dev` (fallback: `backend/.env`) | NO |
| `REDIS_URL` | Local Docker / Hetzner Redis | BullMQ, Socket.IO adapter, auth refresh tokens | Doppler `dev` (fallback: `backend/.env`) | NO (no credentials in local URL) |
| `JWT_ACCESS_SECRET` | Generated locally (≥32 chars) | `backend/src/modules/auth/*` | Doppler `dev` (fallback: `backend/.env`); CI uses hardcoded test fixture | YES if any dev shared real value — generate fresh for production |
| `JWT_REFRESH_SECRET` | Generated locally (≥32 chars) | `backend/src/modules/auth/*` | Doppler `dev` (fallback: `backend/.env`); CI uses hardcoded test fixture | YES if any dev shared real value — generate fresh for production |
| `STRIPE_SECRET_KEY` | Stripe Dashboard (test or live) | `backend/src/modules/payments/*` | Doppler `dev` (fallback: `backend/.env`) (test mode only currently) | NO (test keys); live keys minted fresh at launch |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard (per-endpoint) | `backend/src/modules/payments/webhook.handler.ts` | Doppler `dev` (fallback: `backend/.env`) (test mode only) | NO; live secret minted at launch |
| `STRIPE_CONNECT_CLIENT_ID` | Stripe Dashboard | Stripe Connect onboarding | Doppler `dev` (fallback: `backend/.env`) | NO |
| `STRIPE_CONNECT_RETURN_URL` | Internal config | Stripe Connect onboarding deep link | Doppler `dev` (fallback: `backend/.env`) (default suffices) | NO (not a secret — public URL) |
| `STRIPE_CONNECT_REFRESH_URL` | Internal config | Stripe Connect onboarding deep link | Doppler `dev` (fallback: `backend/.env`) (default suffices) | NO (not a secret — public URL) |
| `R2_ACCOUNT_ID` | Cloudflare Dashboard (`ops@sorcyn.com` account) | `backend/src/common/utils/storage.ts` | **Dev: provisioned + round-trip verified 2026-07-06** (shared `sorcyn-dev` bucket in Doppler `dev`, Track A). Prod pending: Doppler `prd` + GitHub Actions `secrets.R2_ACCOUNT_ID` (Track B). See `docs/runbooks/r2-provisioning.md` | NO until provisioned |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 API token (scoped to bucket) | `backend/src/common/utils/storage.ts` | **Dev: set in Doppler `dev`** (shared `sorcyn-dev` bucket). Prod pending: Doppler `prd` + GitHub Actions `secrets.R2_ACCESS_KEY_ID`. See runbook | NO until provisioned |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 API token (scoped to bucket) | `backend/src/common/utils/storage.ts` | **Dev: set in Doppler `dev`** (shared `sorcyn-dev` bucket). Prod pending: Doppler `prd` + GitHub Actions `secrets.R2_SECRET_ACCESS_KEY`. See runbook | NO until provisioned |
| `R2_BUCKET_NAME` | Internal config | `backend/src/common/utils/storage.ts` | Doppler `dev` = `sorcyn-dev` (shared bucket, **set**); Doppler `prd` = `reverse-marketplace` (default, pending). See runbook | NO (not a secret) |
| `R2_PUBLIC_URL` | Cloudflare R2 (public bucket URL) | `storage.ts` `publicUrlFor` (image URL composition) | **Required when R2 active (#193, no fallback).** Doppler `dev` = `pub-<hash>.r2.dev` (**set + verified**); Doppler `prd` = `cdn.sorcyn.com` or `pub-<hash>.r2.dev` (pending). See runbook | NO (not a secret) |
| `RESEND_API_KEY` | Resend Dashboard | `backend/src/common/utils/email.ts` | Not yet provisioned (Resend account pending) | NO until provisioned |
| `RESEND_FROM_EMAIL` | Internal config | `backend/src/common/utils/email.ts` | Doppler `dev` (fallback: `backend/.env`) (default `noreply@sorcyn.com`) | NO (not a secret) |
| `RESEND_FROM_NAME` | Internal config | `backend/src/common/utils/email.ts` | Doppler `dev` (fallback: `backend/.env`) (default `Sorcyn`) | NO (not a secret) |
| `GEMINI_API_KEY` | Google AI Studio (https://aistudio.google.com) | `backend/src/config/gemini.ts` | Doppler `dev` (fallback: `backend/.env`) | YES — free-tier key needs rotation to a paid-tier key before launch (see CLAUDE.md Vendor Stack note) |
| `GOOGLE_MAPS_API_KEY` | Google Cloud Console | Geo features | Doppler `dev` (fallback: `backend/.env`) (may not be provisioned yet) | NO until provisioned |
| `TDLR_APP_TOKEN` | Texas Open Data Portal (data.texas.gov → Developer Settings → App Tokens) | `backend/src/modules/sellers/providers/tdlr-provider.ts` (#337) | Doppler `dev` (fallback: `backend/.env`); optional — raises the SODA rate limit to 1000 req/hr | NO (public read token, not a credential) |
| `FCM_PROJECT_ID` | Firebase Console | `backend/src/common/utils/push.ts` | Not yet provisioned (Firebase project pending) | NO until provisioned |
| `FCM_CLIENT_EMAIL` | Firebase service account JSON | `backend/src/common/utils/push.ts` | Not yet provisioned | NO until provisioned |
| `FCM_PRIVATE_KEY` | Firebase service account JSON | `backend/src/common/utils/push.ts` | Not yet provisioned | NO until provisioned |
| `SENTRY_DSN` | Sentry Dashboard | `backend/src/config/sentry.ts` | Doppler `dev` (fallback: `backend/.env`) | NO (DSN is semi-public but treat as secret) |
| `SENTRY_TRACES_SAMPLE_RATE` | Internal config | `backend/src/config/sentry.ts` | Doppler `dev` (fallback: `backend/.env`) (default 0.05 in prod) | NO (not a secret) |
| `BETTER_STACK_TOKEN` | Better Stack Dashboard (logging ingest) | `backend/src/config/logger.ts` (Logtail/Pino transport) | Doppler `dev` (fallback: `backend/.env`) (required in production) | NO unless committed by accident |
| `BETTER_STACK_INGEST_URL` | Better Stack Dashboard | `backend/src/config/logger.ts` | Doppler `dev` (fallback: `backend/.env`) | NO (not a secret — endpoint URL) |
| `APP_URL` | Internal config | Misc URL composition | Doppler `dev` (fallback: `backend/.env`) | NO (not a secret) |
| `FRONTEND_URL` | Internal config | CORS, redirects | Doppler `dev` (fallback: `backend/.env`) | NO (not a secret) |
| `METRICS_TOKEN` | Generated locally | `/metrics` endpoint auth (Prometheus scraper) | Doppler `dev` (fallback: `backend/.env`) | YES if shared with anyone outside ops |
| `ENABLE_SWAGGER` | Feature flag (boolean) | `backend/src/app.ts` | Doppler `dev` (fallback: `backend/.env`) (default false in production) | NO (not a secret) |
| `TEST_FORCE_TOKEN` | Staging-only (Phase 4 D-08) | `/api/v1/__test/force-500` route gate | Staging env only — REFUSES to start in production | YES if leaked — rotate per `docs/runbooks/observability-drill.md` |

## GitHub Actions workflow secrets (managed in repo Settings → Secrets and variables → Actions)

Migrate these to Doppler `staging` / `prd` configs once Doppler is wired into the deploy pipeline.

| Secret | Used by workflow | Purpose |
|---|---|---|
| `DEPLOY_HOST` | `ci.yml`, `nightly-backup.yml`, `deploy-canary.yml`, `rollback.yml` | SSH host for production deploys |
| `DEPLOY_USER` | All deploy workflows | SSH user |
| `DEPLOY_SSH_KEY` | All deploy workflows | SSH private key for VPS access |
| `LB_HOST` | `deploy-canary.yml`, `rollback.yml` | Nginx load-balancer host |
| `CANARY_VPS_HOST` | `deploy-canary.yml` | VPS-B canary node |
| `CANARY_HOST` | `deploy-canary.yml` | Canary URL for smoke tests |
| `DATABASE_URL` | `nightly-backup.yml` | Backup script needs read access to Supabase |
| `R2_DUMP_BUCKET` | `nightly-backup.yml` | DB backup destination |
| `R2_DUMP_BUCKET_DR` | `nightly-backup.yml` | DR (disaster recovery) replica bucket |
| `R2_IMAGES_BUCKET` | `nightly-backup.yml` | Image backup source |
| `R2_IMAGES_BUCKET_DR` | `nightly-backup.yml` | Image DR replica bucket |
| `R2_ENDPOINT` | `nightly-backup.yml` | R2 S3-compatible endpoint URL |
| `R2_ACCESS_KEY_ID` | `nightly-backup.yml` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | `nightly-backup.yml` | R2 secret key |
| `STAGING_URL` | `load-test.yml` | k6 load test target |
| `STAGING_PROM_URL` | `load-test.yml` | Prometheus push gateway URL |
| `STAGING_ADMIN_TOKEN` | `load-test.yml` | Admin auth for load test fixtures |
| `GITHUB_TOKEN` | All workflows | Auto-injected by GitHub — do not migrate |
| (per `ci.yml` hardcoded) | `ci.yml` lines 65–66 | `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` are **hardcoded test fixtures**, intentional, not real secrets |

## Mobile (Flutter) secrets

| Secret | Where it lives | Notes |
|---|---|---|
| Firebase iOS config (`GoogleService-Info.plist`) | `mobile/ios/Runner/` | Not yet provisioned. Will be a per-environment file. Encrypt or use Firebase App Distribution config injection. |
| Firebase Android config (`google-services.json`) | `mobile/android/app/` | Same as iOS — not yet provisioned. |
| Sentry DSN (Flutter) | Compile-time `--dart-define` or env file | Not yet provisioned. |

## Items to rotate before production

- [ ] `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — generate fresh ≥64-char values for production; current values in any `backend/.env` are dev-only
- [ ] `GEMINI_API_KEY` — current is a free-tier AI Studio key; rotate to a paid-tier key per CLAUDE.md Vendor Stack note before launch
- [ ] `METRICS_TOKEN` — generate fresh for production; do not reuse the local dev value
- [ ] `TEST_FORCE_TOKEN` — staging-only; verify the production env validator rejects this key (already enforced in `backend/src/config/env.ts:112`)

## Items confirmed NOT committed

A repo-wide grep for the actual secret patterns (`SG.`, `sk_live_`, `whsec_`, `re_`, `dp.st.`) returns only the `.env.example` placeholders. No real secrets are in git history as of 2026-05-25.

If anyone suspects a leak: rotate the key first, then audit `git log --all -p -S 'partial-secret-fragment'`.
