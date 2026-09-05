#!/bin/bash
# install.sh — validate and install a local extension package into ~/.openclip/extensions/
#
# OpenClip hot-reloads installed extensions in ~2 seconds.
#
# Usage:
#   ./scripts/install.sh <path_to_extension>
#
# Example:
#   ./scripts/install.sh raw/WordCount.openclipext

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ $# -lt 1 ]]; then
    echo "Usage: ./scripts/install.sh <path_to_extension>" >&2
    exit 1
fi

SRC_PATH="$1"

if [[ ! -e "$SRC_PATH" ]]; then
    echo "Error: path does not exist: $SRC_PATH" >&2
    exit 1
fi

# Run validation first
echo "Validating $SRC_PATH before install..."
if ! "$SCRIPT_DIR/validate.sh" "$SRC_PATH"; then
    echo "Install aborted: extension failed validation." >&2
    exit 1
fi

EXT_DIR="$HOME/.openclip/extensions"
mkdir -p "$EXT_DIR"

PKG_NAME="$(basename "$SRC_PATH")"
DEST_PATH="$EXT_DIR/$PKG_NAME"

echo "Installing to $DEST_PATH ..."
rm -rf "$DEST_PATH"
cp -R "$SRC_PATH" "$DEST_PATH"

echo "✓ Successfully installed $PKG_NAME!"
echo "OpenClip will hot-reload it within ~2 seconds."
