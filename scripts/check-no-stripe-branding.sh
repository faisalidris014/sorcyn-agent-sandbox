#!/usr/bin/env bash
#
# CI gate (issue #84 / RUNBOOK_OPS.md §2 wording rule): the payment processor
# must never be named "Stripe" in any user-facing string. This protects the
# outage-messaging abstraction and keeps brand leakage out of the UI.
#
# Scope:
#   1. Flutter l10n .arb VALUES — the canonical user-facing copy store. Zero
#      tolerance for the word "stripe" (case-insensitive) in any value.
#   2. Flutter Dart STRING LITERALS shown to users. We exclude code identifiers
#      (StripeStatus, Stripe.instance, startStripeOnboarding, …), import/package
#      paths, and comments — none of which are user-facing.
#
# Allowlist: "Powered by Stripe Identity" remains permitted only in the
# identity-verification flow where Stripe's legal attribution is required.
#
# Exit non-zero (and print offenders) if any disallowed user-facing mention is
# found. Runs from the repo root.
set -euo pipefail

cd "$(dirname "$0")/.."

fail=0

# ── 1. .arb localization values ──────────────────────────────────────────────
# Match `... : "....stripe...."` — the value side only, so the legitimate KEY
# `stripeOnboarding` doesn't trip the gate. Case-insensitive.
arb_hits="$(grep -rinE ':[[:space:]]*"[^"]*stripe[^"]*"' mobile/lib/l10n/*.arb || true)"
if [[ -n "$arb_hits" ]]; then
  echo "✖ 'Stripe' found in user-facing .arb localization values:"
  echo "$arb_hits"
  fail=1
fi

# ── 2. Dart user-facing string literals ──────────────────────────────────────
# Start from every "Stripe" occurrence, then strip everything that is NOT a
# user-facing prose string:
#   - full-line comments (// , /// , *)
#   - import / package: paths
#   - identifiers:  StripeFoo  (Stripe + letter)  and  fooStripe (letter + Stripe)
#   - member access: Stripe.   (e.g. Stripe.instance)
#   - allowlisted attribution: "Powered by Stripe" (covers "… Stripe Identity")
dart_hits="$(grep -rn 'Stripe' mobile/lib --include='*.dart' \
  | grep -vE ':[[:space:]]*(//|///|\*)' \
  | grep -v 'package:' \
  | grep -vE 'Stripe[A-Za-z]' \
  | grep -vE '[A-Za-z0-9_]Stripe' \
  | grep -vE 'Stripe\.' \
  | grep -v 'Powered by Stripe Identity' \
  || true)"
if [[ -n "$dart_hits" ]]; then
  echo "✖ 'Stripe' found in user-facing Dart string literals:"
  echo "$dart_hits"
  echo "  (If this is required vendor attribution, it must read exactly 'Powered by Stripe' / 'Powered by Stripe Identity'.)"
  fail=1
fi

if [[ "$fail" -eq 0 ]]; then
  echo "✓ No disallowed 'Stripe' brand mentions in user-facing strings."
fi
exit "$fail"
