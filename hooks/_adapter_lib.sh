#!/usr/bin/env bash
# Shared helper functions for tool-local hook adapters that delegate to root hooks/.

set -uo pipefail

AGENT_TOOLKIT_REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." && pwd -P)"

hook_script_path() {
  local hook="$1"
  printf '%s/hooks/%s/%s.sh\n' "${AGENT_TOOLKIT_REPO_DIR}" "${hook}" "${hook}"
}

read_adapter_input() {
  ADAPTER_INPUT=$(cat)
  export ADAPTER_INPUT
}

json_value() {
  local expr="$1"
  printf '%s' "${ADAPTER_INPUT:-}" | jq -r "${expr} // empty" 2>/dev/null
}

extract_tool_name() {
  json_value '.tool_name // .toolName // .tool // .name // .event.tool_name // .event.toolName // .data.tool_name // .data.toolName'
}

extract_command() {
  json_value '.tool_input.command // .toolInput.command // .input.command // .inputs.command // .command // .tool_input.cmd // .toolInput.cmd // .data.command'
}

extract_file_path() {
  json_value '.tool_input.file_path // .tool_input.path // .toolInput.filePath // .toolInput.path // .input.filePath // .input.path // .filePath // .file_path // .path // .targetPath // .target_path // .destinationPath // .destination_path'
}

normalize_edit_tool_name() {
  case "$1" in
    Write|write|create_file|createFile|write_file|writeFile)
      echo "Write"
      ;;
    Edit|edit|replace_string_in_file|replaceStringInFile|editFiles|editFile|insert_edit_into_file|insertEditIntoFile|apply_edits|applyEdits)
      echo "Edit"
      ;;
    *)
      echo ""
      ;;
  esac
}

normalize_command_payload() {
  local command="$1"
  jq -n --arg cmd "${command}" '{
    tool_name: "Bash",
    tool_input: {
      command: $cmd
    }
  }'
}

normalize_edit_payload() {
  local tool="$1"
  local file="$2"
  jq -n --arg tool "${tool}" --arg file "${file}" '{
    tool_name: $tool,
    tool_input: {
      file_path: $file
    }
  }'
}

normalize_handoff_payload() {
  printf '%s' "${ADAPTER_INPUT:-}" | jq -c '{
    agent_id: (.agent_id // .agentId // .session_id // .sessionId // .agent.id // .session.id // "unknown"),
    agent_type: (.agent_type // .agentType // .agent_id // .agentId // .agent.id // "unknown"),
    last_assistant_message: (.last_assistant_message // .lastAssistantMessage // .assistantMessage // .final_message // .finalMessage // .message // ""),
    usage: (.usage // .metrics // {})
  }' 2>/dev/null
}

emit_deny() {
  local reason="$1"
  jq -n --arg reason "${reason}" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

run_root_hook() {
  local hook="$1"
  shift
  "$(hook_script_path "${hook}")" "$@"
}

run_root_hook_with_input() {
  local hook="$1"
  local input="$2"
  shift 2
  printf '%s' "${input}" | "$(hook_script_path "${hook}")" "$@"
}

is_git_push_command() {
  printf '%s\n' "$1" | grep -qE '^[[:space:]]*git[[:space:]]+push(\b|[[:space:]])'
}

is_git_commit_or_push_command() {
  printf '%s\n' "$1" | grep -qE '^[[:space:]]*git[[:space:]]+(commit|push)(\b|[[:space:]])'
}

is_protected_file_path() {
  printf '%s\n' "$1" | grep -qE '(^|/)(settings\.json|CLAUDE\.md|statusline-command\.sh)$|(^|/)\.claude/(settings\.json|hooks/|CLAUDE\.md|agents/|statusline-command\.sh)|(^|/)claude-code/(agents|commands|hooks)/|(^|/)(hooks|skills|rules)/[^/]+/[^/]+|(^|/)\.orchestrator/(logs/|session\.id|sessions/[0-9]{8}T[0-9]{6}/logs/)|(^|/)hookify[^/]*\.local\.md$'
}

derive_push_context() {
  local command="$1"
  local current_branch remote remote_branch remote_url local_refspec local_ref local_sha remote_ref remote_sha
  local expect_value_for_option=0
  local refspec=""

  command=$(printf '%s' "${command}" | tr '\n' ' ')
  read -r -a tokens <<< "${command}"
  [[ ${#tokens[@]} -ge 2 ]] || return 1
  [[ "${tokens[0]}" == "git" && "${tokens[1]}" == "push" ]] || return 1

  current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)
  [[ -n "${current_branch}" && "${current_branch}" != "HEAD" ]] || return 1

  remote=""
  for (( idx=2; idx<${#tokens[@]}; idx++ )); do
    token="${tokens[idx]}"
    if [[ "${expect_value_for_option}" -eq 1 ]]; then
      expect_value_for_option=0
      continue
    fi

    case "${token}" in
      -u|--set-upstream|--repo|--receive-pack|--exec)
        expect_value_for_option=1
        continue
        ;;
      --force|--force-with-lease|--tags|--follow-tags|--quiet|--verbose|--dry-run|--no-verify)
        continue
        ;;
      -*)
        continue
        ;;
    esac

    if [[ -z "${remote}" ]]; then
      remote="${token}"
      continue
    fi

    if [[ -z "${refspec}" ]]; then
      refspec="${token}"
      break
    fi
  done

  if [[ -n "${remote}" ]] && ! git remote get-url "${remote}" >/dev/null 2>&1; then
    refspec="${remote}"
    remote=""
  fi

  if [[ -z "${remote}" ]]; then
    remote=$(git config --get "branch.${current_branch}.remote" 2>/dev/null || true)
  fi
  [[ -n "${remote}" ]] || remote="origin"

  remote_branch=$(git config --get "branch.${current_branch}.merge" 2>/dev/null | sed 's#refs/heads/##')
  [[ -n "${remote_branch}" ]] || remote_branch="${current_branch}"

  local_refspec="${current_branch}"
  if [[ -n "${refspec}" ]]; then
    if [[ "${refspec}" == "HEAD" ]]; then
      local_refspec="${current_branch}"
      remote_branch="${current_branch}"
    elif [[ "${refspec}" == *:* ]]; then
      local_refspec="${refspec%%:*}"
      remote_branch="${refspec##*:}"
      [[ "${local_refspec}" == "HEAD" ]] && local_refspec="${current_branch}"
      [[ "${remote_branch}" == "HEAD" ]] && remote_branch="${current_branch}"
    else
      local_refspec="${refspec}"
      remote_branch="${refspec}"
    fi
  fi

  [[ -n "${local_refspec}" ]] || local_refspec="${current_branch}"
  [[ -n "${remote_branch}" ]] || remote_branch="${current_branch}"

  local_sha=$(git rev-parse "${local_refspec}" 2>/dev/null || true)
  [[ -n "${local_sha}" ]] || local_sha=$(git rev-parse HEAD 2>/dev/null || true)
  [[ -n "${local_sha}" ]] || return 1

  local_ref="refs/heads/${current_branch}"
  remote_ref="refs/heads/${remote_branch}"
  remote_sha=$(git rev-parse "refs/remotes/${remote}/${remote_branch}" 2>/dev/null || true)
  [[ -n "${remote_sha}" ]] || remote_sha="0000000000000000000000000000000000000000"
  remote_url=$(git remote get-url "${remote}" 2>/dev/null || true)
  [[ -n "${remote_url}" ]] || remote_url="${remote}"

  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "${remote}" "${remote_url}" "${local_ref}" "${local_sha}" "${remote_ref}" "${remote_sha}"
}
