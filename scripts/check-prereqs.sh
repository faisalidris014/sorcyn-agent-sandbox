#!/usr/bin/env bash
# Sorcyn dev environment doctor — verifies prerequisites for local development.
# Exit code: 0 if all checks pass, non-zero on the first failure.
# Usage: scripts/check-prereqs.sh   (from anywhere; auto-locates repo)

set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT" || { echo "✗ Cannot cd to repo root: $REPO_ROOT"; exit 1; }

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
RESET='\033[0m'

ok()   { printf "${GREEN}✓${RESET} %s\n" "$1"; }
fail() { printf "${RED}✗${RESET} %s\n  ${YELLOW}→${RESET} %s\n" "$1" "$2"; exit 1; }

# 1. Docker installed
command -v docker >/dev/null 2>&1 \
  || fail "docker not found on PATH" \
          "Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
ok "docker on PATH"

# 2. Docker daemon running
docker info >/dev/null 2>&1 \
  || fail "Docker daemon is not running" \
          "Open Docker Desktop and wait for it to finish starting, then re-run."
ok "Docker daemon running"

# 3. Node version (>=20)
command -v node >/dev/null 2>&1 \
  || fail "node not found on PATH" \
          "Install Node 20 LTS: nvm install 20 && nvm use 20"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  fail "Node $NODE_MAJOR is too old (need >=20)" "Run: nvm install 20 && nvm use 20"
fi
ok "Node $(node -v)"

# 4. backend/.env exists
if [ ! -f "$REPO_ROOT/backend/.env" ]; then
  fail "backend/.env is missing" \
       "Run: cp backend/.env.example backend/.env  (or: sorcyn bootstrap)"
fi
ok "backend/.env present"

# 4b. backend deps installed
if [ ! -d "$REPO_ROOT/backend/node_modules" ]; then
  fail "backend/node_modules is missing — dependencies not installed" \
       "Run: sorcyn bootstrap  (or: cd backend && npm install)"
fi
ok "backend dependencies installed"

# 5. Postgres reachable on host port 5433 — only if compose says it's up
PG_RUNNING=0
if docker compose ps --status running --services 2>/dev/null | grep -qx postgres; then
  PG_RUNNING=1
fi

if [ "$PG_RUNNING" -eq 1 ]; then
  if (echo > /dev/tcp/127.0.0.1/5433) >/dev/null 2>&1; then
    ok "Postgres reachable on localhost:5433"
  else
    fail "Postgres container is up but localhost:5433 is not accepting connections" \
         "Check port conflict: lsof -i :5433"
  fi
else
  printf "${YELLOW}!${RESET} Postgres container not running — start it with: docker compose up -d\n"
fi

# 6. Redis reachable on host port 6379 — only if compose says it's up
REDIS_RUNNING=0
if docker compose ps --status running --services 2>/dev/null | grep -qx redis; then
  REDIS_RUNNING=1
fi

if [ "$REDIS_RUNNING" -eq 1 ]; then
  if (echo > /dev/tcp/127.0.0.1/6379) >/dev/null 2>&1; then
    ok "Redis reachable on localhost:6379"
  else
    fail "Redis container is up but localhost:6379 is not accepting connections" \
         "Check port conflict: lsof -i :6379"
  fi
else
  printf "${YELLOW}!${RESET} Redis container not running — start it with: docker compose up -d\n"
fi

printf "\n${GREEN}All checks passed.${RESET}\n"
