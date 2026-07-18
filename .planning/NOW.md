# NOW — who's working on what

> Human-readable coordination board. This is the **fallback** layer. The
> automatic, realtime layer is the work-claim system (`docs/REALTIME_SYNC.md`),
> which both operators' AI agents read and write without anyone remembering to.
>
> **For the live, authoritative picture of active AI sessions, run:**
> ```sh
> node scripts/devsync/claim.mjs list      # or: cd scripts/devsync && npm run board
> ```
> That queries the shared store and prints every claim either operator's agent
> holds right now. This file is for the things a claim row can't capture: the
> longer-horizon "what I'm about to pick up next" and any manual heads-up when the
> realtime layer is disabled.

---

## Active focus (update when you start something big)

| Operator | Lane | Current focus | Branch | Notes / heads-up |
|----------|------|---------------|--------|------------------|
| Faisal | backend/infra | _set me_ | `be/...` | |
| Mohamed | mobile | _set me_ | `mobile/...` | |

## Upcoming / next up

- Faisal: _next planned item_
- Mohamed: _next planned item_

## Cross-lane heads-up (the seams)

Use this when you're about to touch a seam (API contract, Prisma migration, env
shape) so the other operator's next session knows before the PR lands.

- _e.g. "Faisal: changing the /offers response shape — regenerating
  contracts/openapi.json this afternoon, expect a Dart model update on your side."_

---

_When the realtime layer is up, prefer it over hand-editing this file — `claim.mjs
list` is always current. Keep this file for intent the claim store can't express._
