#!/bin/zsh

cmd="${OPENCLIP_TEXT:-$(cat)}"
# Trim leading and trailing whitespace
cmd="$(echo "$cmd" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
if [ -z "$cmd" ]; then
    exit 0
fi

action_id="${OPENCLIP_ACTION_ID:-com.openclip.runcommand.action.0}"

get_option() {
    local opt_id="$1"
    local default_val="$2"
    local val
    val="$(defaults read com.openclip.OpenClip "action.${action_id}.option.${opt_id}" 2>/dev/null || true)"
    if [ -n "$val" ]; then
        echo "$val"
    else
        echo "$default_val"
    fi
}

target_term="$(get_option "term" "Auto-detect")"
prepend_cmd="$(get_option "prepend" "")"
append_cmd="$(get_option "append" "")"
new_tab="$(get_option "newtab" "false")"

final_cmd="$cmd"
if [ -n "$prepend_cmd" ]; then
    final_cmd="${prepend_cmd} ${final_cmd}"
fi
if [ -n "$append_cmd" ]; then
    final_cmd="${final_cmd} ${append_cmd}"
fi

detect_terminal() {
    local front_app
    front_app="$(osascript -e 'tell application "System Events" to get name of first process whose frontmost is true' 2>/dev/null || true)"
    case "$front_app" in
        Ghostty) echo "Ghostty"; return ;;
        iTerm2|iTerm) echo "iTerm2"; return ;;
        Warp) echo "Warp"; return ;;
        kitty) echo "kitty"; return ;;
        cmux) echo "cmux"; return ;;
        Terminal) echo "Terminal"; return ;;
    esac

    if pgrep -x "ghostty" >/dev/null 2>&1; then echo "Ghostty"; return; fi
    if pgrep -x "iTerm2" >/dev/null 2>&1; then echo "iTerm2"; return; fi
    if pgrep -x "Warp" >/dev/null 2>&1; then echo "Warp"; return; fi
    if pgrep -x "kitty" >/dev/null 2>&1; then echo "kitty"; return; fi
    if pgrep -x "cmux" >/dev/null 2>&1; then echo "cmux"; return; fi
    if pgrep -x "Terminal" >/dev/null 2>&1; then echo "Terminal"; return; fi

    echo "Terminal"
}

if [ "$target_term" = "Auto-detect" ] || [ -z "$target_term" ]; then
    emulator="$(detect_terminal)"
else
    emulator="$target_term"
fi

fallback_exec() {
    local target_app="$1"
    local command_to_run="$2"
    local tmp
    tmp="$(mktemp -t openclip-cmd).command"
    cat << 'EOF' > "$tmp"
#!/bin/zsh
rm -f "$0"
trap 'exec ${SHELL:-/bin/zsh}' INT
EOF
    printf "%s\n" "$command_to_run" >> "$tmp"
    cat << 'EOF' >> "$tmp"
exec ${SHELL:-/bin/zsh}
EOF
    chmod +x "$tmp"

    case "$target_app" in
        Ghostty)
            if [ -x "/Applications/Ghostty.app/Contents/MacOS/ghostty" ]; then
                /Applications/Ghostty.app/Contents/MacOS/ghostty -e "$tmp" &
            else
                open -a Ghostty "$tmp" 2>/dev/null || open "$tmp"
            fi
            ;;
        iTerm2|iTerm)
            open -a iTerm "$tmp" 2>/dev/null || open "$tmp"
            ;;
        Warp)
            open -a Warp "$tmp" 2>/dev/null || open "$tmp"
            ;;
        kitty)
            open -a kitty "$tmp" 2>/dev/null || open "$tmp"
            ;;
        cmux)
            open -a cmux "$tmp" 2>/dev/null || open "$tmp"
            ;;
        *)
            open "$tmp"
            ;;
    esac
}

send_to_terminal() {
    osascript - "$1" "$2" >/dev/null << 'EOF'
on run argv
    set cmd to item 1 of argv
    set useNewTab to (item 2 of argv is "true")
    tell application "Terminal"
        activate
        if (count of windows) is 0 then
            do script ""
            set useNewTab to false
        end if
        if useNewTab then
            tell application "System Events"
                tell process "Terminal"
                    keystroke "t" using command down
                end tell
            end tell
            delay 0.3
        end if
        set theTab to selected tab in first window
        do script cmd in theTab
    end tell
end run
EOF
}

send_to_iterm() {
    osascript - "$1" "$2" >/dev/null << 'EOF'
on run argv
    set cmd to item 1 of argv
    set useNewTab to (item 2 of argv is "true")
    tell application "iTerm"
        activate
        if (count of windows) is 0 then
            create window with default profile
            set useNewTab to false
        end if
        if useNewTab then
            tell current window
                create tab with default profile
            end tell
        end if
        tell current session of current tab of current window
            write text cmd
        end tell
    end tell
end run
EOF
}

send_to_warp() {
    osascript - "$1" "$2" >/dev/null << 'EOF'
on run argv
    set cmd to item 1 of argv
    set useNewTab to (item 2 of argv is "true")
    tell application "Warp"
        activate
        tell application "System Events"
            tell process "Warp"
                set frontmost to true
            end tell
        end tell
    end tell
    if useNewTab then
        tell application "System Events"
            tell process "Warp"
                keystroke "t" using command down
            end tell
        end tell
        delay 0.2
    end if
    tell application "System Events"
        tell process "Warp"
            delay 0.1
            set prevClipboard to the clipboard
            set the clipboard to cmd
            delay 0.05
            keystroke "v" using {command down}
            delay 0.05
            key code 36
            if prevClipboard is not missing value then
                set the clipboard to prevClipboard
            end if
        end tell
    end tell
end run
EOF
}

send_to_ghostty() {
    osascript - "$1" "$2" >/dev/null << 'EOF'
on run argv
    set cmd to item 1 of argv
    set useNewTab to (item 2 of argv is "true")
    tell application id "com.mitchellh.ghostty"
        activate
        tell application "System Events"
            tell process "Ghostty"
                if (count of windows) is 0 then
                    tell application id "com.mitchellh.ghostty" to reopen
                end if
                set frontmost to true
            end tell
        end tell
    end tell
    if useNewTab then
        tell application "System Events"
            tell process "Ghostty"
                keystroke "t" using command down
            end tell
        end tell
        delay 0.1
    end if
    tell application "System Events"
        tell process "Ghostty"
            delay 0.1
            set prevClipboard to the clipboard
            set the clipboard to cmd
            delay 0.05
            keystroke "v" using {command down}
            delay 0.05
            key code 36
            if prevClipboard is not missing value then
                set the clipboard to prevClipboard
            end if
        end tell
    end tell
end run
EOF
}

send_to_kitty() {
    osascript - "$1" "$2" >/dev/null << 'EOF'
on run argv
    set cmd to item 1 of argv
    set useNewTab to (item 2 of argv is "true")
    tell application id "net.kovidgoyal.kitty"
        activate
        tell application "System Events"
            tell process "kitty"
                if (count of windows) is 0 then
                    tell application id "net.kovidgoyal.kitty" to reopen
                end if
                set frontmost to true
            end tell
        end tell
    end tell
    if useNewTab then
        tell application "System Events"
            tell process "kitty"
                keystroke "t" using command down
            end tell
        end tell
        delay 0.1
    end if
    tell application "System Events"
        tell process "kitty"
            delay 0.1
            set prevClipboard to the clipboard
            set the clipboard to cmd
            delay 0.05
            keystroke "v" using {command down}
            delay 0.05
            key code 36
            if prevClipboard is not missing value then
                set the clipboard to prevClipboard
            end if
        end tell
    end tell
end run
EOF
}

send_to_cmux() {
    osascript - "$1" "$2" >/dev/null << 'EOF'
on run argv
    set cmd to item 1 of argv
    set useNewTab to (item 2 of argv is "true")
    tell application id "com.cmuxterm.app"
        activate
        tell application "System Events"
            tell process "cmux"
                if (count of windows) is 0 then
                    tell application id "com.cmuxterm.app" to reopen
                end if
                set frontmost to true
            end tell
        end tell
    end tell
    if useNewTab then
        tell application "System Events"
            tell process "cmux"
                keystroke "n" using command down
            end tell
        end tell
        delay 0.1
    end if
    tell application "System Events"
        tell process "cmux"
            delay 0.1
            set prevClipboard to the clipboard
            set the clipboard to cmd
            delay 0.05
            keystroke "v" using {command down}
            delay 0.05
            key code 36
            if prevClipboard is not missing value then
                set the clipboard to prevClipboard
            end if
        end tell
    end tell
end run
EOF
}

case "$emulator" in
    Terminal)
        send_to_terminal "$final_cmd" "$new_tab" 2>/dev/null || fallback_exec "Terminal" "$final_cmd"
        ;;
    iTerm2|iTerm)
        send_to_iterm "$final_cmd" "$new_tab" 2>/dev/null || fallback_exec "iTerm2" "$final_cmd"
        ;;
    Warp)
        send_to_warp "$final_cmd" "$new_tab" 2>/dev/null || fallback_exec "Warp" "$final_cmd"
        ;;
    Ghostty)
        send_to_ghostty "$final_cmd" "$new_tab" 2>/dev/null || fallback_exec "Ghostty" "$final_cmd"
        ;;
    kitty)
        send_to_kitty "$final_cmd" "$new_tab" 2>/dev/null || fallback_exec "kitty" "$final_cmd"
        ;;
    cmux)
        send_to_cmux "$final_cmd" "$new_tab" 2>/dev/null || fallback_exec "cmux" "$final_cmd"
        ;;
    *)
        send_to_terminal "$final_cmd" "$new_tab" 2>/dev/null || fallback_exec "Terminal" "$final_cmd"
        ;;
esac

exit 0
