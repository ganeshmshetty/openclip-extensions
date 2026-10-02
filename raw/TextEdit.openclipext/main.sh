#!/bin/zsh
if [[ -n "${OPENCLIP_TEXT:-}" ]]; then
  printf "%s" "$OPENCLIP_TEXT" | open -f -a TextEdit
else
  open -f -a TextEdit
fi
