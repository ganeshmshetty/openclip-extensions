#!/bin/zsh

zmodload zsh/datetime 2>/dev/null || true
start_time="${EPOCHREALTIME:-0}"
min_duration=0.45

# Read selection from OPENCLIP_TEXT or stdin
cmd="${OPENCLIP_TEXT:-$(cat)}"
cmd="$(echo "$cmd" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
if [ -z "$cmd" ]; then
    exit 0
fi

# Add common user binary paths to PATH so user CLIs (Homebrew, Cargo, Go, pipx, nvm) are found
for candidate in /opt/homebrew/bin /opt/homebrew/sbin /usr/local/bin /usr/local/sbin "$HOME/.cargo/bin" "$HOME/.local/bin" "$HOME/go/bin"; do
    if [ -d "$candidate" ]; then
        case ":$PATH:" in
            *":$candidate:"*) ;;
            *) PATH="$candidate:$PATH" ;;
        esac
    fi
done
export PATH

action_id="${OPENCLIP_ACTION_ID:-com.openclip.quickshell.action.0}"

get_option() {
    local opt_id="$1"
    local default_val="$2"
    local val=""
    for aid in "${action_id}" "com.openclip.quickshell.action.0" "com.openclip.quickshell"; do
        val="$(defaults read com.openclip.OpenClip "action.${aid}.option.${opt_id}" 2>/dev/null || true)"
        if [ -n "$val" ]; then
            break
        fi
    done
    if [ -n "$val" ]; then
        echo "$val"
    else
        echo "$default_val"
    fi
}

prepend_cmd="$(get_option "prepend" "")"
append_cmd="$(get_option "append" "")"

final_cmd="$cmd"
if [ -n "$prepend_cmd" ]; then
    final_cmd="${prepend_cmd} ${final_cmd}"
fi
if [ -n "$append_cmd" ]; then
    final_cmd="${final_cmd} ${append_cmd}"
fi

tmp_out="$(mktemp -t quickshell-out)"
tmp_err="$(mktemp -t quickshell-err)"
trap 'rm -f "$tmp_out" "$tmp_err"' EXIT INT TERM

# Run silently in user's home directory
cd "$HOME" || true
/bin/zsh -c "$final_cmd" < /dev/null > "$tmp_out" 2> "$tmp_err"
exit_code=$?

# Adaptive timing: ensure loading state stays visible for at least min_duration to prevent flicker
if [ -n "$start_time" ] && [ "$start_time" != "0" ]; then
    end_time="${EPOCHREALTIME:-0}"
    elapsed=$(( end_time - start_time ))
    if (( elapsed < min_duration )); then
        remaining=$(( min_duration - elapsed ))
        sleep $remaining
    fi
fi

# Error case: write concise error line to stderr and exit non-zero
if [ $exit_code -ne 0 ]; then
    err_content="$(cat "$tmp_err")"
    if [ -z "$(echo "$err_content" | tr -d '[:space:]')" ]; then
        err_content="$(cat "$tmp_out")"
    fi

    first_line="$(echo "$err_content" | grep -m 1 -v '^[[:space:]]*$')"
    last_line="$(echo "$err_content" | awk 'NF{p=$0} END{print p}')"

    err_summary="$first_line"
    if [ -n "$last_line" ] && echo "$last_line" | grep -qiE "error|exception|fail|fatal|denied|invalid"; then
        err_summary="$last_line"
    fi

    err_summary="$(echo "$err_summary" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    if [ -z "$err_summary" ]; then
        err_summary="Command failed with exit code $exit_code"
    fi

    if [ ${#err_summary} -gt 120 ]; then
        err_summary="${err_summary[1,117]}..."
    fi

    >&2 echo "$err_summary"
    exit $exit_code
fi

exit 0
