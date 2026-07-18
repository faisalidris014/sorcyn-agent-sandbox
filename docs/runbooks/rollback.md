# Rollback Runbook

> One-click rollback for canary deploys. Recovery target: <60 s.

## When to Rollback
- 5xx burst alert in #sorcyn-prod-alerts
- p95 latency >500 ms over baseline (sustained 5 min)
- Stripe webhook failure spike
- User-reported critical bug on canary path

## How to Rollback (manual, ~30 s typical)
1. Open: https://github.com/<owner>/<repo>/actions/workflows/rollback.yml
2. Click "Run workflow" → branch: `main`
3. Confirm `production-rollback` environment (NO reviewer required by design — Pitfall 8)
4. Watch SSH step output; success message: `Rollback complete: VPS-A weight=100, VPS-B weight=0`
5. Verify in `#sorcyn-prod-alerts`: any active alerts should resolve within 5 min

## How to Rollback (CLI, ~10 s)
```
gh workflow run rollback.yml
```

## Why no Reviewer?
Per RESEARCH Pitfall 8: rollback must be one-click. Branch protection on `main` ensures only Faisal can dispatch. Adding a reviewer requirement would block recovery during exactly the moments it is needed most.

## Recovery Time Math (D-03 SLO <60 s)
- SSH connect: ~2 s
- `set-weights.sh rollback` (jq + cp): ~1 s
- `nginx -s reload`: ~1 s (graceful, no in-flight drop)
- LB DNS TTL: not in path (Nginx is the LB itself)
- **Total: <10 s typical, <30 s worst case**

## Post-Rollback
- File incident report: `docs/incidents/{YYYY-MM-DD}-{title}.md`
- Decide: re-attempt canary after fix OR roll forward with stable image
- If a destructive Prisma migration shipped in error, check D-04 audit gate output — Wave 0 is the gate that should have caught it; investigate why it didn't
