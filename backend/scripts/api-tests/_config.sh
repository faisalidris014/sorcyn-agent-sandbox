#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Shared Configuration for API Test Suite
# ═══════════════════════════════════════════════════════════════════

# Server
BASE_URL="${API_TEST_BASE_URL:-http://localhost:3000}"
API="$BASE_URL/api/v1"

# Test credentials (seeded accounts)
BUYER_EMAIL="buyer@test.com"
BUYER_PASSWORD="TestPassword123!"

SELLER_EMAIL="seller@test.com"
SELLER_PASSWORD="TestPassword123!"

BOTH_EMAIL="both@test.com"
BOTH_PASSWORD="TestPassword123!"

ADMIN_EMAIL="admin@reversemarketplace.com"
ADMIN_PASSWORD="AdminSecure456!"

# Unique identifier for this test run
TIMESTAMP="${TIMESTAMP:-$(date +%s)}"
NEW_USER_EMAIL="apitest-${TIMESTAMP}@test.com"
NEW_USER_PASSWORD="TestPassword123!"

# Docker container names
PG_CONTAINER="rm-postgres"
PG_USER="postgres"
PG_DB="reverse_marketplace"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'

# Counters
PASS=0
FAIL=0
SKIP=0
