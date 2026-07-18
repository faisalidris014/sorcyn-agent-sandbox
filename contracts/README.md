# API Contract

`openapi.json` is the **single source of truth for the HTTP API** — the one seam
where Faisal's backend and Mohamed's Flutter app meet. It is generated from the
live Fastify routes + Zod schemas (the same source as the `/docs` Swagger UI), so
it cannot drift from the real handlers.

## Why this is committed

In an AI-driven, two-operator workflow, a backend change to a route or response
shape is otherwise invisible to the mobile side until a PR lands. Committing the
contract turns every API change into a **reviewable diff** in `openapi.json`, and
CI fails any PR where the committed contract no longer matches the routes. The
mobile agent can read this file to know the exact current shape of every endpoint.

## Regenerating (backend lane)

Whenever you change a route, schema, or response shape:

```sh
cd backend
npm run contract:generate     # rewrites contracts/openapi.json
```

Commit the result **in the same PR** as the API change. The CI `contract-drift`
job runs `npm run contract:check` and fails if you forgot.

## How it stays deterministic

`contract:generate` normalises the spec so two machines and CI produce
byte-identical output:
- `servers` is pinned to `/api/v1` (the live value comes from `APP_URL`, which
  differs per environment).
- All object keys are sorted.

So a diff in this file means the **API surface actually changed** — never noise.

## Consuming it (mobile lane)

The Flutter app currently uses hand-written models. To generate Dart types from
this contract instead, see `docs/MOBILE_CONTRACT_ADOPTION.md`. Until that lands,
the file is still the authoritative reference both humans and agents read to
confirm request/response shapes.

## Mechanism

| File | Role |
|------|------|
| `backend/scripts/openapi-spec.ts` | Shared builder — buildApp → `app.swagger()` → normalise. |
| `backend/scripts/dump-openapi.ts` | `contract:generate` — writes this file. |
| `backend/scripts/check-openapi.ts` | `contract:check` — fails on drift. |
| `.github/workflows/ci.yml` → `contract-drift` | CI gate. |
