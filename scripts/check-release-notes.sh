#!/usr/bin/env bash
# Fails if a changed extension is new or bumps "version" without fresh "releaseNotes".
# Usage: scripts/check-release-notes.sh <base-ref>   (e.g. origin/main)
set -euo pipefail
base="${1:-origin/main}"
fail=0
for manifest in $(git diff --name-only "$base"...HEAD -- 'raw/*/openclip.json' | sort -u); do
  [ -f "$manifest" ] || continue
  version="$(jq -r '.version // ""' "$manifest")"
  notes="$(jq -r '.releaseNotes // ""' "$manifest")"
  if old="$(git show "$base:$manifest" 2>/dev/null)"; then
    old_version="$(jq -r '.version // ""' <<<"$old")"
    old_notes="$(jq -r '.releaseNotes // ""' <<<"$old")"
    [ "$version" = "$old_version" ] && continue
    if [ -z "$notes" ] || [ "$notes" = "$old_notes" ]; then
      echo "::error file=$manifest::Version bumped to $version but \"releaseNotes\" is missing or unchanged. Add a one-line summary of what changed."
      fail=1
    fi
  elif [ -z "$notes" ]; then
    echo "::error file=$manifest::New extension needs a one-line \"releaseNotes\"."
    fail=1
  fi
done
[ "$fail" = 0 ] && echo "releaseNotes check passed."
exit "$fail"
