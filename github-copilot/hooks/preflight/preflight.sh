#!/usr/bin/env bash
# VS Code Copilot adapter: delegate directly to the canonical root preflight hook.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
# shellcheck source=../../../hooks/_adapter_lib.sh
source "${SCRIPT_DIR}/../../../hooks/_adapter_lib.sh"

run_root_hook "preflight"
