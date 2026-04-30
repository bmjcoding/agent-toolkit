#!/usr/bin/env bash
# Codex adapter: delegate directly to the canonical root drift-check hook.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
# shellcheck source=../../../hooks/_adapter_lib.sh
source "${SCRIPT_DIR}/../../../hooks/_adapter_lib.sh"

run_root_hook "drift-check"
