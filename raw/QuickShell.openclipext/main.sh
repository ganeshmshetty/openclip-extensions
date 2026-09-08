#!/bin/zsh

# Read selection from OPENCLIP_TEXT or stdin
cmd="${OPENCLIP_TEXT:-$(cat)}"
# Trim leading and trailing whitespace
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

action_id="${OPENCLIP_ACTION_ID:-com.openclip.quickshell.run}"

get_option() {
    local opt_id="$1"
    local default_val="$2"
    local env_var="OPENCLIP_OPTION_${(U)opt_id}"
    local val="${(P)env_var:-}"
    if [ -z "$val" ]; then
        val="$(defaults read com.openclip.OpenClip "action.${action_id}.option.${opt_id}" 2>/dev/null || true)"
    fi
    if [ -n "$val" ]; then
        echo "$val"
    else
        echo "$default_val"
    fi
}

output_mode="$(get_option "output" "Paste")"
prepend_cmd="$(get_option "prepend" "")"
append_cmd="$(get_option "append" "")"

final_cmd="$cmd"
if [ -n "$prepend_cmd" ]; then
    final_cmd="${prepend_cmd} ${final_cmd}"
fi
if [ -n "$append_cmd" ]; then
    final_cmd="${final_cmd} ${append_cmd}"
fi

json_quote() {
    /usr/bin/osascript -l JavaScript -e 'function run(argv) { return JSON.stringify(argv[0] || ""); }' -- "$1"
}

tmp_out="$(mktemp -t quickshell-out)"
tmp_err="$(mktemp -t quickshell-err)"
trap 'rm -f "$tmp_out" "$tmp_err"' EXIT INT TERM

# Run silently in user's home directory
cd "$HOME" || true
/bin/zsh -c "$final_cmd" < /dev/null > "$tmp_out" 2> "$tmp_err"
exit_code=$?

# Error case: command exited non-zero
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

    err_json="$(json_quote "$err_summary")"
    printf '{"type":"toast","message":%s,"style":"error"}\n' "$err_json"
    exit 0
fi

# Success case
raw_stdout="$(cat "$tmp_out")"
if [ -n "$raw_stdout" ]; then
    raw_stdout="${raw_stdout%$'\n'}"
fi

case "$output_mode" in
    Paste|paste)
        if [ -n "$raw_stdout" ]; then
            out_json="$(json_quote "$raw_stdout")"
            printf '{"type":"paste","value":%s}\n' "$out_json"
        else
            printf '{"type":"toast","message":"Command completed","style":"success"}\n'
        fi
        ;;
    Copy|copy)
        if [ -n "$raw_stdout" ]; then
            out_json="$(json_quote "$raw_stdout")"
            printf '{"type":"sequence","actions":[{"type":"copy","value":%s},{"type":"toast","message":"Output copied to clipboard","style":"success"}]}\n' "$out_json"
        else
            printf '{"type":"toast","message":"Command completed (no output)","style":"info"}\n'
        fi
        ;;
    Toast|toast)
        if [ -n "$raw_stdout" ]; then
            toast_summary="$raw_stdout"
            first_line="$(echo "$raw_stdout" | grep -m 1 -v '^[[:space:]]*$')"
            if [ -n "$first_line" ]; then
                toast_summary="$first_line"
            fi
            toast_summary="$(echo "$toast_summary" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
            if [ ${#toast_summary} -gt 120 ]; then
                toast_summary="${toast_summary[1,117]}..."
            fi
            out_json="$(json_quote "$toast_summary")"
            printf '{"type":"toast","message":%s,"style":"info"}\n' "$out_json"
        else
            printf '{"type":"toast","message":"Command completed (no output)","style":"info"}\n'
        fi
        ;;
    Discard|discard|*)
        printf '{"type":"toast","message":"Command completed","style":"success"}\n'
        ;;
esac

exit 0
