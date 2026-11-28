#!/bin/sh
set -eu
package_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec /usr/bin/osascript -l JavaScript "$package_dir/export.jxa" "$package_dir/dist/main.js"
