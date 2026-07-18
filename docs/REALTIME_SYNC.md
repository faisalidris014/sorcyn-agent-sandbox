# Realtime Work-Claim Sync

> How both operators' AI agents always know what each other is editing — without
> anyone having to remember to announce it. This closes the gap that the
> async, PR-at-a-time model leaves open: **uncommitted, undeclared in-flight work.**

## The problem it solves

Sorcyn is built almost entirely by AI agents, one driven by Faisal, one by
Mohamed, on two machines. The directory-ownership split
(`.planning/WORK_SPLIT.md`) prevents most collisions, but two failure modes
remain:

1. Both agents independently decide to touch the same seam file (an API route, a
   shared doc) within the same hour, and neither knows until a PR conflicts.
2. One agent edits outside its lane (a legitimate but high-coordination move) and
   the other side finds out only at review time.

The fix has three moving parts, all automatic:

1. **Auto-publish intent** — each agent records what it's touching as a side
   effect of running, not because someone remembered to.
2. **A shared store both machines reach** — the team's Supabase Postgres (not the
   local dev DB).
3. **Read-before-act gate** — each agent checks the store before every edit.

## Architecture

```
  Faisal's machine                         Mohamed's machine
  ┌─────────────────┐                      ┌─────────────────┐
  │ Claude Code      │                      │ Claude Code     │
  │  SessionStart ───┼──┐              ┌────┼─── SessionStart │
  │  PreToolUse  ────┼─ register/check ┼────┼─── PreToolUse   │
  │  SessionEnd  ────┼──┘   heartbeat  └────┼─── SessionEnd   │
  └────────┬─────────┘                      └────────┬────────┘
           │            ┌──────────────────┐         │
           └───────────▶│ Shared Supabase  │◀────────┘
                        │ devsync_work_claims │
                        │ (SYNC_DATABASE_URL) │
                        └──────────────────┘
```

- **Store:** one table, `devsync_work_claims`, in the shared Supabase. Reached
  over a **dedicated `SYNC_DATABASE_URL`** — deliberately separate from the app's
  `DATABASE_URL`, which in dev points at each operator's *local* Postgres and
  therefore can't be shared.
- **Engine:** `scripts/devsync/claim.mjs` (+ `lanes.mjs`). A small, dependency-
  light Node CLI. Tracked in git; `pg` is its only dependency, installed locally
  under `scripts/devsync/`.
- **Wiring:** `.claude/settings.json` (committed, shared) registers three hooks
  that call the engine. Both operators get them on pull.

## What each hook does

| Hook | Trigger | Action |
|------|---------|--------|
| `SessionStart` | agent session starts/resumes | Upserts this session's claim (person, lane, branch, task). Injects a summary of the OTHER operator's active claims into the agent's context. |
| `PreToolUse` (Edit/Write/MultiEdit/NotebookEdit) | before every file edit | **Collision check** — if the other operator's live claim holds this exact file, the edit is **denied** with a reason. Otherwise records the touch + refreshes this session's heartbeat. Out-of-lane edits get a **warning** but proceed. |
| `SessionEnd` | session ends | Releases this session's claim. |

The heartbeat rides on `PreToolUse`, so an actively-working agent keeps its claim
fresh. A claim with no heartbeat for **15 minutes** is treated as stale and
ignored — so a crashed agent (which never fires `SessionEnd`) never leaves a
stale lock.

## Design rule: fail-open

The coordination layer must **never block coding**. If `SYNC_DATABASE_URL` is
unset, Supabase is unreachable, `pg` isn't installed, or a payload is malformed,
every hook degrades to "allow" (the pre-edit gate allows silently; session start
notes the layer is down). A hiccup in sync can't halt the work. The contract
pipeline (`contracts/openapi.json`) and `.planning/NOW.md` are the fallbacks.

## Enforcement model (smart)

- **Hard block** only on a *real collision*: the other operator's agent holds a
  **live** claim on the **exact** file you're about to edit.
- **Warn, don't block**, when you edit outside your lane — legitimate cross-lane
  work happens; it just needs a PR heads-up.
- A denied file is **never** recorded as claimed by the denied agent, so the two
  agents can't deadlock each other on the same path.

## Setup (each machine, one time)

```sh
# 1. Add the SHARED Supabase connection string to backend/.env (same value for
#    both operators — ask your partner / pull from Doppler):
#      SYNC_DATABASE_URL=postgresql://postgres.[project]:[pw]@...pooler.supabase.com:6543/postgres?sslmode=require

# 2. Bootstrap (installs deps, verifies the connection, creates the table):
bash scripts/bootstrap-devsync.sh
```

That's it. The hooks are already wired via the committed `.claude/settings.json`.
New Claude Code sessions on either machine now coordinate automatically.

> Storing the secret in Doppler is preferred (`doppler secrets set SYNC_DATABASE_URL=...`);
> `backend/.env` works too. Never commit the value — only `backend/.env.example`
> carries the shape.

## Using it

```sh
node scripts/devsync/claim.mjs list      # live board: who's editing what, right now
node scripts/devsync/claim.mjs whoami    # confirm your detected person/lane/branch
node scripts/devsync/claim.mjs init      # (re)create the table
```

Identity is auto-detected from `git config user.email/name`. Override with
`SYNC_PERSON=faisal|mohamed` if detection is wrong on a machine.

## Boundaries (be honest about these)

- **Claim-level, not keystroke-level.** Agents announce "I'm working on these
  files," not every character. That's the right granularity for collision
  avoidance.
- **Covers agent-driven work only.** A hand edit in an IDE without the hooks
  bypasses the claim system. For an "AI codes everything" workflow that's an
  acceptable boundary; if you hand-edit, glance at `claim.mjs list` first.
- **Exact-path collisions.** The gate blocks on the same file, not on "same
  module / nearby file." Lane warnings cover the coarser cross-lane case.

## Files

| Path | Role |
|------|------|
| `scripts/devsync/claim.mjs` | The engine (CLI + hook entrypoints). |
| `scripts/devsync/lanes.mjs` | Lane mapping — mirrors `.planning/WORK_SPLIT.md`. |
| `scripts/devsync/package.json` | Engine deps (`pg`). |
| `.claude/settings.json` | Committed hooks wiring (shared by both operators). |
| `scripts/bootstrap-devsync.sh` | One-command setup. |
| `backend/.env.example` | Documents `SYNC_DATABASE_URL`. |
| `.planning/NOW.md` | Human-readable fallback board. |

## Related

- `.planning/WORK_SPLIT.md` — the lane ownership the gate enforces.
- `docs/OPERATOR_SYNC.md` — the wider human workflow playbook.
- `contracts/README.md` — the API-contract seam tracking.
