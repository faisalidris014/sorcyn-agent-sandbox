#!/usr/bin/env bash
# bootstrap-devsync.sh — one-command setup for the realtime work-claim system.
#
# Idempotent. Safe to re-run. Installs the engine deps, verifies the shared
# Supabase connection, creates the claim table, and prints the next step.
# See docs/REALTIME_SYNC.md for the full picture.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEVSYNC="$ROOT/scripts/devsync"

echo "==> devsync bootstrap"

# 1. Engine dependencies (pg).
if [ ! -d "$DEVSYNC/node_modules/pg" ]; then
  echo "--> installing engine deps (pg)"
  (cd "$DEVSYNC" && npm install --silent)
else
  echo "--> engine deps present"
fi

# 2. Identity check.
echo "--> identity:"
node "$DEVSYNC/claim.mjs" whoami | sed 's/^/    /'

# 3. SYNC_DATABASE_URL must resolve (process env, backend/.env, or .env).
SYNC_SET="$(node "$DEVSYNC/claim.mjs" whoami | grep -c 'sync_url: set' || true)"
if [ "$SYNC_SET" -eq 0 ]; then
  cat <<'EOF'

  SYNC_DATABASE_URL is not set. The realtime layer is DISABLED until it is
  (hooks fail open — coding is never blocked, you just won't see the other
  operator's live claims).

  To enable: add the SHARED Supabase connection string (same value for both
  operators) to backend/.env:

      SYNC_DATABASE_URL=postgresql://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require

  Then re-run: bash scripts/bootstrap-devsync.sh
EOF
  exit 0
fi

# 4. Create the claim table.
echo "--> ensuring claim table exists"
node "$DEVSYNC/claim.mjs" init | sed 's/^/    /'

# 5. Show current state.
echo "--> current active claims:"
node "$DEVSYNC/claim.mjs" list | sed 's/^/    /' || true

cat <<'EOF'

==> devsync ready.
    The hooks in .claude/settings.json now register a claim on session start,
    check for collisions before every edit, and release on session end —
    automatically, on both machines. Live board any time:

        node scripts/devsync/claim.mjs list
EOF
