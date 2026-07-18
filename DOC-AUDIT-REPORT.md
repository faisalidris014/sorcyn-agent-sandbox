# Sorcyn Documentation Audit + GSD Lean-Down Report

> Read-only audit, 2026-05-29. Ground truth: `git log/grep` against `main`, `gh`
> issue/PR state, and a trace of the GSD workflow files under
> `~/.claude/get-shit-done/workflows/`. Docs were NOT trusted as source of truth.

**Headline:** `main` HEAD is `63949c5` (#81 rename, 2026-05-25). The vendor/ops/
onboarding work assumed to have "landed" (Doppler, Resend swap, `sorcyn` launcher,
vendor audit, Help&Support, business accounts) is **branch-only — none of it is on
`main`** (`d6d2086`/`d7dd1ca`/`d3d5802`/`b9d902f`/`38fdf44`/`d031bdf` are all
non-ancestors of `main`; `main` still imports `@sendgrid/mail`; no `doppler` on
`main`). It lives in OPEN PRs #1/#78/#79/#83/#100/#101 and OPEN issues #82–#101. Only
**#81** has merged since STATE.md's date. STATE.md and ROADMAP.md know none of it.

Severity legend: **BLOCKING** (breaks a regen/automation prerequisite or is actively
wrong) · **MISLEADING** (contradicts `main`/`gh`, will misdirect) · **OUTDATED-BUT-
HARMLESS** (stale but won't cause a wrong action).

---

## A) STATE.md drift

`.planning/STATE.md` — last commit `66e2ebf` 2026-05-11 (frontmatter `last_updated:
2026-05-12`). `main` HEAD is 14 days newer.

| # | Finding | Sev | One-line fix |
|---|---------|-----|-------------|
| A1 | `STATE.md:7` last_updated 2026-05-12; `main` HEAD `63949c5` is 2026-05-25 — 14d stale, predates the entire Phase-5 ops/vendor cluster. | MISLEADING | Regen STATE from git/gh (Bucket 2a). |
| A2 | Only **#81** merged since the STATE date (`gh pr list --search "merged:>=2026-05-11"`); STATE never records it. | OUTDATED | Add to "last merged PRs". |
| A3 | STATE is blind to 6 open PRs (#1,#78,#79,#83,#100,#101) and ~30 open issues (#37–#101); presents "Phase 4 Wave 3" as the frontier while a Phase-5 vendor/ops cluster + an E4 mobile-bug cluster are in flight. | MISLEADING | Regen STATE to list open PRs + open `checkpoint`/P0 issues. |
| A4 | Internal contradiction: frontmatter `completed_phases: 2` and `STATE.md:33` "50% (Phase 3/7 complete)" vs frontmatter `percent: 70` vs ROADMAP marking Phase 3 `[x]` SHIPPED. STATE disagrees with itself and ROADMAP. | MISLEADING | Set completed_phases=3; drop hand-typed % once regen owns it. |
| A5 | Checkpoints **04-06 Task 3** (live observability/failover drill on staging) and **04-07 Task 5** (Stripe SAQ-A applicability) — confirmed **still pending** (latest tracking commit `66e2ebf` says "partial"; no commit shows either done). Exist ONLY as STATE prose (`STATE.md:6,30`); **no GitHub issue tracks them and no `checkpoint` label exists** (confirmed via `gh label list`). | BLOCKING | Promote both to GitHub issues + create `checkpoint` label BEFORE any regen-state.sh. A cache with no home for these silently deletes them. |
| A6 | Work in flight is untracked by any phase dir AND not on `main`: Doppler bootstrap, `sorcyn` launcher, SendGrid→Resend swap, vendor audit, Help&Support, business accounts. Confirmed branch-only. The vendor-audit doc sits **untracked at repo root** (`# Sorcyn Vendor Stack Audit — May 2026.md`). | MISLEADING | Don't backfill STATE prose; let regen surface these as open PRs. Move/commit or delete the stray root MD. |

## B) ROADMAP.md drift

`.planning/ROADMAP.md` — last commit `66e2ebf` 2026-05-11.

| # | Finding | Sev | One-line fix |
|---|---------|-----|-------------|
| B1 | `ROADMAP.md:22` Phase 3 `[x]` SHIPPED (2026-04-30) but STATE `completed_phases: 2`. | MISLEADING | Reconcile to 3 (ROADMAP is correct). |
| B2 | `ROADMAP.md:23` Phase 4 header "5/8 plans complete; Wave 2 closed 2026-05-02" vs body (`:125–127`) shows Wave 3 04-06/04-07 partial as of 2026-05-12. Header stale. | OUTDATED | "5 complete + 2 partial"; regen-roadmap removes hand-counts. |
| B3 | ROADMAP Phase details list none of the GitHub-tracked v1.1-E3-04 cluster (#84/#85/#86/#87), vendor/ops issues (#88/#92/#93/#94), or the E4 mobile cluster (#44–#47, #78 E4-01/08, #79 E4-10..13). Roadmap and Issues have forked. | MISLEADING | Regen-roadmap from `phase-*` labels (Bucket 2a). |
| B4 | Taxonomy: spot-check shows `phase-5/6/7` labels internally consistent (#40↔#85 both phase-5; epics #10/#48–50/#61–62 align). **No mislabel found** — the "#85 phase-5 vs #40 ops" case is actually consistent (#40 is itself phase-5). Real risk: issue-title version prefixes (v1.1/v2.0/v3.0) map to phase labels via an **implicit non-numeric table** (v2.0→phase-6, v3.0→phase-7, e.g. #68 "v3.0-E2-01"=phase-7). | OUTDATED-BUT-HARMLESS | Document the label↔phase↔milestone map; key regen-roadmap on the `phase-*` label, never the title prefix. |
| B5 | Dependency arrows (each Phase N "Depends on" N-1) verified correct. | — | No change. |

## C) CLAUDE.md drift

`CLAUDE.md` on `main`.

| # | Finding | Sev | One-line fix |
|---|---------|-----|-------------|
| C1 | `CLAUDE.md:9` `Name: TBD` — brand is **Sorcyn** (issue #69 / memory). | MISLEADING | Set Name: Sorcyn. |
| C2 | **No vendor LIVE/CODE-READY/PLANNED table exists on `main`** — the post-audit vendor-stack changes are branch-only: applied in `d6d2086` on **PR #100** ("Doppler bootstrap + May 2026 vendor audit (closes #92)"), with a separate CLAUDE.md vendor-bundle commit `b9d902f` on **PR #79**'s branch. PR #78 (Help&Support + business accounts) carries no vendor table. Even on those branches, "LIVE" for Doppler/Resend is wrong: #92 Doppler open, #88 Resend account open + code not on `main`. Honest status today: Doppler=PLANNED, Resend=CODE-READY (branch)/PLANNED (main), SendGrid=LIVE. | MISLEADING / fabrication-risk | When PR #100 merges, land table with accurate statuses; do not mark unprovisioned vendors LIVE. |
| C3 | `CLAUDE.md:68` Email "SendGrid (transactional)" — accurate on `main` (still SendGrid); becomes wrong the moment #88 merges. | OUTDATED-BUT-HARMLESS | Flip to Resend in the same PR that merges the swap. |
| C4 | `CLAUDE.md:43,111` "295+ tests / 22 files / 15 sessions" undercounts post-Phase-2/3/4 work (Phase-4 audit suite alone is 51 tests). True-but-stale; frames the project as MVP-only. | OUTDATED-BUT-HARMLESS | Soften to "295+ MVP tests; see ROADMAP for phase test deltas" or let docs-update regen. |
| C5 | `CLAUDE.md:21` offer cap "10" vs ADR-locked **25** (STATE flags the drift; Phase 3 was meant to reconcile). Runtime constant not cheaply confirmable this session (only i18n `{{max}}` strings surfaced). | VERIFY (not asserted) | Confirm the live constant in offers service; align CLAUDE.md + ADR; don't edit on assumption. |
| C6 | Critical Design Patterns otherwise consistent with `main` — forward-compatible-migrations ADR present and CI-enforced (`closeout-audit.test.ts`); sellerId/Prisma-7/lazy-SDK intact. | — | No change. |

---

## Token Footprint

**How GSD actually reads these (traced from `~/.claude/get-shit-done/workflows/`):**

- **STATE.md + ROADMAP.md** — read on **every** core invocation (discuss/plan/execute/
  progress/manager init). Highest load-frequency × size → Bucket (a).
- **Per-phase docs (RESEARCH/PATTERNS/CONTEXT/SUMMARY/NN-PLAN)** — **Case 1** for the
  hot-path skills: `execute-phase` reads only within-phase wave SUMMARYs; `discuss-phase`
  reads **≤3 prior CONTEXT.md** (`discuss-phase.md:237`; a `DECISIONS-INDEX.md` supersedes
  per-phase reads if present); `plan-phase` reads ≤3 prior CONTEXT/SUMMARY + explicit
  `Depends on:` phases (`plan-phase.md:887–890`). A closed phase's RESEARCH/PATTERNS/PLAN
  is not read once it falls outside the 3-most-recent window. **The cap rule already
  exists — do not re-add it.**
- **Case 2 (globs `phases/*/`)** only in on-demand skills: `audit-milestone`,
  `audit-uat`, `milestone-summary`, `forensics`. Not run every invocation, so no routine
  inflation; still work against archived phases if paths move with the milestone.
- **intel/decisions.md, intel/constraints.md, codebase/*.md** — **not read by any GSD
  workflow** (zero matches). Hand-maintained → Bucket (c) keep / Bucket (a) pointer.

| Rank | File | Size | Read when | Bucket | Case | Est. saving / GSD run |
|------|------|------|-----------|--------|------|----------------------|
| 1 | STATE.md | 10KB | **every invocation** | a (regen) | — | ~9KB → ~2K tok |
| 2 | ROADMAP.md | 26KB | **every invocation** | a (regen) | — | ~24KB → ~6K tok |
| 3 | codebase/*.md (7 files, ~76KB, dated Feb 27 — 3mo rot) | 76KB | discuss scout-step (conditional) | a (pointer→GitNexus) | — | ~75KB when scout runs |
| 4 | 03-RESEARCH.md | 62KB | Phase 3 only (CLOSED) | b (archive now) | 1 | removed from globs/recency |
| 5 | 03-PATTERNS.md | 46KB | Phase 3 only (CLOSED) | b (archive now) | 1 | " |
| 6 | 04-07-PLAN.md | 67KB | Phase 4 plan-07 exec | b (archive at phase close) | 1 | " |
| 7 | 04-RESEARCH.md | 67KB | Phase 4 active | keep until close | 1 | — |
| 8 | 04-PATTERNS.md | 66KB | Phase 4 active | keep until close | 1 | — |
| 9 | 04-08-PLAN.md | 59KB | Phase 4 future plan | keep | 1 | — |
| 10 | intel/decisions.md | 32KB | not read by GSD | c (keep, single-writer) | — | 0 (already cold) |

**Net:** routine win is Bucket (a) — STATE+ROADMAP regen saves ~33KB (~8K tokens) on
**every** GSD invocation. Archiving closed Phase 1–3 docs (Bucket b) is a zero-skill-edit
Case-1 move that trims the audit/milestone globs and the recency window. No per-file read
deletions are warranted — the cap already exists.

---

## Lean-Down Plan (three buckets)

**Hard ordering constraint:** Bucket 1 fully ships before any regen script in Bucket 2a
is stood up or trusted. A cache built on bad labels automates the mislabel; a STATE cache
with no home for human checkpoints deletes facts that aren't in git.

### Bucket 1 — Doc corrections (must-fix)

**Checkpoint promotion (hard prerequisite for regen-state.sh):**
- B1.1 — Create a GitHub `checkpoint` label (does not exist today).
- B1.2 — File issue "04-06 Task 3 — live observability/failover drill on staging"
  (`checkpoint`, phase-4), capturing the Slack-screenshot/AUDIT-MARKER:DRILL acceptance.
- B1.3 — File issue "04-07 Task 5 — Stripe SAQ-A applicability determination"
  (`checkpoint`, phase-4) — or add both as checklist items on the #40 epic. Once filed,
  STATE prose for these can be dropped (regen surfaces open `checkpoint` issues).

**Label taxonomy reconciliation (prerequisite for regen-roadmap.sh):**
- B1.4 — Write the authoritative `phase-* ↔ milestone ↔ version-prefix` map into ROADMAP
  (v1.0→P1, v1.1→P2–P5, v2.0→P6, v3.0→P7). Document so regen keys on `phase-*` labels,
  never title prefixes. Re-verify no phase-6/7 issue carries a stale phase-5 label first.

**Straight doc edits:**
- B1.5 — STATE.md: `completed_phases: 2 → 3`; reconcile the 50%/70% contradiction (A4).
- B1.6 — ROADMAP.md: Phase 4 header "5/8 complete" → "5 complete + 2 partial" (B2).
- B1.7 — CLAUDE.md: `Name: TBD → Sorcyn` (C1).
- B1.8 — Decide the stray root file `# Sorcyn Vendor Stack Audit — May 2026.md`: commit to
  `docs/`, fold into the vendor-audit PR #100, or delete (A6). **[Resolved 2026-05-31: moved to
  `docs/VENDOR_STACK_AUDIT_2026-05.md` on PR #100's branch (`fix/95-doppler-secret-sharing`) —
  the doc's decisions are applied there via `d6d2086`.]**
- B1.9 — (VERIFY, not blind-edit) Confirm runtime offer-cap constant; align CLAUDE.md `:21`
  + the ADR to the true value (C5).

> CLAUDE.md vendor table (C2) and email flip (C3) are deferred — they land with PR #100/#88,
> not in this doc-correction pass, to avoid documenting un-merged state on `main`.

### Bucket 2 — GSD slimming (after Bucket 1 ships)

GitHub is ground truth; `.planning/` is a cache. No skill forks except the sanctioned case.

**(a) Shrink + regenerate as cache:**
- B2.1 — `scripts/regen-state.sh` → STATE.md becomes a ≤30-line, <1KB regenerated header:
  branch, last 5 merged PRs, open PRs assigned to user, last commit on `main`, AND open
  `checkpoint`-labeled issues. Regenerated-header banner; `doctor` warns if >7d stale.
  **Gate: B1.1–B1.3 done first.**
- B2.2 — `scripts/regen-roadmap.sh` → ROADMAP.md becomes a ≤50-line cache: phases as
  milestones, one line per open issue grouped by `phase-*` label. **Gate: B1.4 done first.**
- B2.3 — `.planning/codebase/*.md` (Feb-27 rot, duplicated by GitNexus's 17,791-symbol
  index) → replace each with a one-line pointer to its
  `gitnexus://repo/ReverseMarketplace/...` URI. Confirm GitNexus coverage before deleting.

**(b) Eliminate / narrow glob:**
- B2.4 — **Case 1 / zero skill edits.** Archive closed-milestone phase dirs (Phase 1–3,
  and Phase 4 once it closes) to `.planning/milestones/v{ver}-phases/`. Hot-path skills
  already cap at ≤3 recent + explicit deps, so archiving is safe with no workflow edits.
  **No Case-2 glob-scoping edit is proposed** — the recency cap already exists
  (`discuss-phase.md:237`), so the only justified action is archival.

**(c) Keep, single-writer rule:**
- B2.5 — `.planning/intel/decisions.md` (73 ADRs) and `intel/constraints.md`: GSD must not
  regenerate these. Add a "hand-maintained — GSD read-only" header and **date each entry**
  so individual ADRs stay auditable for relevance over time.

### Bucket 3 — Maintenance discipline

- **MUST update in the same PR:** any PR closing a `P0-launch-blocker` updates STATE
  (post-regen, automatic via the merged-PR list); any phase close runs regen-roadmap; any
  new out-of-band human task gets a `checkpoint` issue at creation, never STATE prose; any
  vendor going LIVE updates the CLAUDE.md vendor table with evidence.
- **CAN skip:** per-plan SUMMARY prose edits (Case-1, fall out of context naturally);
  hand-counted percentages (regen owns them); closed-phase doc touch-ups (archive instead).

---

## Verification (for follow-up execution sessions)

- **After Bucket 1:** `gh label list | grep checkpoint` returns the label; the two
  checkpoint issues exist; `gh issue list --label phase-6,phase-7` shows no stray phase-5
  labels; STATE/ROADMAP/CLAUDE edits match the tables above.
- **After Bucket 2a:** `bash scripts/regen-state.sh && wc -l .planning/STATE.md` ≤30 and
  the open-`checkpoint` issues appear in output; `regen-roadmap.sh` groups every open issue
  under its `phase-*` label with none dropped. `/gsd-progress` initializes cleanly against
  the slimmed files.
- **After Bucket 2b:** `/gsd-discuss-phase` + `/gsd-plan-phase` on the active phase show no
  missing-file errors against archived phases; `/gsd-audit-milestone` resolves the moved
  milestone paths.
