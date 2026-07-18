# Work Split — Faisal & Mohamed

> The canonical ownership model for Sorcyn. Referenced by `docs/OPERATOR_SYNC.md`,
> `CLAUDE.md`, `.github/CODEOWNERS`, and the realtime work-claim system
> (`scripts/devsync/lanes.mjs`). When this file and the code disagree, this file
> is the intent and the code should be corrected to match.

**As of 2026-06-15 the backend-vs-mobile layer split is retired.** Faisal and
Mohamed (and their AI agents) **both own the full stack** and can pick up any
issue, backend or mobile. The realtime claim system
(`docs/REALTIME_SYNC.md`) carries collision-avoidance on its own now: the
**same-file claim gate** blocks two agents from editing the same file at once.
There are no "lanes" and no out-of-lane warnings anymore — `isOutOfLane` is a
no-op in `scripts/devsync/lanes.mjs`.

This trades the near-zero-conflict guarantee of strict directory ownership for
flexibility. The claim gate **fails open** (never blocks if the store is down or
an agent isn't claiming), so it is advisory, not a merge lock. PR review + CI
remain the real gates. The seams below are where conflicts are still most likely
even when you're not literally touching the same file — coordinate there.

## Ownership

| Area | Owner | GitHub | Branch prefix | Notes |
|------|-------|--------|---------------|-------|
| **Full stack** | **Faisal** | `faisalidris014` | `be/<issue#>-<slug>` or `fix/<issue#>-<slug>` | Admin. Any backend, infra, mobile, or shared work. |
| **Full stack** | **Mohamed** | `leenamichoacana` | `mobile/<issue#>-<slug>` or `fix/<issue#>-<slug>` | Write access. Any backend, infra, mobile, or shared work. |

Branch prefixes are now descriptive, not territorial — use whichever fits the
change (`be/`, `mobile/`, `fix/`, `feat/`). Always branch off latest `main`,
never push to `main`.

`scripts/devsync/lanes.mjs` still classifies paths as backend/mobile/shared for
**labelling/reporting only**; that classification no longer gates edits.

## The seams (highest-coordination items)

`backend/` and `mobile/` are separate directories, so file-level collisions are
rare even with shared ownership. The places where work still collides
*logically* — flag these in the PR and to your partner before merging, since the
same-file claim gate won't catch them:

1. **The API contract.** Any change to a route or response shape in `backend/**`
   changes what the Flutter app consumes. This seam is now tracked as a committed
   artifact — `contracts/openapi.json` — with a CI drift gate. See
   `contracts/README.md`. When you change the API, regenerate the contract in the
   same PR so Mohamed's side (and his agent) sees the new shape immediately.
2. **Prisma schema / migrations.** Cross into the other's runtime. Forward-
   compatible-only during canary (see `CLAUDE.md`). Mention every migration in the
   PR description.
3. **Env var shape.** Adding/renaming a var means updating `backend/.env.example`
   in the same PR and telling your partner.

## Per-issue assignment

Either operator can take any issue — pick by availability, not by layer. Post the
issue-start comment (operator, branch, scope) so the other agent sees it, and
register your devsync claim. For a large issue that spans backend and mobile,
still prefer splitting into separate single-concern PRs so each stays small and
revertible — but that's now a reviewability choice, not an ownership rule.
CODEOWNERS still auto-requests review on seam paths.

## Related

- `docs/OPERATOR_SYNC.md` — the wider "how we work together" playbook.
- `docs/REALTIME_SYNC.md` — the automatic claim system that enforces this split.
- `.github/CODEOWNERS` — turns this table into auto-requested PR reviews.
- `.planning/NOW.md` — human-readable board of who's working on what.
