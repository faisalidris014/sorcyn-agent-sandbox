#!/usr/bin/env bash
#
# clear-login-lockout.sh — clear Redis login lockouts/attempt counters
# (issue #133 recovery step).
#
# After repeated failed logins the auth service sets a 15-minute lockout
# (MAX_LOGIN_ATTEMPTS=5). During the seed-accounts incident this piled a second,
# unrelated blocker on top of the real "account missing" cause. This wipes both
# key families so you can log in immediately after re-seeding.
#
# Keys (see src/modules/auth/auth.service.ts — keyed by EMAIL, not userId):
#   auth:login_lockout:{email}
#   auth:login_attempts:{email}
#
# Usage: npm run db:reset-lockout
set -euo pipefail

cd "$(dirname "$0")/.."   # → backend/

REDIS_URL=$(grep -E '^REDIS_URL=' .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"')
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

echo "▶ Clearing login lockouts on ${REDIS_URL}"

cleared=0
for pattern in 'auth:login_lockout:*' 'auth:login_attempts:*'; do
  # --scan avoids blocking Redis with KEYS on large datasets.
  while IFS= read -r key; do
    [ -z "$key" ] && continue
    redis-cli -u "$REDIS_URL" del "$key" >/dev/null
    echo "  - deleted $key"
    cleared=$((cleared + 1))
  done < <(redis-cli -u "$REDIS_URL" --scan --pattern "$pattern")
done

echo "✔ Cleared ${cleared} lockout/attempt key(s). You can log in again now."
