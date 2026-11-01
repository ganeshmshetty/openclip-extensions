#!/bin/zsh
# Image convert & compress via macOS `sips`. Behavior is derived from the
# sub-action id suffix (jpeg / png / heic / tiff / resize / compress).

set -u

SIPS=/usr/bin/sips
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

raw="${OPENCLIP_TEXT:-}"
raw="${raw%%$'\n'*}"
raw="${raw#"${raw%%[![:space:]]*}"}"
raw="${raw%"${raw##*[![:space:]]}"}"
raw="${raw#\"}"
raw="${raw%\"}"
raw="${raw#\'}"
raw="${raw%\'}"

if [[ "$raw" == file://* ]]; then
  raw="${raw#file://}"
  raw="${raw//%20/ }"
fi

case "$raw" in
  "~") raw="$HOME" ;;
  "~"/*) raw="$HOME/${raw#\~/}" ;;
esac

[[ -n "$raw" ]] || fail "Select an image file path."
[[ -f "$raw" ]] || fail "Not a file: $raw"
[[ -r "$raw" ]] || fail "Cannot read: $raw"

dir="${raw:h}"
base="${raw:t:r}"
ext="${raw:e:l}"

suffix=""
args=()
case "$MODE" in
  jpeg)
    suffix="jpg"
    args=(-s format jpeg -s formatOptions 85)
    ;;
  png)
    suffix="png"
    args=(-s format png)
    ;;
  heic)
    suffix="heic"
    args=(-s format heic)
    ;;
  tiff)
    suffix="tiff"
    args=(-s format tiff)
    ;;
  resize)
    [[ -n "$ext" ]] || fail "Cannot resize a file without an extension."
    suffix="$ext"
    args=(-Z 1600)
    ;;
  compress)
    suffix="jpg"
    args=(-s format jpeg -s formatOptions 60)
    ;;
  *)
    fail "Unknown action."
    ;;
esac

out="${dir}/${base}-${MODE}.${suffix}"
index=2
while [[ -e "$out" ]]; do
  out="${dir}/${base}-${MODE}-${index}.${suffix}"
  (( index++ ))
done

err="$(mktemp "${TMPDIR:-/tmp}/ocimage.XXXXXX")"
if ! "$SIPS" "${args[@]}" "$raw" --out "$out" >/dev/null 2>"$err"; then
  fail "Could not convert the image: $(head -c 200 "$err")"
fi
rm -f "$err"

[[ -s "$out" ]] || fail "The converted image is empty."

printf '{"type":"file","path":"%s"}\n' "$(json_escape "$out")"
