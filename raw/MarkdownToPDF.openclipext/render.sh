#!/bin/zsh
# Render the selection as PDF via WebKit. Input kind is derived from the
# sub-action id suffix (markdown / html).

set -u

DIR="$(cd "$(dirname "$0")" && pwd)"
MODE="${OPENCLIP_ACTION_ID##*.}"

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

case "$MODE" in
  markdown|html) ;;
  *) fail "Unknown action." ;;
esac

text="${OPENCLIP_TEXT:-}"
[[ -n "${text//[[:space:]]/}" ]] || fail "Nothing to convert."

tmpdir="$(mktemp -d "${TMPDIR:-/tmp}/ocpdf.XXXXXX")"
infile="$tmpdir/input.txt"
out="$tmpdir/document.pdf"
err="$tmpdir/err.txt"

printf '%s' "$text" > "$infile"

if ! /usr/bin/osascript -l JavaScript "$DIR/render.jxa" "$infile" "$out" "$MODE" "720" >/dev/null 2>"$err"; then
  fail "Could not create the PDF: $(head -c 200 "$err")"
fi

[[ -s "$out" ]] || fail "Could not create the PDF."

printf '{"type":"file","path":"%s"}\n' "$(json_escape "$out")"