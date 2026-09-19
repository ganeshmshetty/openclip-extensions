#!/bin/zsh
set -euo pipefail

# Read selection from OPENCLIP_TEXT or stdin
INPUT_TEXT="${OPENCLIP_TEXT:-$(cat 2>/dev/null || true)}"
ACTION_ID="${OPENCLIP_ACTION_ID:-com.openclip.droppy.send}"

if [[ -z "${INPUT_TEXT//[[:space:]]/}" ]]; then
    exit 0
fi

# Read target option from OpenClip defaults (defaults to "shelf")
get_option() {
    local opt_id="$1"
    local default_val="$2"
    local val
    val="$(defaults read com.openclip.OpenClip "action.${ACTION_ID}.option.${opt_id}" 2>/dev/null || true)"
    if [[ -n "$val" ]]; then
        echo "$val"
    else
        echo "$default_val"
    fi
}

TARGET="$(get_option "target" "shelf")"
if [[ "$TARGET" != "basket" ]]; then
    TARGET="shelf"
fi

TARGET_LABEL="Shelf"
if [[ "$TARGET" == "basket" ]]; then
    TARGET_LABEL="Floating Basket"
fi

export DROPPY_TARGET="$TARGET"
export DROPPY_TARGET_LABEL="$TARGET_LABEL"
export DROPPY_INPUT_TEXT="$INPUT_TEXT"

/usr/bin/python3 - <<'EOF'
import os
import sys
import urllib.parse
from datetime import datetime

target = os.environ.get("DROPPY_TARGET", "shelf")
target_label = os.environ.get("DROPPY_TARGET_LABEL", "Shelf")
text = os.environ.get("DROPPY_INPUT_TEXT", "").strip()

if not text:
    sys.exit(0)

def is_url(s):
    return s.startswith("http://") or s.startswith("https://")

def resolve_file(s):
    if s.startswith("file://"):
        s = urllib.parse.unquote(s[7:])
    clean = os.path.expanduser(s.strip('"\''))
    if os.path.exists(clean):
        return os.path.abspath(clean)
    # Also handle paths with shell-escaped spaces/symbols (e.g. CleanShot or terminal copy)
    unescaped = clean.replace(r"\ ", " ").replace(r"\(", "(").replace(r"\)", ")")
    if os.path.exists(unescaped):
        return os.path.abspath(unescaped)
    return None

lines = [line.strip() for line in text.splitlines() if line.strip()]

# 1. All non-empty lines are URLs
if lines and all(is_url(l) for l in lines):
    query_parts = [f"target={target}"]
    for l in lines:
        query_parts.append(f"url={urllib.parse.quote(l, safe='')}")
    droppy_url = f"droppy://add?{'&'.join(query_parts)}"
    item_desc = "link" if len(lines) == 1 else f"{len(lines)} links"
    msg = f"Added {item_desc} to Droppy {target_label}"

# 2. All non-empty lines are existing local files/folders
elif lines and all(resolve_file(l) is not None for l in lines):
    query_parts = [f"target={target}"]
    for l in lines:
        resolved = resolve_file(l)
        query_parts.append(f"path={urllib.parse.quote(resolved, safe='')}")
    droppy_url = f"droppy://add?{'&'.join(query_parts)}"
    item_desc = "file" if len(lines) == 1 else f"{len(lines)} files"
    msg = f"Added {item_desc} to Droppy {target_label}"

# 3. Whole text is a single file path (handles multiline or unquoted paths)
elif resolve_file(text) is not None:
    resolved = resolve_file(text)
    droppy_url = f"droppy://add?target={target}&path={urllib.parse.quote(resolved, safe='')}"
    msg = f"Added file to Droppy {target_label}"

# 4. Plain text / code snippet / note: save to scratch directory and pass path
else:
    scratch_dir = os.path.expanduser("~/.openclip/droppy-snippets")
    os.makedirs(scratch_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    snippet_file = os.path.join(scratch_dir, f"Snippet-{timestamp}.txt")
    with open(snippet_file, "w", encoding="utf-8") as f:
        f.write(text)
    droppy_url = f"droppy://add?target={target}&path={urllib.parse.quote(snippet_file, safe='')}"
    msg = f"Added note to Droppy {target_label}"

# Trigger Droppy URL
ret = os.system(f'/usr/bin/open "{droppy_url}" 2>/dev/null')
if ret != 0:
    print('{"type":"toast","message":"Droppy is not installed or URL scheme failed","style":"error"}')
else:
    print(f'{{"type":"toast","message":"{msg}","style":"success"}}')
EOF
