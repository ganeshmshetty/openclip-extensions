#!/bin/bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
TEXT="${OPENCLIP_TEXT:-${1:-}}"

# If text is empty, nothing to display
if [[ -z "${TEXT// /}" ]]; then
    exit 0
fi

if [[ -x "$DIR/largetype" ]]; then
    "$DIR/largetype" "$TEXT" >/dev/null 2>&1 &
elif command -v swift >/dev/null 2>&1 && [[ -f "$DIR/main.swift" ]]; then
    swift "$DIR/main.swift" "$TEXT" >/dev/null 2>&1 &
fi
