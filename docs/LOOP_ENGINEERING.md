# Loop Engineering on Sorcyn

Shared reference for running Claude Code loops (`/goal`, `/loop`, `/schedule`) safely on this repo. Both operators (Faisal, Mohamed) follow this.

> Loop engineering = designing the **stop condition**, not just the prompt. Boris Cherny, who built Claude Code: *"I don't prompt Claude anymore. I write loops that prompt Claude."* A prompt gets one output; a loop is a compounding operation with a finish line.

## The three commands

| Command | Runs | Use for | Notes |
|---------|------|---------|-------|
| `/goal <verifiable end state>` | Until the outcome is true, then stops | "Get X done / green" | A separate fast model grades after every turn (added Claude Code v2.1.139). |
| `/loop [interval] <task>` | While you're present, session open | Polling / recurring checks | With an interval, runs on a timer; without one, self-paces. |
| `/schedule` | While you're away | Unattended routines | **Cloud, billed.** Opt-in only — never set up without explicit per-task confirmation. |

"Build while you sleep" only applies to `/schedule`. Local `/goal` and `/loop` need your session open.

## Stop rules — required on every code-modifying loop

State all four, every time. No unbounded loops.

1. **Success condition** — the verifiable end state that ends the loop.
2. **Failure condition** — the situation that should halt and hand back to a human (e.g. "needs a product decision").
3. **Iteration cap** — max attempts before stopping.
4. **Dollar / token budget** — a hard ceiling.

## Sorcyn guardrails (non-negotiable)

- **Pre-execution gates first** — clean tree, fresh branch, green baseline tests. A loop that starts dirty contaminates attribution.
- **Respect devsync claims** — never edit files the other operator's agent has claimed. `node scripts/devsync/claim.mjs list`.
- **Never push to a frozen/ready PR.** New loop work = new branch/PR.
- **Never auto-merge to main** — the ruleset requires manual merge anyway. A watcher loop tees up the merge; it does not perform it.
- **Progress file per loop** at `.planning/loops/<slug>.md`, updated each turn, so the loop is resumable and rollback-able.
- **Re-sync at clean boundaries** between iterations.

## The `/loop-templates` command

Ready-to-paste, guardrailed templates ship as a `/loop-templates` slash command (CI babysitter, scoped test-fix, issue-map bot PR watcher). Because `.claude/commands/` is gitignored in this repo, that command file is **not** synced through git — to install it locally, copy `.claude/commands/loop-templates.md` from another operator, or recreate it from the templates below.

### Template: CI babysitter — `/loop-templates ci <PR#>`
```
/goal PR #<PR#> checks are all green. Only touch this PR's own branch. After each failed run, read the CI logs, apply the smallest fix, and push. Stop after 3 fix attempts, or if a failure needs a product decision. Keep progress in .planning/loops/ci-<PR#>.md. Do NOT merge.
```

### Template: scoped test-fix — `/loop-templates testfix <module>`
```
/goal all tests in <module> pass. Only edit files under <module> and its test files. Run the suite each turn, fix the first failure, repeat. Stop after 5 iterations, or if a fix would require touching another module. Keep progress in .planning/loops/testfix-<module>.md.
```

### Template: issue-map bot PR watcher — `/loop-templates botpr`
```
/loop 10m Check open PRs for a "docs: refresh V1.1 issue map" bot PR. If one exists and its checks are green, summarize it and tell me it's ready to approve + squash-merge by hand. Do not merge it yourself. If none exists, report "none yet" and keep waiting.
```
