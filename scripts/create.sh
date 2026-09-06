#!/bin/bash
# create.sh — scaffold a new OpenClip extension inside raw/<Name>.openclipext
#
# Usage:
#   ./scripts/create.sh <Name> [--type url|js|shell|applescript]
#
# Examples:
#   ./scripts/create.sh ReverseWords --type js
#   ./scripts/create.sh DuckDuckGo --type url
#   ./scripts/create.sh FormatJSON --type shell

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

NAME=""
TYPE="js"

usage() {
    cat <<'EOF'
Usage: ./scripts/create.sh <Name> [--type url|js|shell|applescript]

Arguments:
  <Name>                 Extension package name (e.g. WordReverse)
  --type <kind>          Action type: js (default), url, shell, or applescript
  -h, --help             Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --type)
            [[ $# -ge 2 ]] || { echo "Error: --type requires a value" >&2; exit 1; }
            TYPE="$2"
            shift 2
            ;;
        --type=*)
            TYPE="${1#*=}"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        -*)
            echo "Error: unknown flag: $1" >&2
            usage >&2
            exit 1
            ;;
        *)
            if [[ -z "$NAME" ]]; then
                NAME="$1"
            else
                echo "Error: unexpected argument: $1" >&2
                exit 1
            fi
            shift
            ;;
    esac
done

if [[ -z "$NAME" ]]; then
    echo "Error: missing extension name" >&2
    usage >&2
    exit 1
fi

# Clean name: remove trailing .openclipext if provided
NAME="${NAME%.openclipext}"

# Lowercase slug for reverse-DNS identifier
SLUG="$(echo "$NAME" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9' '-' | sed 's/--*/-/g; s/^-//; s/-$//')"
IDENTIFIER="com.openclip.${SLUG:-ext}"
AUTHOR="$(git config user.name 2>/dev/null || echo "Community Contributor")"

DEST_DIR="$REPO_ROOT/raw/$NAME.openclipext"

if [[ -e "$DEST_DIR" ]]; then
    echo "Error: directory already exists: $DEST_DIR" >&2
    exit 1
fi

mkdir -p "$DEST_DIR"

case "$TYPE" in
    url)
        cat > "$DEST_DIR/openclip.json" <<EOF
{
  "identifier": "$IDENTIFIER",
  "name": "$NAME",
  "version": "1.0.0",
  "author": "$AUTHOR",
  "description": "Search or open selected text with $NAME.",
  "action": {
    "title": "$NAME",
    "icon": "magnifyingglass",
    "type": "url",
    "url": "https://duckduckgo.com/?q={query}"
  }
}
EOF
        ;;

    js|javascript)
        cat > "$DEST_DIR/openclip.json" <<EOF
{
  "identifier": "$IDENTIFIER",
  "name": "$NAME",
  "version": "1.0.0",
  "author": "$AUTHOR",
  "description": "Transform selected text with $NAME.",
  "action": {
    "title": "$NAME",
    "icon": "wand.and.stars",
    "type": "javascript",
    "script": "main.js"
  }
}
EOF
        cat > "$DEST_DIR/main.js" <<'EOF'
// OpenClip JavaScript Action
// Returns a string to replace the selected text, or null/empty if no change.
action = (selection) => {
  const text = selection.text;
  if (!text) return null;
  return text.toUpperCase();
};
EOF
        ;;

    shell)
        cat > "$DEST_DIR/openclip.json" <<EOF
{
  "identifier": "$IDENTIFIER",
  "name": "$NAME",
  "version": "1.0.0",
  "author": "$AUTHOR",
  "description": "Run shell command on selected text.",
  "action": {
    "title": "$NAME",
    "icon": "terminal",
    "type": "shell",
    "script": "run.sh"
  }
}
EOF
        cat > "$DEST_DIR/run.sh" <<'EOF'
#!/bin/bash
# Selection text is available on stdin and via $OPENCLIP_TEXT
cat | tr '[:lower:]' '[:upper:]'
EOF
        chmod +x "$DEST_DIR/run.sh"
        ;;

    applescript)
        cat > "$DEST_DIR/openclip.json" <<EOF
{
  "identifier": "$IDENTIFIER",
  "name": "$NAME",
  "version": "1.0.0",
  "author": "$AUTHOR",
  "description": "Automate macOS apps with AppleScript.",
  "action": {
    "title": "$NAME",
    "icon": "applescript",
    "type": "applescript",
    "script": "action.applescript"
  }
}
EOF
        cat > "$DEST_DIR/action.applescript" <<'EOF'
-- OpenClip AppleScript Action
-- Receives the selected text as input string
on run {input}
  return input
end run
EOF
        ;;

    *)
        echo "Error: unknown type '$TYPE' (expected url, js, shell, or applescript)" >&2
        rm -rf "$DEST_DIR"
        exit 1
        ;;
esac

cat > "$DEST_DIR/README.md" <<EOF
# $NAME

OpenClip extension for $NAME.

## Features
- Describe the action and what it does to the selected text.

## Usage
Select text in any application, invoke OpenClip, and choose **$NAME**.
EOF

echo "✓ Created $NAME ($TYPE) at raw/$NAME.openclipext"
echo ""
echo "Next steps:"
echo "  1. Edit logic in raw/$NAME.openclipext/"
echo "  2. Update raw/$NAME.openclipext/README.md"
echo "  3. Test locally:  ./scripts/install.sh raw/$NAME.openclipext"
echo "  4. Validate:      ./scripts/validate.sh raw/$NAME.openclipext"
