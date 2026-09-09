#!/bin/bash
set -euo pipefail
PACKAGE_DIR=$(cd "$(dirname "$0")/.." && pwd)
BUILD_DIR=$(mktemp -d "${TMPDIR:-/tmp}/hmd-test.XXXXXX")
trap 'rm -rf "$BUILD_DIR"' EXIT
/usr/bin/xcrun swiftc -swift-version 5 -module-cache-path "$BUILD_DIR/cache" "$PACKAGE_DIR/Source/Engine.swift" "$PACKAGE_DIR/Tests/main.swift" -o "$BUILD_DIR/test"
"$BUILD_DIR/test" "$PACKAGE_DIR/patterns.json"
