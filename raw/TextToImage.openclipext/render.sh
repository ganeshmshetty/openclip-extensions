#!/bin/zsh
# Render the selection as a styled image card via WebKit. Theme is derived
# from the sub-action id suffix (dark / light).

set -u

DIR="$(cd "$(dirname "$0")" && pwd)"
THEME="${OPENCLIP_ACTION_ID##*.}"

json_escape() {
  local s="${1:-}"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/}"
  s="${s//$'\t'/\\t}"
  printf '%s' "$s"
}

fail() {
  printf '{"type":"toast","message":"%s","style":"error"}\n' "$(json_escape "$1")"
  exit 0
}

text="${OPENCLIP_TEXT:-}"
[[ -n "${text//[[:space:]]/}" ]] || fail "Nothing to render."

tmpdir="$(mktemp -d "${TMPDIR:-/tmp}/ocimage.XXXXXX")"
infile="$tmpdir/input.txt"
out="$tmpdir/card.png"
err="$tmpdir/err.txt"

printf '%s' "$text" > "$infile"

if ! /usr/bin/osascript -l JavaScript "$DIR/render.jxa" "$infile" "$out" "$THEME" "480" >/dev/null 2>"$err"; then
  fail "Could not render the image: $(head -c 200 "$err")"
fi

[[ -s "$out" ]] || fail "Could not render the image."

printf '{"type":"file","path":"%s"}\n' "$(json_escape "$out")"
