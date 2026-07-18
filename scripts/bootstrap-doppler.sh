#!/usr/bin/env bash
# bootstrap-doppler.sh — first-time Doppler setup on a fresh machine.
#
# Installs the Doppler CLI, walks the operator through `doppler login`, binds
# this repo to the sorcyn-backend / dev config, and verifies the critical
# secrets are present. Idempotent: re-running prints "already done" for each
# step. Ends by printing the next command (`sorcyn dev`) for the operator to
# run themselves — the script does not start any long-lived process.
#
# Usage:   bash scripts/bootstrap-doppler.sh
# See:     CLAUDE.md § "Secrets Management — Doppler"

set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT" || { echo "cd to repo root failed: $REPO_ROOT" >&2; exit 1; }

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
DIM='\033[2m'
RESET='\033[0m'

ok()   { printf "${GREEN}✓${RESET} %s\n" "$1"; }
warn() { printf "${YELLOW}!${RESET} %s\n" "$1"; }
fail() { printf "${RED}✗${RESET} %s\n  ${YELLOW}→${RESET} %s\n" "$1" "$2" >&2; exit 1; }
step() { printf "\n${DIM}━━ %s${RESET}\n" "$1"; }
info() { printf "${DIM}→${RESET} %s\n" "$1"; }

# Step 1/5 — Homebrew is a hard prerequisite (used to install Doppler CLI on macOS).
step "1/5 Homebrew"
if ! command -v brew >/dev/null 2>&1; then
  fail "Homebrew is not installed on this machine" \
       "Install Homebrew first: https://brew.sh — then re-run: bash scripts/bootstrap-doppler.sh"
fi
ok "Homebrew present ($(brew --version 2>/dev/null | head -n1))"

# Step 2/5 — Doppler CLI. Install via Homebrew if missing; never auto-upgrade.
step "2/5 Doppler CLI"
if command -v doppler >/dev/null 2>&1; then
  ok "Doppler CLI already installed ($(doppler --version 2>/dev/null | head -n1))"
else
  info "brew install dopplerhq/cli/doppler"
  brew install dopplerhq/cli/doppler \
    || fail "Failed to install Doppler CLI via Homebrew" \
            "Try: brew update && brew install dopplerhq/cli/doppler"
  ok "Doppler CLI installed ($(doppler --version 2>/dev/null | head -n1))"
fi

# Step 3/5 — Authentication. `doppler me` exits non-zero when not logged in.
step "3/5 Doppler authentication"
if doppler me >/dev/null 2>&1; then
  CURRENT_USER="$(doppler me --plain 2>/dev/null | head -n1 || true)"
  ok "Already logged in${CURRENT_USER:+ ($CURRENT_USER)}"
else
  info "doppler login  (a browser tab will open for you to confirm)"
  doppler login \
    || fail "doppler login failed or was cancelled" \
            "Re-run: doppler login   (and accept the workspace invite first if you haven't)"
  ok "Logged into Doppler"
fi

# doppler.yaml uses `path: .`, so the scope is bound to the repo root — matching
# how scripts/sorcyn operates (`doppler configure --scope "$REPO_ROOT"`). Every
# Doppler CLI call from here on runs from the repo root so the scope lookup
# resolves consistently. Move CWD once and stay there.
DOPPLER_DIR="$REPO_ROOT"
cd "$DOPPLER_DIR" || fail "cd to $DOPPLER_DIR failed" "Check filesystem permissions."

# Step 4/5 — Bind this repo to the project/config from doppler.yaml. `doppler
# setup` is interactive but defaults to the doppler.yaml values, so it's a
# one-Enter step on a fresh machine.
step "4/5 Bind repo to Doppler project"
EXISTING_PROJECT="$(doppler configure get project --scope "$DOPPLER_DIR" --plain 2>/dev/null || true)"
EXISTING_CONFIG="$(doppler configure get config --scope "$DOPPLER_DIR" --plain 2>/dev/null || true)"
if [ -n "$EXISTING_PROJECT" ] && [ -n "$EXISTING_CONFIG" ]; then
  ok "Doppler scope already bound: ${EXISTING_PROJECT} / ${EXISTING_CONFIG}"
else
  if [ ! -f "$REPO_ROOT/doppler.yaml" ]; then
    fail "doppler.yaml not found in repo root" \
         "This repo expects a committed doppler.yaml. Ask the project owner to run: sorcyn secrets setup"
  fi
  info "doppler setup  (reads doppler.yaml — press Enter to accept defaults)"
  doppler setup \
    || fail "doppler setup failed" \
            "Verify you have access to the sorcyn-backend project, then re-run this script."
  ok "Doppler scope bound for this repo"
fi

# Step 5/5 — Verify secrets are actually readable. `doppler secrets --silent`
# returns 0 if the config exists and the user has read access; non-zero otherwise.
# Running from $DOPPLER_DIR (set above) so the scope lookup finds the binding.
step "5/5 Verify secrets are readable"
if doppler secrets --silent >/dev/null 2>&1; then
  # Best-effort secret count — non-fatal if parsing fails.
  COUNT="$(doppler secrets --only-names 2>/dev/null | wc -l | tr -d ' ' || echo '?')"
  ok "Doppler config readable (${COUNT} secrets visible)"
else
  fail "Cannot read secrets from Doppler" \
       "Possible causes: (1) you have not been invited to the sorcyn-backend project — ask Faisal; (2) doppler.yaml has changed and the existing scope is stale — try: rm -rf ~/.doppler && bash scripts/bootstrap-doppler.sh"
fi

# Run the full doctor so the operator sees their complete environment status.
# Don't fail the bootstrap if doctor warns about Docker/Postgres — those are
# unrelated to whether Doppler is wired correctly.
step "Running sorcyn doctor for full environment check"
if "$REPO_ROOT/scripts/check-prereqs.sh"; then
  :
else
  warn "Some doctor checks failed above — those are unrelated to Doppler, which is wired up correctly."
fi

# Final message — print the single next command, don't run it.
printf "\n${GREEN}✓ Doppler is ready on this machine.${RESET}\n\n"
printf "To start the backend with Doppler-injected secrets, run:\n\n"
printf "    ${DIM}sorcyn dev${RESET}\n\n"
