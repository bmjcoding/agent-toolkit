#!/usr/bin/env bash
# Codex adapter: normalize stop-event fields, then delegate to root hooks/extract-handoff.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
# shellcheck source=../../../hooks/_adapter_lib.sh
source "${SCRIPT_DIR}/../../../hooks/_adapter_lib.sh"

read_adapter_input
NORMALIZED=$(normalize_handoff_payload)
[[ -n "${NORMALIZED}" ]] || exit 0

run_root_hook_with_input "extract-handoff" "${NORMALIZED}"
