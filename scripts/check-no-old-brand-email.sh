#!/usr/bin/env bash
#
# CI gate (issue #217): the old project codename "Reverse Marketplace" must
# never appear in user-facing transactional copy. The brand is "Sorcyn".
#
# Scope — the two places static brand strings live in sent email:
#   1. i18n locale VALUES (backend/src/common/i18n/locales/*.json) — every
#      string here is user-facing copy. Zero tolerance.
#   2. The auth email helpers (auth.service.ts) — subjects are now templated
#      off env.BRAND_NAME, so any literal "Reverse Marketplace" here is a
#      regression.
#
# This does NOT scan docs, the PRD, or the Swagger API title — those are not
# email copy and the rebrand of those surfaces is tracked separately (#80).
#
# Exit non-zero (and print offenders) if any disallowed mention is found.
set -euo pipefail

cd "$(dirname "$0")/.."

fail=0
needle='Reverse Marketplace'

# ── 1. i18n locale values ────────────────────────────────────────────────────
locale_hits="$(grep -rn "$needle" backend/src/common/i18n/locales/ || true)"
if [[ -n "$locale_hits" ]]; then
  echo "✖ '$needle' found in i18n locale values (should read 'Sorcyn'):"
  echo "$locale_hits"
  fail=1
fi

# ── 2. Auth email helpers ────────────────────────────────────────────────────
auth_hits="$(grep -n "$needle" backend/src/modules/auth/auth.service.ts || true)"
if [[ -n "$auth_hits" ]]; then
  echo "✖ '$needle' found in auth email helpers (use env.BRAND_NAME):"
  echo "$auth_hits"
  fail=1
fi

if [[ "$fail" -eq 0 ]]; then
  echo "✓ No '$needle' brand mentions in transactional email copy."
fi
exit "$fail"
