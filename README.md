# Sorcyn — ReverseMarketplace

A reverse marketplace where buyers post needs and sellers compete to fulfill them. Combines local + shipped products + services on one platform, with an AI chatbot as the primary interface and Stripe Connect escrow for delayed payouts.

- **Backend:** Fastify 5 + TypeScript + Prisma 7 + Postgres + Redis
- **Mobile:** Flutter 3.16+ (iOS / Android / Web)
- **Infra:** Docker + Nginx + GitHub Actions CI/CD

## Getting started

```bash
git clone https://github.com/faisalidris014/ReverseMarketplace.git
cd ReverseMarketplace
bash scripts/install-sorcyn.sh && sorcyn bootstrap
```

That installs the `sorcyn` launcher and runs the first-time setup. Full instructions: [CONTRIBUTING.md](CONTRIBUTING.md). Manual walkthrough and troubleshooting: [docs/setup.md](docs/setup.md).

## Docs

- [docs/](docs/) — architecture, database, API, deployment, runbooks
- [CLAUDE.md](CLAUDE.md) — agent / Claude Code guidance
- [Sorcyn_PRD_v2.2.md](Sorcyn_PRD_v2.2.md) — product spec
