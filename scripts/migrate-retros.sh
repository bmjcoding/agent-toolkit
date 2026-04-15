#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/migrate-retros.sh [--dry-run | --copy | --move | --symlink] [--source DIR] [--dest DIR]

Migrate legacy retro storage into the canonical retro root.

Defaults:
  source: ~/.claude/retros
  dest:   ${AGENT_RETRO_DIR:-~/agent-retros}

Modes:
  --dry-run  Show what would happen (default)
  --copy     Copy legacy retros into the canonical root
  --move     Move the legacy directory to the canonical root (requires dest to be absent or empty)
  --symlink  Copy-first if needed, back up the legacy directory, then replace it with a symlink
EOF
}

MODE="dry-run"
SOURCE="$HOME/.claude/retros"
DEST="${AGENT_RETRO_DIR:-$HOME/agent-retros}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run|--copy|--move|--symlink)
      MODE="${1#--}"
      shift
      ;;
    --source)
      SOURCE="$2"
      shift 2
      ;;
    --dest)
      DEST="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown option: %s\n\n' "$1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

SOURCE="${SOURCE/#\~/$HOME}"
DEST="${DEST/#\~/$HOME}"
TIMESTAMP="$(date '+%Y%m%dT%H%M%S')"

run() {
  if [[ "$MODE" == "dry-run" ]]; then
    printf 'DRY-RUN: %s\n' "$*"
    return 0
  fi
  "$@"
}

if [[ "$SOURCE" == "$DEST" ]]; then
  printf 'Source and destination are the same path: %s\n' "$SOURCE"
  exit 0
fi

printf 'Legacy source: %s\n' "$SOURCE"
printf 'Canonical dest: %s\n' "$DEST"
printf 'Mode: %s\n' "$MODE"

case "$MODE" in
  dry-run)
    if [[ -e "$SOURCE" ]]; then
      printf 'DRY-RUN: would create %s if needed\n' "$DEST"
      printf 'DRY-RUN: would inspect/copy legacy retros from %s\n' "$SOURCE"
    else
      printf 'DRY-RUN: legacy source does not exist; would only create %s on demand\n' "$DEST"
    fi
    ;;

  copy)
    if [[ ! -d "$SOURCE" ]]; then
      printf 'Source directory not found: %s\n' "$SOURCE" >&2
      exit 1
    fi
    run mkdir -p "$DEST"
    run cp -R "$SOURCE/." "$DEST/"
    printf 'Copied retros into %s\n' "$DEST"
    ;;

  move)
    if [[ ! -e "$SOURCE" ]]; then
      printf 'Source directory not found: %s\n' "$SOURCE" >&2
      exit 1
    fi
    if [[ -d "$DEST" ]] && [[ -n "$(find "$DEST" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]]; then
      printf 'Destination must be absent or empty for --move: %s\n' "$DEST" >&2
      exit 1
    fi
    run mkdir -p "$(dirname "$DEST")"
    run mv "$SOURCE" "$DEST"
    printf 'Moved retros to %s\n' "$DEST"
    ;;

  symlink)
    run mkdir -p "$DEST"

    if [[ -L "$SOURCE" ]]; then
      printf 'Legacy source is already a symlink: %s\n' "$SOURCE"
      exit 0
    fi

    if [[ -d "$SOURCE" ]]; then
      if [[ -z "$(find "$DEST" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]]; then
        run cp -R "$SOURCE/." "$DEST/"
      fi
      BACKUP="${SOURCE}.bak-${TIMESTAMP}"
      run mv "$SOURCE" "$BACKUP"
      run ln -s "$DEST" "$SOURCE"
      printf 'Backed up legacy retros to %s and created symlink -> %s\n' "$BACKUP" "$DEST"
    elif [[ ! -e "$SOURCE" ]]; then
      run mkdir -p "$(dirname "$SOURCE")"
      run ln -s "$DEST" "$SOURCE"
      printf 'Created legacy compatibility symlink %s -> %s\n' "$SOURCE" "$DEST"
    else
      printf 'Source exists but is not a directory: %s\n' "$SOURCE" >&2
      exit 1
    fi
    ;;
esac
