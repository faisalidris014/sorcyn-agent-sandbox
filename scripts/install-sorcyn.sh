#!/usr/bin/env bash
# install-sorcyn — symlinks the sorcyn launcher into ~/.local/bin and persists
# the project path. Idempotent. If ~/.local/bin is not on PATH, asks before
# appending the export line to the user's shell rc (zsh / bash).
# Non-interactive runs (no TTY) skip the prompt and just print instructions.

set -eu

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
DIM='\033[2m'
RESET='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAUNCHER="$REPO_ROOT/scripts/sorcyn"
BIN_DIR="$HOME/.local/bin"
LINK="$BIN_DIR/sorcyn"

if [ ! -f "$REPO_ROOT/.sorcyn-root" ]; then
  echo "✗ Missing .sorcyn-root marker at $REPO_ROOT — are you running this from the wrong repo?" >&2
  exit 1
fi
if [ ! -x "$LAUNCHER" ]; then
  chmod +x "$LAUNCHER"
fi

mkdir -p "$BIN_DIR"

if [ -L "$LINK" ] && [ "$(readlink "$LINK")" = "$LAUNCHER" ]; then
  printf "${GREEN}✓${RESET} Already linked: %s → %s\n" "$LINK" "$LAUNCHER"
elif [ -e "$LINK" ]; then
  printf "${YELLOW}!${RESET} %s exists and is not our symlink — leaving it alone.\n" "$LINK"
  printf "  Either remove it manually or create an alias instead.\n"
  exit 1
else
  ln -s "$LAUNCHER" "$LINK"
  printf "${GREEN}✓${RESET} Linked %s → %s\n" "$LINK" "$LAUNCHER"
fi

mkdir -p "$HOME/.sorcyn"
printf "%s\n" "$REPO_ROOT" > "$HOME/.sorcyn/config"
printf "${GREEN}✓${RESET} Saved project path to ~/.sorcyn/config\n"

case ":${PATH}:" in
  *":$BIN_DIR:"*) on_path=1 ;;
  *)              on_path=0 ;;
esac

if [ "$on_path" -eq 1 ]; then
  printf "\n${GREEN}✓ Installed.${RESET} Try: ${YELLOW}sorcyn help${RESET}\n"
  exit 0
fi

# ~/.local/bin not on PATH — figure out which shell rc to target.
PATH_LINE='export PATH="$HOME/.local/bin:$PATH"'

shell_basename="$(basename "${SHELL:-}")"
case "$shell_basename" in
  zsh)   RC_FILE="$HOME/.zshrc" ;;
  bash)  RC_FILE="$HOME/.bashrc" ;;
  *)     RC_FILE="$HOME/.zshrc" ;;  # default to zsh on macOS
esac

printf "\n${YELLOW}!${RESET} %s is not on your PATH yet.\n" "$BIN_DIR"

# Already present? Just remind the user to reload.
if [ -f "$RC_FILE" ] && grep -Fxq "$PATH_LINE" "$RC_FILE"; then
  printf "  The PATH line is already in %s — reload your shell:\n\n" "$RC_FILE"
  printf "    ${DIM}source %s${RESET}\n" "$RC_FILE"
  exit 0
fi

# Non-interactive (no TTY): print instructions only, don't prompt.
if [ ! -t 0 ]; then
  printf "  Add this line to %s:\n\n" "$RC_FILE"
  printf "    ${DIM}%s${RESET}\n\n" "$PATH_LINE"
  printf "  Then reload: ${DIM}source %s${RESET}\n" "$RC_FILE"
  exit 0
fi

# Interactive prompt.
printf "  Append it to %s now? [Y/n] " "$RC_FILE"
read -r answer
case "${answer:-Y}" in
  [Nn]|[Nn][Oo])
    printf "\n  Add this line to %s yourself:\n\n" "$RC_FILE"
    printf "    ${DIM}%s${RESET}\n\n" "$PATH_LINE"
    printf "  Then reload: ${DIM}source %s${RESET}\n" "$RC_FILE"
    exit 0
    ;;
esac

# Yes — append with a comment so it's traceable. Ensure file ends with newline.
mkdir -p "$(dirname "$RC_FILE")"
touch "$RC_FILE"
if [ -s "$RC_FILE" ] && [ "$(tail -c 1 "$RC_FILE" | wc -l)" -eq 0 ]; then
  printf "\n" >> "$RC_FILE"
fi
{
  printf "\n# Added by sorcyn install-sorcyn.sh — puts ~/.local/bin on PATH for the sorcyn launcher\n"
  printf "%s\n" "$PATH_LINE"
} >> "$RC_FILE"
printf "${GREEN}✓${RESET} Appended PATH line to %s\n" "$RC_FILE"
printf "\n${GREEN}✓ Installed.${RESET} Reload your shell to pick it up:\n"
printf "    ${DIM}source %s${RESET}\n" "$RC_FILE"
printf "  …or just open a new terminal tab. Then try: ${YELLOW}sorcyn help${RESET}\n"
