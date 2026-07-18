---
phase: 04-pre-launch-hardening
plan: 01
subsystem: migrations-policy / ci-gate
tags: [migrations, ci-gate, adr, canary, wave-0]
requires: []
provides:
  - DEC-forward-compatible-migrations (locked ADR)
  - Critical-Design-Patterns bullet referencing the ADR
  - Phase 4 audit-suite describe block enforcing D-04 via regex on latest Prisma migration
affects:
  - All Phase 4 plans (04-02 through 04-08) — unblocked by Wave 0 completion
  - All future Prisma migrations — destructive tokens are now CI-blocked during canary
tech-stack:
  added: []
  patterns:
    - audit-suite-as-CI-gate (extended from Phase 3 pattern)
    - SQL-comment-stripping before regex (Nyquist grep-gate hygiene)
key-files:
  created: []
  modified:
    - .planning/intel/decisions.md
    - CLAUDE.md
    - backend/tests/audit/closeout-audit.test.ts
decisions:
  - DEC-forward-compatible-migrations — additive-only Prisma migrations during canary windows; expand → migrate → contract; CI-enforced via regex on latest migration.sql
metrics:
  duration_seconds: 3270
  tasks_completed: 3
  tests_passing: 27 (was 26 — +1 for D-04)
  completed_date: 2026-05-01
---

# Phase 04 Plan 01: Lock D-04 Forward-Compat Migration ADR + CI Gate Summary

Locked the highest-stakes Phase 4 ADR (`DEC-forward-compatible-migrations`), wired CLAUDE.md to reference it, and extended the audit suite with a regex CI gate that fails the build if the latest Prisma migration contains `DROP COLUMN/TABLE`, non-CONCURRENTLY `DROP INDEX`, `ALTER TABLE ... RENAME`, or `SET NOT NULL` on existing columns. Wave 0 is now complete — all subsequent Phase 4 plans (04-02 through 04-08) are unblocked.

## Tasks Executed

| Task | Name | Commit |
|------|------|--------|
| 1 | Lock DEC-forward-compatible-migrations ADR | b51ff66 |
| 2 | Reference D-04 ADR in CLAUDE.md Critical Design Patterns | f0289f5 |
| 3 | Add D-04 Forward-compat migrations describe block to closeout-audit.test.ts | 45492a3 |

## Artifacts Added (Verbatim)

### 1. ADR appended to `.planning/intel/decisions.md`

Inserted in a new `## Migrations` section, immediately after `DEC-fts-postgres-mvp`:

```markdown
### DEC-forward-compatible-migrations
- **scope:** Database migration policy during canary windows
- **decision:** Every Prisma migration must be additive-only during canary deploys: nullable new columns, new tables, no DROPs, no `NOT NULL` on existing columns, no RENAMEs, no enum value removals. Destructive migrations ship in a follow-up release after the prior version has fully drained (expand → migrate → contract).
- **status:** locked
- **rationale:** During a 10/90 canary split, both versions run simultaneously against the same database. A destructive migration would break the still-serving stable version. Forward-compatible-only is the simplest forcing function that prevents data corruption without a two-phase deploy.
- **enforcement:** CI gate via regex assertion in `backend/tests/audit/closeout-audit.test.ts` (forbids DROP / RENAME / SET NOT NULL on existing columns in latest migration).
- **source:** Phase 4 CONTEXT.md D-04, Phase 4 RESEARCH.md §2
```

### 2. Bullet appended to `CLAUDE.md ## Critical Design Patterns`

Inserted between the existing `Route ordering` and `Seed data` bullets (one new line; no other modifications to the section):

```markdown
- **Forward-compatible-only migrations during canary** — Every Prisma migration must be additive (nullable columns, new tables). No DROP / RENAME / SET NOT NULL on existing columns. Destructive changes ship in a follow-up release after the prior version drains. See `DEC-forward-compatible-migrations` in `.planning/intel/decisions.md`. CI-enforced via `backend/tests/audit/closeout-audit.test.ts`.
```

### 3. Describe block appended to `backend/tests/audit/closeout-audit.test.ts`

Appended at the end of the file (after the existing SC6 block); also added `readdirSync` to the existing `node:fs` import line and updated the file-header docstring to mention both Phase 3 and Phase 4.

Block (file lines ~308–335 in the updated file):

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 Pre-Launch — D-04 Forward-compatible migrations (Wave 0)
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4 Pre-Launch — D-04 Forward-compat migrations', () => {
  it('latest migration has no DROP, RENAME, or SET NOT NULL on existing column', () => {
    const migrationsDir = resolve(backendRoot, 'prisma/migrations');
    if (!existsSync(migrationsDir)) return; // pre-migration repo
    const dated = readdirSync(migrationsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && /^\d{14}_/.test(d.name))
      .map(d => d.name)
      .sort();
    if (dated.length === 0) return;
    const latest = dated[dated.length - 1];
    const sqlPath = resolve(migrationsDir, latest, 'migration.sql');
    if (!existsSync(sqlPath)) return;
    const raw = readFileSync(sqlPath, 'utf-8');
    // Strip SQL comments so header prose can never falsify the gate.
    const stripped = raw.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
    expect(stripped).not.toMatch(/^\s*DROP\s+COLUMN\b/im);
    expect(stripped).not.toMatch(/^\s*DROP\s+TABLE\b/im);
    expect(stripped).not.toMatch(/^\s*DROP\s+INDEX\s+(?!CONCURRENTLY)/im);
    expect(stripped).not.toMatch(/^\s*ALTER\s+TABLE\s+\S+\s+RENAME/im);
    expect(stripped).not.toMatch(/SET\s+NOT\s+NULL/i);
  });
});
```

## CI Verification

`cd backend && npx vitest run tests/audit` — green:

```
 Test Files  1 passed (1)
      Tests  27 passed (27)
   Duration  1.16s
```

Result: 26 Phase 3 baseline assertions still green; the new `Phase 4 Pre-Launch — D-04 Forward-compat migrations` describe block contributes the 27th passing test, validated against the latest migration `20260430164604_add_user_ein` (purely additive — `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).

## Acceptance Criteria — Verified

- [x] `grep -c "^### DEC-forward-compatible-migrations" .planning/intel/decisions.md` → 1
- [x] `grep "additive-only during canary deploys" .planning/intel/decisions.md` → 1
- [x] `grep "expand → migrate → contract" .planning/intel/decisions.md` → 1
- [x] `grep "regex assertion in \`backend/tests/audit/closeout-audit.test.ts\`" .planning/intel/decisions.md` → 1
- [x] `grep "Phase 4 CONTEXT.md D-04" .planning/intel/decisions.md` → 1
- [x] ADR has all 6 keys: scope, decision, status, rationale, enforcement, source
- [x] `grep -c "Forward-compatible-only migrations during canary" CLAUDE.md` → 1
- [x] `grep "DEC-forward-compatible-migrations" CLAUDE.md` → 1
- [x] `grep "CI-enforced via \`backend/tests/audit/closeout-audit.test.ts\`" CLAUDE.md` → 1
- [x] CLAUDE.md line count increased by exactly 1 (334 → 335)
- [x] `grep -c "Phase 4 Pre-Launch — D-04 Forward-compat migrations" backend/tests/audit/closeout-audit.test.ts` → 1
- [x] `grep -c "readdirSync" backend/tests/audit/closeout-audit.test.ts` → 2 (import + usage)
- [x] `grep "filter(l => !l.trim().startsWith('--'))" backend/tests/audit/closeout-audit.test.ts` → 1 (Nyquist comment-stripping hygiene)
- [x] `npx vitest run tests/audit` exits 0 with ≥27 passing tests, zero failures
- [x] None of the existing 26 Phase 3 assertions modified or removed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocker] Installed missing backend dependencies**
- **Found during:** Task 3 verification
- **Issue:** Worktree did not have `backend/node_modules/` populated; `npx vitest` failed with `Cannot find package 'vitest'`.
- **Fix:** `cd backend && npm install --no-audit --no-fund` (added 869 packages, ~10s). No package.json or lockfile modifications.
- **Files modified:** none (node_modules is gitignored)
- **Commit:** none required

**2. [Rule 3 — Blocker] Generated Prisma Client**
- **Found during:** Task 3 verification (after npm install)
- **Issue:** Vitest globalSetup imported `@prisma/client/default` which requires generated client.
- **Fix:** `cd backend && npx prisma generate`. No schema changes.
- **Files modified:** none (generated client lives under `node_modules/.prisma`)
- **Commit:** none required

**3. [Rule 3 — Blocker] Provisioned `backend/.env` for vitest globalSetup**
- **Found during:** Task 3 verification (after prisma generate)
- **Issue:** `tests/global-setup.ts` requires a live Postgres connection to seed categories before any test can load. Worktree had no `.env`. Local `postgresql@15` (port 5432, db `reverse_marketplace`) was already running and matched the main repo's existing setup.
- **Fix:** Copied the canonical `.env` from the main repo (`/Users/faisalidris/ReverseMarketplace/backend/.env`) into the worktree. `.env` is gitignored, so no commit/leak risk.
- **Files modified:** `backend/.env` (gitignored, not committed)
- **Commit:** none

These three blockers were pure environment hygiene, not source-code changes — none altered the deliverable. The committed artifacts are exactly the three the plan specified.

### Plan-Specified Changes

None — the plan executed verbatim. ADR text, CLAUDE.md bullet, and audit-suite describe block were copied byte-for-byte from PATTERNS.md Wave 0 specifications.

## Threat Surface Scan

No new security-relevant surface introduced. Threat register entries from the plan all map to mitigations actually in place:

| Threat ID | Disposition | Status |
|-----------|-------------|--------|
| T-04-01-01 (destructive migration during canary) | mitigate (HIGH) | ✅ Audit-suite regex active |
| T-04-01-02 (silent data loss for 90% stable population) | mitigate (HIGH) | ✅ ADR + CI gate live |
| T-04-01-03 (bypass via SQL comments hiding tokens) | mitigate (HIGH) | ✅ Comment-stripping pass present (`filter(l => !l.trim().startsWith('--'))`) |
| T-04-01-04 (developer disables the test) | accept (LOW) | ✅ As designed — caught at PR review |

## Self-Check: PASSED

- [x] `.planning/intel/decisions.md` — modified, contains DEC-forward-compatible-migrations
- [x] `CLAUDE.md` — modified, contains Forward-compatible-only migrations bullet
- [x] `backend/tests/audit/closeout-audit.test.ts` — modified, contains Phase 4 D-04 describe block
- [x] Commit `b51ff66` exists in git log
- [x] Commit `f0289f5` exists in git log
- [x] Commit `45492a3` exists in git log
- [x] `npx vitest run tests/audit` exits 0 with 27 passing tests

## Wave 0 Closure Statement

**Wave 0 complete — Phase 4 plans 04-02 through 04-08 are now unblocked.**
