# Contributing to Sorcyn / ReverseMarketplace

Welcome. This repo backs the Sorcyn reverse-marketplace platform — a Fastify/TypeScript backend, a Flutter mobile app, and Postgres + Redis via Docker.

The goal of this doc is simple: **clone the repo, run two commands, start developing.**

## One-time machine setup

You only need to do these once per machine:

1. **Docker Desktop** — download from <https://www.docker.com/products/docker-desktop/>, launch the app, and leave it running. The Docker daemon is what every `docker compose` command talks to.
2. **Node 20 LTS** — `nvm install 20 && nvm use 20`
3. **Flutter 3.16+** — only if you'll touch the mobile app. See [docs/setup.md](docs/setup.md#6-flutter-mobile-app-setup).

## Get the repo running

From a fresh clone:

```bash
git clone https://github.com/faisalidris014/ReverseMarketplace.git
cd ReverseMarketplace
bash scripts/install-sorcyn.sh     # installs the `sorcyn` launcher into ~/.local/bin
sorcyn bootstrap                    # doctor → db up → install → migrate → seed
```

That's it. From any directory after that:

```bash
sorcyn dev       # start backend (port 3000)
sorcyn mobile    # run the Flutter app
sorcyn db up     # start postgres + redis
sorcyn doctor    # diagnose missing prereqs
sorcyn all       # macOS: open db + backend + mobile in 3 Terminal tabs
sorcyn help      # full command list
```

If anything fails, `sorcyn doctor` tells you what's wrong with a specific remediation hint (e.g. "Docker daemon not running — start Docker Desktop").

> Prefer raw npm? `cd backend && npm run dev` / `npm test` / `npm run bootstrap` still work — the launcher is just a convenience layer.

## Secrets you'll need

Some features call third-party services and need API keys. They split into two buckets:

### Get your own key (free dev tier — takes 5 minutes)

For these, sign up yourself and put the key in `backend/.env`. **Don't ask for a shared one.** Per-dev keys = no quota collisions, no leak risk.

| Service | Used for | Where to get a free dev key |
|---|---|---|
| `GEMINI_API_KEY` | AI-assisted post creation | <https://aistudio.google.com/apikey> — click "Create API key" |
| `SENTRY_DSN` (optional) | Error tracking in dev | <https://sentry.io> — free tier, create a Node.js project |
| `SENDGRID_API_KEY` (optional) | Email — stubbed when unset, only needed if testing email | <https://sendgrid.com> — free tier 100 emails/day |
| `GOOGLE_MAPS_API_KEY` (optional) | Map / geocoding features | Google Cloud Console — enable Maps/Geocoding APIs |

### Shared via Doppler (real prod accounts — Stripe, R2, FCM)

These need to be the same secret across the whole team (e.g. you can't have everyone with their own Stripe Connect platform). We sync them via **Doppler**, which injects them into your process at runtime — they never land on your disk.

**One-time setup per collaborator:**

```bash
brew install dopplerhq/cli/doppler
doppler login                  # opens browser to authenticate
# (project owner adds you to the Doppler workspace first)
```

After that, `sorcyn dev` automatically wraps the server in `doppler run --` and the shared secrets are injected from Doppler at startup. Nothing to manage, nothing to rotate locally.

To check that your Doppler setup is working: `sorcyn secrets status`.

### Production secrets

Live on the VPS as env vars on the host (not in this repo). See [docs/RUNBOOK_OPS.md](docs/RUNBOOK_OPS.md) for ops access. You don't need them for local dev.

## Detailed setup

[docs/setup.md](docs/setup.md) has the full manual walkthrough, environment variable reference, troubleshooting, and Flutter device-specific setup.

## Running tests

```bash
cd backend
npm test           # vitest watch mode
npm run test:run   # one-off
npm run validate   # typecheck + tests (the pre-push check)
```

## Before you push

- Branch off `main`; open a PR. CI runs typecheck + the full test suite (including the env/docker-compose parity audit added in #82).
- This repo is indexed by **GitNexus** — see [CLAUDE.md](CLAUDE.md#gitnexus--code-intelligence) for the impact-analysis expectations before editing functions/classes.
- Don't commit `.env` files (only `.env.example` is tracked).

## Operations

See [docs/RUNBOOK_OPS.md](docs/RUNBOOK_OPS.md) for production runbooks (deploys, incident response, on-call).

## Questions

Ping in the team channel, or open a discussion/issue. Welcome aboard.
