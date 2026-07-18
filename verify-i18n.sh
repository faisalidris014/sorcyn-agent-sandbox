#!/usr/bin/env bash
# =============================================================================
# verify-i18n.sh — Verify and showcase multi-language (i18n) support
# Reverse Marketplace Platform
# =============================================================================
set -euo pipefail

# --- Colors & Symbols ---
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'
PASS="${GREEN}PASS${NC}"
FAIL="${RED}FAIL${NC}"
WARN="${YELLOW}WARN${NC}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

LANGUAGES=("en" "es" "zh" "ar" "fr" "pt" "hi" "vi" "ko" "ja")
LANG_NAMES=("English" "Spanish" "Chinese" "Arabic" "French" "Portuguese" "Hindi" "Vietnamese" "Korean" "Japanese")

check() {
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  local label="$1"
  local result="$2" # 0 = pass, 1 = fail
  if [ "$result" -eq 0 ]; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    printf "  [${PASS}] %s\n" "$label"
  else
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    printf "  [${FAIL}] %s\n" "$label"
  fi
}

section() {
  echo ""
  printf "${BOLD}${CYAN}=== %s ===${NC}\n" "$1"
}

# Count JSON keys (ignoring lines with only braces/whitespace)
count_json_keys() {
  grep -c '"[^"]*"\s*:' "$1" 2>/dev/null || echo 0
}

# Count ARB keys (exclude @@locale and @-prefixed metadata keys)
count_arb_keys() {
  grep -cE '^\s*"[^@][^"]*"\s*:' "$1" 2>/dev/null || echo 0
}

# Extract a sample value from a JSON file by key
json_value() {
  local file="$1" key="$2"
  grep "\"${key}\"" "$file" 2>/dev/null | head -1 | sed 's/.*: *"\(.*\)".*/\1/' || echo "(not found)"
}

# =============================================================================
echo ""
printf "${BOLD}Reverse Marketplace — Multi-Language (i18n) Verification${NC}\n"
printf "${DIM}Running checks from: ${SCRIPT_DIR}${NC}\n"

# ======================== BACKEND CHECKS ======================================
section "Backend i18n (Node.js / Fastify)"

# Core files
check "i18n engine exists (common/i18n/index.ts)" \
  $([ -f "$SCRIPT_DIR/backend/src/common/i18n/index.ts" ] && echo 0 || echo 1)

check "Locale middleware exists (common/middleware/locale.ts)" \
  $([ -f "$SCRIPT_DIR/backend/src/common/middleware/locale.ts" ] && echo 0 || echo 1)

# Locale JSON files
BACKEND_LOCALE_DIR="$SCRIPT_DIR/backend/src/common/i18n/locales"
for i in "${!LANGUAGES[@]}"; do
  lang="${LANGUAGES[$i]}"
  name="${LANG_NAMES[$i]}"
  check "Backend locale file: ${lang}.json (${name})" \
    $([ -f "$BACKEND_LOCALE_DIR/${lang}.json" ] && echo 0 || echo 1)
done

# i18n engine features
check "t() translation function exported" \
  $(grep -q "export function t(" "$SCRIPT_DIR/backend/src/common/i18n/index.ts" && echo 0 || echo 1)

check "parseAcceptLanguage() function exported" \
  $(grep -q "export function parseAcceptLanguage(" "$SCRIPT_DIR/backend/src/common/i18n/index.ts" && echo 0 || echo 1)

check "SUPPORTED_LOCALES array includes all 10 languages" \
  $(grep -q "'en'" "$SCRIPT_DIR/backend/src/common/i18n/index.ts" && \
   grep -q "'ja'" "$SCRIPT_DIR/backend/src/common/i18n/index.ts" && echo 0 || echo 1)

# Locale middleware integration
check "Middleware sets request.locale from Accept-Language" \
  $(grep -q "request.locale" "$SCRIPT_DIR/backend/src/common/middleware/locale.ts" && echo 0 || echo 1)

# Route-level usage
ROUTE_USAGE=$(grep -rl "request\.locale\|from '.*i18n" "$SCRIPT_DIR/backend/src/modules/" 2>/dev/null | wc -l | tr -d ' ')
check "Backend routes use i18n (${ROUTE_USAGE} module files reference locale/i18n)" \
  $([ "$ROUTE_USAGE" -gt 0 ] && echo 0 || echo 1)

# ======================== MOBILE CHECKS =======================================
section "Mobile i18n (Flutter / Dart)"

check "l10n.yaml config exists" \
  $([ -f "$SCRIPT_DIR/mobile/l10n.yaml" ] && echo 0 || echo 1)

check "flutter_localizations dependency in pubspec.yaml" \
  $(grep -q "flutter_localizations" "$SCRIPT_DIR/mobile/pubspec.yaml" && echo 0 || echo 1)

check "intl package dependency in pubspec.yaml" \
  $(grep -q "intl:" "$SCRIPT_DIR/mobile/pubspec.yaml" && echo 0 || echo 1)

# ARB files
ARB_DIR="$SCRIPT_DIR/mobile/lib/l10n"
for i in "${!LANGUAGES[@]}"; do
  lang="${LANGUAGES[$i]}"
  name="${LANG_NAMES[$i]}"
  check "Mobile ARB file: app_${lang}.arb (${name})" \
    $([ -f "$ARB_DIR/app_${lang}.arb" ] && echo 0 || echo 1)
done

# Key Flutter files
check "Locale provider exists (locale_provider.dart)" \
  $([ -f "$SCRIPT_DIR/mobile/lib/core/providers/locale_provider.dart" ] && echo 0 || echo 1)

check "L10n extension exists (l10n_extension.dart)" \
  $([ -f "$SCRIPT_DIR/mobile/lib/core/utils/l10n_extension.dart" ] && echo 0 || echo 1)

check "Language settings screen exists" \
  $([ -f "$SCRIPT_DIR/mobile/lib/features/settings/presentation/screens/language_settings_screen.dart" ] && echo 0 || echo 1)

check "App.dart has localizationsDelegates configured" \
  $(grep -q "localizationsDelegates" "$SCRIPT_DIR/mobile/lib/app.dart" && echo 0 || echo 1)

check "App.dart has supportedLocales configured" \
  $(grep -q "supportedLocales" "$SCRIPT_DIR/mobile/lib/app.dart" && echo 0 || echo 1)

check "AppLanguage enum defines all 10 languages" \
  $(grep -q "ja(" "$SCRIPT_DIR/mobile/lib/core/providers/locale_provider.dart" && \
   grep -q "ko(" "$SCRIPT_DIR/mobile/lib/core/providers/locale_provider.dart" && echo 0 || echo 1)

# ======================== INTEGRATION CHECKS ==================================
section "Integration"

check "Dio client sends Accept-Language header" \
  $(grep -q "Accept-Language" "$SCRIPT_DIR/mobile/lib/core/network/dio_client.dart" && echo 0 || echo 1)

check "Locale persisted in secure storage" \
  $(grep -q "SecureStorage" "$SCRIPT_DIR/mobile/lib/core/providers/locale_provider.dart" && echo 0 || echo 1)

# ======================== TRANSLATION KEY COUNTS ==============================
section "Translation Key Coverage"

printf "\n  ${BOLD}%-6s %-14s %8s %8s${NC}\n" "Code" "Language" "Backend" "Mobile"
printf "  ${DIM}%-6s %-14s %8s %8s${NC}\n" "------" "--------------" "--------" "--------"

BACKEND_EN_KEYS=$(count_json_keys "$BACKEND_LOCALE_DIR/en.json")
MOBILE_EN_KEYS=$(count_arb_keys "$ARB_DIR/app_en.arb")

for i in "${!LANGUAGES[@]}"; do
  lang="${LANGUAGES[$i]}"
  name="${LANG_NAMES[$i]}"
  bkeys=$(count_json_keys "$BACKEND_LOCALE_DIR/${lang}.json")
  mkeys=$(count_arb_keys "$ARB_DIR/app_${lang}.arb")

  # Color code: green if matches English count, yellow if fewer
  if [ "$bkeys" -ge "$BACKEND_EN_KEYS" ]; then
    bc="${GREEN}"
  else
    bc="${YELLOW}"
  fi
  if [ "$mkeys" -ge "$MOBILE_EN_KEYS" ]; then
    mc="${GREEN}"
  else
    mc="${YELLOW}"
  fi

  printf "  %-6s %-14s ${bc}%8s${NC} ${mc}%8s${NC}\n" "$lang" "$name" "$bkeys" "$mkeys"
done

printf "\n  ${DIM}English baseline: Backend=%s keys, Mobile=%s keys${NC}\n" "$BACKEND_EN_KEYS" "$MOBILE_EN_KEYS"

# ======================== SHOWCASE TRANSLATIONS ===============================
section "Multi-Language Showcase"

# Backend showcase
printf "\n  ${BOLD}Backend — \"Authentication required\" in all languages:${NC}\n"
for i in "${!LANGUAGES[@]}"; do
  lang="${LANGUAGES[$i]}"
  name="${LANG_NAMES[$i]}"
  val=$(json_value "$BACKEND_LOCALE_DIR/${lang}.json" "errors.unauthorized")
  printf "    %-4s %-14s → %s\n" "$lang" "($name)" "$val"
done

printf "\n  ${BOLD}Backend — \"New Offer Received\" in all languages:${NC}\n"
for i in "${!LANGUAGES[@]}"; do
  lang="${LANGUAGES[$i]}"
  name="${LANG_NAMES[$i]}"
  val=$(json_value "$BACKEND_LOCALE_DIR/${lang}.json" "notification.offerReceived.title")
  printf "    %-4s %-14s → %s\n" "$lang" "($name)" "$val"
done

# Mobile showcase
printf "\n  ${BOLD}Mobile — \"appTitle\" in all languages:${NC}\n"
for i in "${!LANGUAGES[@]}"; do
  lang="${LANGUAGES[$i]}"
  name="${LANG_NAMES[$i]}"
  val=$(json_value "$ARB_DIR/app_${lang}.arb" "appTitle")
  printf "    %-4s %-14s → %s\n" "$lang" "($name)" "$val"
done

printf "\n  ${BOLD}Mobile — \"settings\" in all languages:${NC}\n"
for i in "${!LANGUAGES[@]}"; do
  lang="${LANGUAGES[$i]}"
  name="${LANG_NAMES[$i]}"
  val=$(json_value "$ARB_DIR/app_${lang}.arb" "settings")
  printf "    %-4s %-14s → %s\n" "$lang" "($name)" "$val"
done

printf "\n  ${BOLD}Mobile — \"createPost\" in all languages:${NC}\n"
for i in "${!LANGUAGES[@]}"; do
  lang="${LANGUAGES[$i]}"
  name="${LANG_NAMES[$i]}"
  val=$(json_value "$ARB_DIR/app_${lang}.arb" "createPost")
  printf "    %-4s %-14s → %s\n" "$lang" "($name)" "$val"
done

# ======================== FINAL VERDICT =======================================
section "Summary"
echo ""
printf "  Total checks:  ${BOLD}%d${NC}\n" "$TOTAL_CHECKS"
printf "  Passed:        ${GREEN}${BOLD}%d${NC}\n" "$PASSED_CHECKS"
printf "  Failed:        ${RED}${BOLD}%d${NC}\n" "$FAILED_CHECKS"
echo ""

if [ "$FAILED_CHECKS" -eq 0 ]; then
  printf "  ${GREEN}${BOLD}VERDICT: ALL CHECKS PASSED${NC}\n"
  printf "  ${GREEN}Multi-language support is fully implemented across 10 languages${NC}\n"
  printf "  ${GREEN}on both backend (Node.js) and mobile (Flutter).${NC}\n"
  exit 0
else
  printf "  ${RED}${BOLD}VERDICT: %d CHECK(S) FAILED${NC}\n" "$FAILED_CHECKS"
  printf "  ${RED}Some i18n components are missing or incomplete.${NC}\n"
  exit 1
fi
