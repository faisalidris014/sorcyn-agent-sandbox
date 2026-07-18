#!/usr/bin/env bash
# Run the Flutter app on a physical device pointing at the Mac's LAN IP.
#
# Why this exists:
#   - iOS simulator + Android emulator + web share the host network stack,
#     so EnvConfig defaults to http://localhost:3000/api/v1 (or 10.0.2.2
#     for Android emulator) and "just works."
#   - A physical phone is on the LAN, not the host loopback. It must hit
#     the Mac's LAN IP (e.g. http://192.168.1.251:3000/api/v1), which
#     changes every time the Mac joins a new Wi-Fi network — too fragile
#     to hard-code as a default.
#
# What this does:
#   - Resolves the Mac's current Wi-Fi LAN IP (en0, falls back to en1).
#   - Runs `flutter run` with --dart-define=API_BASE_URL pointing there.
#   - Forwards any extra args (e.g. `-d <device-id>`, `--profile`).
#
# Production safety:
#   --dart-define is a build-time flag that only affects this invocation.
#   It does NOT change EnvConfig defaults, does NOT touch the backend, and
#   has zero effect on `flutter build ipa` release artifacts — those bake
#   in whatever API_BASE_URL the release CI/CD pipeline passes (typically
#   the prod API). Use this script freely for dev work without worrying
#   about leaking dev URLs into a production build.
#
# Prerequisites:
#   - Backend running locally (`cd backend && npm run dev`). The server
#     binds to 0.0.0.0:3000 so it serves both localhost and the LAN IP
#     simultaneously — sim and physical device can run at the same time.
#   - Mac firewall must allow inbound on port 3000. If physical-device
#     requests time out but Safari on the device can load
#     http://<mac-lan-ip>:3000/health, the firewall is the issue:
#       System Settings → Network → Firewall → Options → allow `node`
#       (or temporarily turn the firewall off for testing).
#   - The phone must be on the same Wi-Fi network as the Mac.
#
# Usage:
#   ./mobile/scripts/run-device.sh                    # picks Flutter's first device
#   ./mobile/scripts/run-device.sh -d <device-id>     # target a specific device
#   ./mobile/scripts/run-device.sh --profile          # profile mode
set -euo pipefail

LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [ -z "${LAN_IP}" ]; then
  LAN_IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
fi
if [ -z "${LAN_IP}" ]; then
  echo "ERROR: Could not resolve a Mac LAN IP from en0 or en1." >&2
  echo "Are you connected to Wi-Fi? Try \`ipconfig getifaddr en0\` manually." >&2
  exit 1
fi

API_BASE_URL="http://${LAN_IP}:3000/api/v1"
echo "Mac LAN IP : ${LAN_IP}"
echo "API target : ${API_BASE_URL}"
echo

cd "$(dirname "$0")/.."
exec flutter run --dart-define=API_BASE_URL="${API_BASE_URL}" "$@"
