<!-- Sorcyn PR template. Keep PRs single-lane where possible (.planning/WORK_SPLIT.md). -->

## What & why

<!-- One or two sentences. Link the issue: Closes #NNN -->

## Lane

- [ ] Backend / Infra (Faisal)
- [ ] Mobile (Mohamed)
- [ ] Shared (docs / .planning / contracts / .github)

## Seam checklist (the cross-lane items — tick any that apply, then notify your partner)

- [ ] **API surface changed** — I regenerated `contracts/openapi.json` in this PR
      (`cd backend && npm run contract:generate`) and the drift gate is green.
- [ ] **Prisma schema / migration** — additive / forward-compatible only; partner
      must `npm run db:bootstrap` after pulling.
- [ ] **Env var added / renamed** — updated `backend/.env.example` and told my partner.
- [ ] None of the above (pure in-lane change).

## Verification

<!-- What you ran. Backend: npm run validate. Mobile: flutter analyze + flutter test. -->

---
<sub>Reviewers are auto-requested via `.github/CODEOWNERS` for any seam path. See
`docs/OPERATOR_SYNC.md` and `docs/REALTIME_SYNC.md`.</sub>
