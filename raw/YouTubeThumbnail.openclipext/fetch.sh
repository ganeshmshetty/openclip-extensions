#!/bin/zsh
# Download a YouTube video thumbnail via curl. Quality is derived from the
# sub-action id suffix (max / hq / mq).

set -u

CURL=/usr/bin/curl
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

id=""
if [[ "$raw" =~ '^[A-Za-z0-9_-]{11}$' ]]; then
  id="$raw"
elif [[ "$raw" =~ 'youtu\.be/([A-Za-z0-9_-]{11})' ]]; then
  id="$match[1]"
elif [[ "$raw" =~ '[?&]v=([A-Za-z0-9_-]{11})' ]]; then
  id="$match[1]"
elif [[ "$raw" =~ '/shorts/([A-Za-z0-9_-]{11})' ]]; then
  id="$match[1]"
elif [[ "$raw" =~ '/embed/([A-Za-z0-9_-]{11})' ]]; then
  id="$match[1]"
elif [[ "$raw" =~ '/live/([A-Za-z0-9_-]{11})' ]]; then
  id="$match[1]"
fi

[[ -n "$id" ]] || fail "No YouTube video found in the selection."

case "$MODE" in
  max) names=(maxresdefault hqdefault); label="maxres" ;;
  hq) names=(hqdefault); label="hq" ;;
  mq) names=(mqdefault); label="mq" ;;
  *) fail "Unknown action." ;;
esac

outdir="${HOME}/Downloads"
[[ -d "$outdir" ]] || outdir="${TMPDIR:-/tmp}"

tmp="$(mktemp "${TMPDIR:-/tmp}/ytthumb.XXXXXX")"
ok=0
for candidate in "${names[@]}"; do
  if "$CURL" -fsSL --max-time 30 -o "$tmp" "https://img.youtube.com/vi/${id}/${candidate}.jpg"; then
    if [[ -s "$tmp" ]]; then
      ok=1
      break
    fi
  fi
done
[[ "$ok" == 1 ]] || { rm -f "$tmp"; fail "Could not download the thumbnail."; }

out="${outdir}/${id}-${label}.jpg"
index=2
while [[ -e "$out" ]]; do
  out="${outdir}/${id}-${label}-${index}.jpg"
  (( index++ ))
done

mv "$tmp" "$out" || { rm -f "$tmp"; fail "Could not save the thumbnail."; }

printf '{"type":"file","path":"%s"}\n' "$(json_escape "$out")"
