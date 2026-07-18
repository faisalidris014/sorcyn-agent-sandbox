# Sorcyn — Stripe Connect Bounce Page

A tiny Next.js app whose only job is to receive Stripe's `return_url` and
`refresh_url` after a seller completes (or needs to retry) Stripe Connect
onboarding, then deep-link the user back into the Sorcyn mobile app via
`reversemarket://`.

**Why this exists:** Stripe's AccountLink API only accepts `https://`
URLs and rejects custom URL schemes like `reversemarket://`. This page is
the HTTPS hop in the middle.

## Routes

- `GET /stripe/complete` — Stripe redirects sellers here on successful
  onboarding. Auto-redirects to `reversemarket://seller/stripe/complete`
  after 1.5s; offers a manual "Return to Sorcyn" button as fallback.
- `GET /stripe/refresh` — Stripe redirects sellers here when the
  onboarding session expires or needs another step. Mirror of the above
  pointing at `reversemarket://seller/stripe/refresh`.
- `GET /` — Info card explaining what this service does.

## Local development

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Deploy to Vercel

```bash
npm install -g vercel  # or: pnpm add -g vercel
vercel login
vercel deploy --prod
```

The default Vercel domain (`<project>.vercel.app`) is fine for the
prototype. For production, point a real subdomain (e.g.
`connect.sorcyn.app`) at this project and update the backend env vars.

## Backend wiring

After deploying, set on the Fastify backend:

```
STRIPE_CONNECT_RETURN_URL=https://<your-deploy>.vercel.app/stripe/complete
STRIPE_CONNECT_REFRESH_URL=https://<your-deploy>.vercel.app/stripe/refresh
```

The Zod defaults in `backend/src/config/env.ts` use
`https://sorcyn-connect.vercel.app/*` as placeholders, so a real
deployment to that exact subdomain works out of the box.

## Stack

- Next.js 15 (App Router)
- React 19
- No CSS framework — hand-rolled brand-token CSS in `app/globals.css`
- Brand tokens copied from `designs/src/styles/theme.css`:
  - Primary `#7C3AED`, gradient `linear-gradient(135deg, #7C3AED, #A855F7)`
  - Button shadow `0 8px 20px rgba(124, 58, 237, 0.35)`
  - Inter font, system-fallback stack

## Future work

- iOS Universal Link / Android App Link config so the deep-link
  auto-opens the installed app without a confirmation prompt.
- Telemetry on completion / refresh hits so the backend can correlate
  Connect onboarding outcomes.
