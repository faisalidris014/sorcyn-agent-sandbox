# Sorcyn Admin Web Console

Internal admin console for the Sorcyn marketplace — user moderation, dispute
resolution, verification review, transactions, and audit logs. Built with
Next.js 15 (App Router), React 19, and Tailwind 4.

It is a thin **server-side BFF** over the existing Fastify backend admin API
(`/api/v1/admin/*`): Route Handlers in `app/api/*` and the server client in
`lib/api.ts` forward requests to `SORCYN_API_URL`, attaching the admin JWT read
from an httpOnly cookie. No admin credentials or business logic live in the
browser.

## Run locally

```sh
cd admin-web
cp .env.example .env.local          # set SORCYN_API_URL if the backend isn't on :3000
npm install
npm run dev                         # http://localhost:3001
```

The backend must be running (default `http://localhost:3000`) and you must log
in with an admin account (`admin@reversemarketplace.com` in seed data).

## Architecture

| Path | Purpose |
|------|---------|
| `app/(admin)/*` | Authenticated admin pages (users, disputes, moderation, verifications, transactions, audit logs) |
| `app/login` | Admin login |
| `app/api/*` | Route Handlers that proxy mutations to the backend admin API |
| `middleware.ts` | Auth gate — redirects unauthenticated requests to `/login` |
| `lib/session.ts`, `lib/jwt.ts` | httpOnly-cookie session + JWT handling |
| `lib/api.ts`, `lib/admin-proxy.ts` | Server-side backend API client + POST proxy helper |

## Environment

| Var | Default | Notes |
|-----|---------|-------|
| `SORCYN_API_URL` | `http://localhost:3000` | Base URL of the Fastify backend. Server-side only. |

## Notes

- Runs on port **3001** so it doesn't clash with the backend (3000).
- Extracted from the `audit/local-full-stack-2026-05-14` branch as a standalone
  PR; the backend admin endpoints it calls already exist under `/api/v1/admin/*`.
