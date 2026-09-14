#!/bin/zsh
cmd="${OPENCLIP_TEXT:-$(cat)}"
printf "%s" "$cmd" | open -f -a TextEdit
