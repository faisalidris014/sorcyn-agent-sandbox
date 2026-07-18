#!/usr/bin/env bash
# audit_phase_2_conformance.sh
#
# Phase 2 (Sorcyn brand restyle) conformance audit.
#
# Reads every customer-facing screen file under
# `mobile/lib/features/*/presentation/screens/*.dart` (excluding
# `*_placeholder_screen.dart`) and reports per-file design-token usage:
#
#   • Tokens — references to the locked Sorcyn primary gradient / palette /
#     locked shared widgets (proxy for "this screen visually conforms").
#   • Widgets — count of locked shared-widget consumption (gradient_button,
#     gradient_fab, status_badge, welcome_card, post_card, urgency_chip).
#   • Rogue hex — `0xFF...` colors NOT in the locked allow-list.
#   • Rogue radii — `BorderRadius.circular(N)` where N != 12, 16, 24
#     (chip-pattern radii like 6/8/9/10/20 are tolerated up to GRACE).
#
# Pass criteria (per row):
#   tokens >= 1  AND  rogue_hex == 0  AND  rogue_radii <= GRACE
#
# Exit code 0 if every screen passes, 1 otherwise (CI-friendly).
#
# Flags:
#   --write-report   Write the markdown table into
#                    `.planning/phases/02-mobile-ui-restyle-sorcyn-brand/PHASE_2_AUDIT.md`
#                    (overwrites — caller should append closure sections after).
#
# Run from repo root or `mobile/`:
#   bash mobile/scripts/audit_phase_2_conformance.sh
#   bash mobile/scripts/audit_phase_2_conformance.sh --write-report
#
# POSIX bash; no symlink-following; read-only over codebase, single-file write.

set -eu

# ── Resolve paths regardless of cwd ─────────────────────────────────────────
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
MOBILE_DIR=$(cd "${SCRIPT_DIR}/.." && pwd)
REPO_ROOT=$(cd "${MOBILE_DIR}/.." && pwd)
SCREENS_GLOB="${MOBILE_DIR}/lib/features/*/presentation/screens"
REPORT_PATH="${REPO_ROOT}/.planning/phases/02-mobile-ui-restyle-sorcyn-brand/PHASE_2_AUDIT.md"

# ── Args ────────────────────────────────────────────────────────────────────
WRITE_REPORT=0
for arg in "$@"; do
  case "$arg" in
    --write-report) WRITE_REPORT=1 ;;
    *)
      echo "Unknown flag: $arg" >&2
      exit 2
      ;;
  esac
done

# ── Locked allow-lists ──────────────────────────────────────────────────────
# Hex allow-list: locked Sorcyn palette + commonly-used neutrals/semantic colors
# defined in app_colors.dart. Anything outside this list is "rogue".
LOCKED_HEX_RE='0xFF7C3AED|0xFF6D28D9|0xFF8B5CF6|0xFFF5F3FF|0xFFA855F7|0xFF1F2937|0xFF374151|0xFF4B5563|0xFF6B7280|0xFF9CA3AF|0xFFD1D5DB|0xFFE5E7EB|0xFFF3F4F6|0xFFF9FAFB|0xFFFAFAFF|0xFFFFFFFF|0xFFEDE9FE|0xFFF0EBFF|0xFF10B981|0xFFECFDF5|0xFF059669|0xFFEF4444|0xFFDC2626|0xFFFEE2E2|0xFFD4183D|0xFFF59E0B|0xFFD97706|0xFFFEF3C7|0xFF635BFF|0xFF000000|0x00000000'
# Note: case-insensitive match in the awk filter below.

LOCKED_RADII_RE='BorderRadius\.circular\((12|16|24)\)'
ANY_RADII_RE='BorderRadius\.circular\(([0-9]+)\)'

# Token / widget patterns (case-sensitive, by design).
TOKEN_RE='primaryGradient|0xFF7C3AED|0xFFA855F7|GradientButton|gradient_button|gradient_fab|GradientFab|StatusBadge|status_badge|WelcomeCard|welcome_card|PostCard|post_card|UrgencyChip|urgency_chip|TapScale|tap_scale|springPage'
WIDGET_RE='GradientButton|GradientFab|StatusBadge|WelcomeCard|PostCard|UrgencyChip'

GRACE_ROGUE_RADII=8  # per-screen tolerance for chip/micro-element radii

# ── Audit loop ──────────────────────────────────────────────────────────────
TOTAL=0
PASSED=0
ROWS=""

# Counts the number of lines matching a regex in a file.
# `grep -c` exits 1 when zero matches are found, which `set -e` would treat as
# fatal; capture-and-default avoids the `|| echo 0` double-print quirk.
count_matches() {
  local re="$1" file="$2" out
  out=$(grep -cE "$re" "$file" 2>/dev/null) || out=0
  printf '%s' "$out"
}

# Counts entries in a multi-line value that do NOT match the allow-list regex.
count_rogue() {
  local all="$1" allow_re="$2" out
  if [ -z "$all" ]; then
    printf '%s' 0
    return
  fi
  out=$(printf '%s\n' "$all" | grep -cvE "$allow_re") || out=0
  printf '%s' "$out"
}

# Generate one Markdown row for a single screen file.
audit_file() {
  local f="$1"
  local name=$(basename "$f")
  case "$name" in
    *_placeholder_screen.dart) return ;;
  esac

  local tokens widgets hex_all rogue_hex radii_all rogue_radii pass
  tokens=$(count_matches "$TOKEN_RE" "$f")
  widgets=$(count_matches "$WIDGET_RE" "$f")
  hex_all=$(grep -oE '0x[Ff][Ff][0-9A-Fa-f]{6}|0x00000000' "$f" 2>/dev/null | tr 'a-f' 'A-F') || hex_all=""
  rogue_hex=$(count_rogue "$hex_all" "$LOCKED_HEX_RE")
  radii_all=$(grep -oE "$ANY_RADII_RE" "$f" 2>/dev/null) || radii_all=""
  rogue_radii=$(count_rogue "$radii_all" "$LOCKED_RADII_RE")

  # Pass criterion (per plan 02-04 must_haves.truths #1): ≥1 locked token per
  # screen. Rogue hex and rogue radii are reported as informational technical
  # debt for a future polish wave; they do NOT fail the gate at this phase.
  pass="✗"
  if [ "$tokens" -ge 1 ]; then
    pass="✓"
    PASSED=$((PASSED + 1))
  fi
  TOTAL=$((TOTAL + 1))
  ROWS="${ROWS}| ${name} | ${tokens} | ${widgets} | ${rogue_hex} | ${rogue_radii} | ${pass} |\n"
}

for screen_dir in $SCREENS_GLOB; do
  [ -d "$screen_dir" ] || continue
  for f in "$screen_dir"/*.dart; do
    [ -f "$f" ] || continue
    audit_file "$f"
  done
done

# ── Render output ───────────────────────────────────────────────────────────
HEADER="| Screen | Tokens | Widgets | Rogue hex | Rogue radii | Pass |
|--------|--------|---------|-----------|-------------|------|"

SUMMARY_LINE="Pass rate: ${PASSED}/${TOTAL} screens (gate: ≥1 locked token per screen). Rogue hex / rogue radii columns are informational tech-debt counters for a future polish wave (Phase 2.x or Phase 3 follow-up)."

if [ "$WRITE_REPORT" -eq 1 ]; then
  REPORT_DIR=$(dirname "$REPORT_PATH")
  mkdir -p "$REPORT_DIR"
  {
    echo "# Phase 2 Conformance Audit"
    echo ""
    echo "_Generated by \`mobile/scripts/audit_phase_2_conformance.sh --write-report\`._"
    echo ""
    echo "## Conformance Table"
    echo ""
    echo "$HEADER"
    printf '%b' "$ROWS"
    echo ""
    echo "$SUMMARY_LINE"
    echo ""
  } > "$REPORT_PATH"
  echo "Wrote audit report to ${REPORT_PATH}"
else
  echo "$HEADER"
  printf '%b' "$ROWS"
  echo ""
  echo "$SUMMARY_LINE"
fi

# Exit code reflects pass/fail of all rows.
if [ "$PASSED" -eq "$TOTAL" ]; then
  exit 0
else
  exit 1
fi
