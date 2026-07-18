---
phase: 4
slug: pre-launch-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-30
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 1.x (backend) + flutter test (mobile) + k6 (load) |
| **Config file** | `backend/vitest.config.ts` + `mobile/test/` + `tests/load/k6.config.ts` (Wave 0 installs) |
| **Quick run command** | `cd backend && npx vitest run tests/audit` |
| **Full suite command** | `cd backend && npx vitest run && cd ../mobile && flutter test` |
| **Estimated runtime** | ~90 seconds (audit only) / ~10 min (full suite) / ~20 min (load test, on-demand only) |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx vitest run tests/audit` (asserts NFR thresholds + no destructive migrations + canary workflow exists)
- **After every plan wave:** Run full backend vitest + flutter test (skip k6 — that's a release-gate command)
- **Before `/gsd-verify-work`:** Full suite green + k6 load test report committed + A11Y_AUDIT.md committed + UAT_REPORT.md signed off
- **Max feedback latency:** 90 seconds for audit suite

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-XX-XX | TBD | TBD | REQ-launch-readiness + 11 NFRs | TBD per plan | See plan must_haves | unit/integration/E2E/load | TBD per plan | ❌ W0 (planner fills) | ⬜ pending |

*Per-task entries populated by gsd-planner during plan generation. Planner reads RESEARCH.md `## Validation Architecture` section and maps each Success Criterion threshold to an audit-suite assertion.*

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.planning/intel/decisions.md` — lock D-04 forward-compatible-only migration ADR (BLOCKING — no plan executes without this)
- [ ] `CLAUDE.md` — reference D-04 ADR in "Critical Design Patterns" section
- [ ] `backend/tests/audit/closeout-audit.test.ts` — extend with `describe('SC#1 — load test thresholds')`, `describe('SC#2 — coverage ≥70%')`, `describe('SC#3 — A11Y per-screen pass')`, `describe('SC#4 — DR drill RTO/RPO')`, `describe('SC#5 — canary 10/50/100 + rollback exists')` blocks
- [ ] `backend/tests/audit/closeout-audit.test.ts` — D-04 enforcement: regex assertion that `prisma/migrations/<latest>/migration.sql` does NOT contain `DROP COLUMN`, `DROP TABLE`, `ALTER COLUMN ... NOT NULL` (without prior `ADD COLUMN` nullable), `RENAME TO`, `ALTER COLUMN ... TYPE`
- [ ] k6 install + `tests/load/scenarios/` directory + `tests/load/thresholds.json` — Wave 0 of load-test plan
- [ ] Sentry Performance enable: `tracesSampleRate: 0.05` in `backend/src/config/sentry.ts` + same in `mobile/lib/main.dart` (5% per RESEARCH Pitfall 6 quota math)
- [ ] `@logtail/pino` install + lazy-singleton transport + `BETTER_STACK_TOKEN` added to `validateProductionEnv` (Phase 3 plan 03-02 pattern)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| WCAG 2.1 AA per-screen | NFR-accessibility / SC#3 | TalkBack/VoiceOver audit cannot be fully automated; `accessibility_test` package covers contrast + tap-target + semantic-label but real screen-reader walkthrough requires human verification | Run `flutter test integration_test/a11y_test.dart` (automated subset); then per screen: enable VoiceOver (iOS) / TalkBack (Android), navigate every interactive element, record pass/fail in `docs/A11Y_AUDIT.md` |
| DR drill restore | NFR-disaster-recovery / SC#4 | Live restore-to-different-region procedure cannot be safely automated in CI (production-blast-radius operation) | Execute `docs/runbooks/dr-drill.md` once during Phase 4; capture timed RTO + RPO; sign off as "PASS" only if RTO <4h AND RPO <1h |
| 20-user UAT sign-off | REQ-launch-readiness / SC#5 | User acceptance testing requires human participants per recruitment plan (10 buyers + 10 sellers from DFW) | Distribute UAT script via `docs/UAT_SCRIPT.md`; capture per-user pass/fail per scenario in `docs/UAT_REPORT.md`; sign off only when ≥18/20 users complete full transaction loop |
| Synthetic incident drill | NFR-monitoring / SC#4 | Quarterly chaos drill is human-driven by design (D-08); intentionally trips alerts on staging to verify the page reaches Slack | Execute `scripts/synthetic-incident.sh` against staging; capture Slack-page screenshot evidence per alert; document in `docs/runbooks/observability-drill.md` |
| PCI-DSS SAQ-A attestation | NFR-security / SC#2 | Self-attestation form filing is a one-time per-year manual process | Confirm Stripe support that SAQ-A applies; download from PCI council; complete; commit `docs/PCI_SAQ_A.md` with completed attestation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (planner fills)
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (planner enforces)
- [ ] Wave 0 covers all MISSING references (D-04 ADR, audit suite NFR blocks, k6 install, Sentry sampling, pino-logtail)
- [ ] No watch-mode flags (audit suite is run-once, not watch)
- [ ] Feedback latency < 90s (audit suite target)
- [ ] `nyquist_compliant: true` set in frontmatter once planner completes

**Approval:** pending
