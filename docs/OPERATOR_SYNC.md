# Operator Sync Playbook — Faisal & Mohamed

> How the two of us stay synchronized on Sorcyn: code, environment, database, and
> workflow. The trigger for this doc was issue #133 — we both independently lost
> our local seed accounts, a symptom of drifting local setups. This is the shared
> contract so that doesn't recur.
>
> Database specifics live in [`DATABASE_CONFIG.md`](./DATABASE_CONFIG.md); this
> doc is the wider "how we work together" layer.

---

## Before you start work (every session)

```bash
git checkout main && git pull --ff-only      # latest main
cd backend && npm install                     # pick up dependency changes
npm run db:bootstrap                          # apply new migrations, re-seed, verify
npm run db:doctor                             # confirm seed accounts + categories + no lockout
```

If `db:doctor` is green you have a known-good baseline. Then branch and work.

---

## Branching model

- `main` is the integration branch. Never push to it directly. Always branch off
  latest `main`.
- One branch per issue/PR, with a descriptive prefix (matches
  `.planning/WORK_SPLIT.md`): `be/`, `mobile/`, `fix/`, or `feat/` —
  e.g. `fix/211-business-cert-two-step`. The prefix describes the change, not
  who owns it; either operator can use any prefix.
- Open a PR; CI must pass. **CI runs on PRs only** — `main` has no push CI, so
  latent breakages surface on the next PR. Don't let work sit un-PR'd for long.
- Keep PRs focused on a single issue so review and revert stay clean.

## Who owns what

**As of 2026-06-15 the backend/mobile layer split is retired** — Faisal
(`faisalidris014`, admin) and Mohamed (`leenamichoacana`, write) **both own the
full stack** and either can take any issue. Full detail lives in
`.planning/WORK_SPLIT.md`.

Collision-avoidance now rests on the realtime claim system
(`docs/REALTIME_SYNC.md`): the **same-file claim gate** blocks two agents from
editing one file at once. It **fails open** (advisory, not a merge lock), so PR
review + CI stay the real gates. There are no lanes and no out-of-lane warnings
anymore.

`backend/` and the Flutter app are separate directories, so file-level collisions
stay rare even with shared ownership. The *logical* seams — the API contract
(`contracts/openapi.json`), Prisma schema/migrations, and env-var shape — cross
into the other's runtime and the claim gate won't catch them, so flag those in
the PR and to your partner before merging.

---

## Environment & secrets

- **`backend/.env`** is **per-machine and gitignored.** It holds your local
  `DATABASE_URL` (your Postgres user differs from your partner's) and real
  secret keys. Never commit it. Never paste secrets into chat or docs.
- **`backend/.env.example`** is the **shared shape** — the single source of truth
  for *which* variables exist and their format. When you add or rename an env var,
  update `.env.example` in the same PR and tell your partner.
- **`backend/.env.test`** is **derived and gitignored** — `db:bootstrap` generates
  it from your `.env`. Its template is the committed `.env.test.example`.
- Rotating a shared secret (Stripe, SendGrid, Gemini, etc.): rotate, update your
  own `.env`, and hand the new value to your partner over a secure channel — not
  git, not this repo.

---

## Database & migrations workflow

> **The app dev DB is now a shared hosted Supabase database (issue #214).** Both
> operators' `sorcyn dev` runtimes point at the same Supabase instance via the
> **shared Doppler `dev` config** (`DATABASE_URL` pooled, `DIRECT_DATABASE_URL`
> direct), so app data no longer drifts. **Tests still run against LOCAL Postgres**
> (`reverse_marketplace_test`) because the suite purges and reseeds. Keep your
> local `.env` `DATABASE_URL` pointed at local Postgres — `db:bootstrap` refuses to
> run if it points at Supabase. Full model + provisioning steps in
> [`DATABASE_CONFIG.md`](./DATABASE_CONFIG.md#shared-supabase-dev-db-issue-214).

The test/local database is the thing most likely to drift between two machines. Rules:

1. **Schema changes go through Prisma migrations**, committed to
   `backend/prisma/migrations/`. After pulling a branch with new migrations, run
   `npm run db:bootstrap` (or `npx prisma migrate deploy`) to apply them.
   The history was rebaselined in #153 — migrations start from a single
   `00000000000000_baseline` that reproduces `schema.prisma` exactly, and the
   `migration-drift` CI job fails any PR where `migrate deploy` no longer matches
   `schema.prisma`. Authoritative mechanism: **`db push`** for dev/CI,
   **`migrate deploy`** for production (details in `DATABASE_CONFIG.md`).
2. **Forward-compatible-only migrations during canary** (see CLAUDE.md /
   `.planning/intel/decisions.md` `DEC-forward-compatible-migrations`): every
   migration must be additive — nullable columns, new tables. No `DROP` /
   `RENAME` / `SET NOT NULL` on existing columns. Destructive changes ship in a
   follow-up release after the prior version drains. CI enforces this via
   `backend/tests/audit/closeout-audit.test.ts`.
3. **Seed data is shared** via `prisma/seed.ts`. The 4 standard accounts and 38
   categories must be identical on both machines. Re-seeding is idempotent and
   repairs drift — run `npm run db:seed` whenever `db:doctor` complains.
4. **Tests never touch dev data.** The suite runs against `reverse_marketplace_test`,
   guarded so it can't run against a non-`_test` DB. Full rationale in
   [`DATABASE_CONFIG.md`](./DATABASE_CONFIG.md).

When you author a migration, mention it in the PR description so your partner
knows to re-bootstrap after pulling.

---

## Quick reference

| Situation | Command |
|-----------|---------|
| Start of session / after pulling | `npm run db:bootstrap` |
| Verify local DB health | `npm run db:doctor` |
| Login fails on the sim | `npm run db:doctor`, then `db:reset-lockout` + `db:seed` |
| Re-create/repair seed accounts | `npm run db:seed` |
| Clear a Redis login lockout | `npm run db:reset-lockout` |

---

---

## Realtime sync (automatic layer)

The sections above are the human contract. On top of them runs an **automatic
work-claim system** so both operators' AI agents see each other's in-flight edits
in realtime — without anyone remembering to announce anything.

- Each Claude Code session registers what it's editing into the **shared Supabase**
  (a `SessionStart` hook), checks for collisions before every edit (a `PreToolUse`
  hook), and releases on exit (`SessionEnd`).
- A real collision (the other operator's agent is live on the **same file**) is
  blocked. Out-of-lane warnings are retired (both own the full stack now). It
  **fails open** — never blocks coding if the store is unreachable.
- Live board any time: `node scripts/devsync/claim.mjs list`.
- The ownership model is [`.planning/WORK_SPLIT.md`](../.planning/WORK_SPLIT.md);
  the human-readable fallback board is [`.planning/NOW.md`](../.planning/NOW.md).

One-time setup per machine: add the shared `SYNC_DATABASE_URL` to `backend/.env`
(or Doppler), then `bash scripts/bootstrap-devsync.sh`. Full detail:
[`REALTIME_SYNC.md`](./REALTIME_SYNC.md).

The **API contract** seam is likewise tracked automatically: `contracts/openapi.json`
is committed and CI-gated for drift — regenerate it (`cd backend && npm run
contract:generate`) in the same PR as any API change. See [`../contracts/README.md`](../contracts/README.md).

## Related

- [`REALTIME_SYNC.md`](./REALTIME_SYNC.md) — the automatic work-claim system.
- [`../.planning/WORK_SPLIT.md`](../.planning/WORK_SPLIT.md) — canonical ownership model (full-stack, shared).
- [`../contracts/README.md`](../contracts/README.md) — API contract artifact + drift gate.
- [`DATABASE_CONFIG.md`](./DATABASE_CONFIG.md) — authoritative DB wiring + troubleshooting.
- [`setup.md`](./setup.md) — local dev setup.
- `CLAUDE.md` — project decisions and critical patterns.
