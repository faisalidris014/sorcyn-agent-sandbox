#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 01 — Health Check (1 test)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
source "$(dirname "$0")/_helpers.sh"

section "Health Check"

# 1. GET /health
api_raw GET "$BASE_URL/health"
check "GET /health returns 200" 200 "$CODE" "$BODY"

summary "Health Check"
exit $?
