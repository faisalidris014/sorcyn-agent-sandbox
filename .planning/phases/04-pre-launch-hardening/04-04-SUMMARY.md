---
phase: 04-pre-launch-hardening
plan: 04
subsystem: ci-cd-canary
tags: [canary, ci-cd, nginx, rollback, infra, phase-4, wave-2]
requirements:
  - NFR-cicd
  - NFR-uptime
dependency_graph:
  requires:
    - 04-01 (D-04 forward-compat migration ADR — gates schema changes on the canary path)
    - 04-03 (observability foundation — canary stages must be observed via Sentry/Better Stack/AlertManager)
  provides:
    - "Canary deploy GitHub Actions workflow with 3-stage manual gate (canary-10 / canary-50 / canary-100)"
    - "One-click rollback workflow with `production-rollback` environment and NO required reviewer (Pitfall 8)"
    - "Nginx weighted-upstream architecture with `ip_hash` Socket.IO sticky sessions (Pitfall 7)"
    - "canary-state.json + render-canary.sh + set-weights.sh for stage lifecycle (canary-10/50/100/rollback/promote)"
    - "B-4 pre-edit snapshot of nginx.conf for collision-guard verification"
    - "Audit-suite SC5a baseline assertions (4 new) — workflow files exist + D-04 forward-compat preserved"
    - "Operator runbooks for forward canary deploy and rollback recovery"
  affects:
    - "04-08 (audit-suite final SC5a closure — already asserts via these workflow files)"
    - "Future production cutover at v1.1 launch — canary path is now ready pending VPS-B provisioning + repo Secrets/Environments configuration"
tech-stack:
  added: []
  patterns:
    - "B-4 pre-edit snapshot guard (nginx.conf.pre-04-04 verbatim copy of pre-edit nginx.conf)"
    - "Targeted sed with trailing semicolon to prevent partial-token replace on `proxy_pass http://api;` lines (avoids collision with `api_metrics` / `api_grafana` if they ever appear)"
    - "GitHub Actions `environment:` per-stage gating (existing ci.yml deploy-job analog)"
    - "appleboy/ssh-action@v1 reuse — same SSH analog as Phase 1 deploy job"
key-files:
  created:
    - .github/workflows/deploy-canary.yml
    - .github/workflows/rollback.yml
    - nginx/nginx.conf.pre-04-04
    - nginx/canary-state.json
    - nginx/render-canary.sh
    - nginx/set-weights.sh
    - docs/runbooks/canary-deploy.md
    - docs/runbooks/rollback.md
  modified:
    - nginx/nginx.conf
    - backend/tests/audit/closeout-audit.test.ts
decisions:
  - "Render the weighted upstream into a separate include file (`/etc/nginx/conf.d/canary-upstream.conf`) rather than inlining `upstream api_pool { ... }` in `nginx/nginx.conf`. Keeps the committed Nginx config stable while allowing the LB host to mutate weights at runtime via render-canary.sh."
  - "Targeted `sed 's|proxy_pass http://api;|proxy_pass http://api_pool;|g'` with the trailing semicolon protects future `upstream api_metrics`/`upstream api_grafana` callers from accidental rewrite (B-4 collision guard hardening)."
  - "rollback.yml uses `environment: production-rollback` but the no-reviewer enforcement lives in repo Environments settings — workflow YAML cannot prove absence of a reviewer. Audit-suite assertion checks the env name + the `set-weights.sh rollback` invocation; runbook documents the rationale."
  - "Forward-compat-only D-04 (Wave 0 ADR) means canary deploy never runs `prisma migrate deploy` — verified by audit assertion that strips YAML comments before scanning so a header comment can't falsify the gate."
metrics:
  duration_minutes: 12
  tasks_completed: 3
  commits: 4
  files_created: 8
  files_modified: 2
  audit_tests_added: 4
  audit_tests_total: 35
  completed: 2026-05-01
---

# Phase 04 Plan 04: Canary Deploy + One-Click Rollback (D-01, D-02, D-03, Pitfall 7, Pitfall 8)

One-liner: Land the 2nd-VPS + Nginx-weighted-upstream canary architecture (D-01/D-02/D-03) with one-click rollback (Pitfall 8), plus runbooks and audit-suite SC5a baseline.

## What Shipped

### Task 1 — Nginx weighted upstream + render/set-weights scripts (commit `a9086eb`)

**B-4 scan-first list (pre-edit `upstream api*` blocks discovered in `nginx/nginx.conf`):**

| Block | Pre-edit line | Disposition |
|-------|---------------|-------------|
| `upstream api { ... }` | 40 | RENAMED → replaced with `include /etc/nginx/conf.d/canary-upstream.conf;` |

No `upstream api_metrics`, `upstream api_grafana`, or any other `upstream api_*` block existed in the pre-edit file. B-4 collision guard is clean by definition (no unrelated upstream blocks to collide with). Verified post-edit:
```
diff nginx/nginx.conf.pre-04-04 nginx/nginx.conf | grep -cE "upstream\s+api_(metrics|grafana)"
0
```

`nginx/nginx.conf.pre-04-04` is the verbatim pre-edit snapshot (172 lines) committed alongside the edited file so reviewers can diff. The bare `upstream api { server api:3000; keepalive 32; }` block is replaced with an `include` directive that pulls the rendered upstream pool from `/etc/nginx/conf.d/canary-upstream.conf` (rendered on the LB host by `render-canary.sh`).

All 6 occurrences of `proxy_pass http://api;` are renamed to `proxy_pass http://api_pool;`. Targeted sed with the trailing semicolon protects against future `api_metrics` / `api_grafana` collision.

`nginx/canary-state.json` ships the stable+canary state file with `vps-a.internal` / `vps-b.internal` hostnames and weight defaults (stable=100, canary=0). Internal-network hostnames mean no public attack surface gained by repo visibility (T-04-04-06 accept).

`nginx/render-canary.sh` is the jq-based renderer that produces `upstream api_pool { ip_hash; server <stable>:3000 weight=N; server <canary>:3000 weight=M; keepalive 32; }` from `canary-state.json`, runs `nginx -t`, and reloads with `nginx -s reload`. The `ip_hash;` directive is REQUIRED for Socket.IO long-polling sticky sessions (Pitfall 7) — verified by audit assertion `render-canary.sh` contains `ip_hash`.

`nginx/set-weights.sh` accepts stage names (`canary-10` / `canary-50` / `canary-100` / `rollback` / `promote`) and mutates `canary-state.json` accordingly, then re-renders. The `promote` case is a role-swap — canary becomes the new stable; old stable becomes the next canary target.

### Task 2 — GitHub Actions deploy-canary + rollback workflows (commit `8507907`)

`.github/workflows/deploy-canary.yml`:
- `workflow_dispatch` with required `stage` input (choice: `canary-10`, `canary-50`, `canary-100`)
- `environment: ${{ inputs.stage }}` — per-stage GitHub Actions environment-protection rules gate each manual approval (D-02 reviewer = Faisal)
- Two SSH steps via `appleboy/ssh-action@v1` (same analog as Phase 1 ci.yml): (1) pull image + restart `api` on canary VPS, (2) run `set-weights.sh ${stage}` on LB host
- Health-check loop: `https://${CANARY_HOST}/health` polled until 200 (10 attempts × 10 s delay)
- NO `prisma migrate deploy` invocation — D-04 forward-compat (schema is shared between VPS-A and VPS-B and was applied at the prior promotion)

`.github/workflows/rollback.yml`:
- `workflow_dispatch` only (no inputs — one-click)
- `environment: production-rollback` — NO required reviewer (Pitfall 8). Branch protection on `main` is the only access gate (only Faisal can dispatch).
- Single SSH step: `set-weights.sh rollback` on LB host with timestamped success line for runbook capture

### Task 3 — Runbooks + audit-suite SC5a baseline (commits `bb3b283` + `51d962a`)

`docs/runbooks/rollback.md` documents:
- When to rollback (5xx burst / p95 breach / Stripe webhook failure / user-reported critical bug)
- Manual recovery via Actions UI (~30 s typical)
- CLI recovery via `gh workflow run rollback.yml` (~10 s)
- "Why no Reviewer" rationale per Pitfall 8
- Recovery time math: SSH connect (~2 s) + `set-weights.sh rollback` (~1 s) + `nginx -s reload` (~1 s) → **<10 s typical, <30 s worst case** (well inside the D-03 SLO of <60 s)
- Post-rollback incident hygiene + D-04 forward-compat reminder if a destructive migration shipped in error

`docs/runbooks/canary-deploy.md` documents:
- Prerequisites (D-04 ADR locked, audit suite green, nightly backup fresh, VPS-B is current canary, Stripe Connect smoke-test passes)
- 3-stage progression with 60-min soak between each (`#sorcyn-prod-alerts` + Better Stack live tail + Sentry Performance dashboard)
- Promotion role-swap step: `set-weights.sh promote` (canary → stable, old stable → next canary target)
- D-04 forward-compat reminder: canary box does NOT run `prisma migrate deploy`

`backend/tests/audit/closeout-audit.test.ts` appends 4 SC5a assertions (no Phase 3 baseline modified):
1. `.github/workflows/deploy-canary.yml` exists with `canary-10` / `canary-50` / `canary-100` and `environment: ${{ inputs.stage }}` per-stage gate
2. `.github/workflows/rollback.yml` exists with `environment: production-rollback` and `set-weights.sh rollback` invocation
3. `nginx/render-canary.sh` contains `ip_hash` (Pitfall 7)
4. Comments-stripped `deploy-canary.yml` does NOT contain `prisma migrate deploy` (D-04 forward-compat). The comment-strip is the Nyquist hygiene rule from RESEARCH Pitfall 10 — a header comment can't falsify this gate.

Audit suite total: **35/35 passing** (31 prior baseline + 4 new SC5a).

## Faisal — Required Repo Configuration Before First Canary Run

These items live outside the repo and must be configured before `gh workflow run deploy-canary.yml` will function:

### Repository Secrets (Settings → Secrets and variables → Actions)
- `CANARY_VPS_HOST` — VPS-B internal/external host the deploy job SSHes into
- `LB_HOST` — host running Nginx + `set-weights.sh`
- `CANARY_HOST` — host the health-check curls (typically same as `CANARY_VPS_HOST`)
- `DEPLOY_USER` — already set from Phase 1
- `DEPLOY_SSH_KEY` — already set from Phase 1

### GitHub Actions Environments (Settings → Environments)
- `canary-10` — required reviewer = **Faisal**
- `canary-50` — required reviewer = **Faisal**
- `canary-100` — required reviewer = **Faisal**
- `production-rollback` — **NO required reviewer** (Pitfall 8). Access gated by branch protection on `main`.

### Branch Protection (Settings → Branches → main)
- Restrict who can push and dispatch workflows on `main` to **Faisal only** — this is the access gate for `production-rollback`.

### Hetzner Cloud (or equivalent provider)
- Provision **VPS-B** in same region/class as VPS-A
- Install docker + docker-compose; mount `/opt/reverse-marketplace`; configure SSH keypair
- Provision LB host (or co-locate Nginx with VPS-A) and seed `/opt/sorcyn-lb/canary-state.json` from this plan + `/opt/sorcyn-lb/render-canary.sh` + `/opt/sorcyn-lb/set-weights.sh`

## Recovery Time Math (D-03 SLO `<60 s`)

| Step | Cost |
|------|------|
| SSH connect | ~2 s |
| `set-weights.sh rollback` (jq + atomic mv) | ~1 s |
| `nginx -s reload` (graceful, no in-flight drop) | ~1 s |
| LB DNS TTL | not in path (Nginx is the LB itself) |
| **Total typical** | **<10 s** |
| **Total worst case** | **<30 s** |

## Threat Model — Mitigations Confirmed

| Threat ID | Disposition | Implementation |
|-----------|-------------|----------------|
| T-04-04-01 | mitigated | D-04 ADR audit gate (04-01) + audit assertion canary YAML has no `prisma migrate deploy` (this plan, comment-stripped scan) |
| T-04-04-02 | mitigated | `production-rollback` env name surfaced via `user_setup`; runbook documents rationale; YAML cannot prove absence-of-reviewer (env settings job) |
| T-04-04-03 | accept (MEDIUM) | Reuses existing `DEPLOY_SSH_KEY` / `DEPLOY_USER`; no new key surface |
| T-04-04-04 | mitigated | `ip_hash` baked into rendered upstream + audit assertion `render-canary.sh` contains `ip_hash` |
| T-04-04-05 | mitigated | Branch protection on `main` + per-stage env reviewer (D-02) |
| T-04-04-06 | accept (LOW) | Internal hostnames only |
| T-04-04-07 | accept (LOW pre-launch) | Phase 6 will move LB to a third tiny VPS or Cloudflare Load Balancer |
| T-04-04-08 | mitigated | B-4 snapshot + scan-first + diff-based collision-guard (no `upstream api_metrics`/`api_grafana` blocks existed; targeted sed with trailing semicolon) |

## Self-Check: PASSED

- All 3 plan tasks shipped across 4 commits (a9086eb, 8507907, bb3b283, 51d962a)
- All Task 1 / Task 2 / Task 3 acceptance criteria pass
- B-4 pre-edit snapshot committed; no unrelated `upstream api_*` blocks modified (verified via diff)
- `cd backend && npx vitest run tests/audit` exits 0 with **35/35** assertions passing
- All `proxy_pass http://api;` renamed (count = 0); `proxy_pass http://api_pool;` count = 6
- `ip_hash` in `render-canary.sh` (Pitfall 7); no `prisma migrate deploy` in canary YAML (D-04)
- Both shell scripts: `bash -n` clean, executable bit set, `#!/usr/bin/env bash` shebang
- Both workflow YAMLs parse cleanly
- Runbooks document `<60 s` SLO, "Why no Reviewer", `set-weights.sh promote` role-swap, and 5 `D-04` references in canary-deploy.md

**Statement:** Canary infrastructure ready; first canary deploy can run after VPS-B is provisioned and repo Secrets/Environments are configured per the "Faisal — Required Repo Configuration" section above.

## Resume Note for Next Session

This plan was originally spawned as a worktree-isolated executor that returned mid-flight without committing. Most of the work landed on `main` directly (commits a9086eb + 8507907) during a parallel session, plus uncommitted runbook + audit-test changes on the working tree. The orchestrator (this session) verified the on-disk work against all plan acceptance criteria, then committed the runbooks + audit test as `bb3b283` + `51d962a`, ran the audit suite to confirm green, and wrote this SUMMARY. No re-execution was needed — the work was already correct.
