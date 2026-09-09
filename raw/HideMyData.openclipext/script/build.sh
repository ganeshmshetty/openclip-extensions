#!/bin/bash
set -euo pipefail
PACKAGE_DIR=$(cd "$(dirname "$0")/.." && pwd)
APP_DIR="$PACKAGE_DIR/HideMyData Review.app"
BUILD_DIR=$(mktemp -d "${TMPDIR:-/tmp}/hmd-build.XXXXXX")
trap 'rm -rf "$BUILD_DIR"' EXIT
mkdir -p "$APP_DIR/Contents/MacOS" "$APP_DIR/Contents/Resources"
for ARCH in arm64 x86_64; do
  /usr/bin/xcrun swiftc -swift-version 5 -O -file-prefix-map "$PACKAGE_DIR=/src/HideMyData" -file-prefix-map "$BUILD_DIR=/build/HideMyData" -file-compilation-dir /src/HideMyData -target "$ARCH-apple-macos14.0" -module-cache-path "$BUILD_DIR/cache" "$PACKAGE_DIR/Source/Engine.swift" "$PACKAGE_DIR/Source/main.swift" -o "$BUILD_DIR/HMDReview-$ARCH"
done
/usr/bin/lipo -create "$BUILD_DIR/HMDReview-arm64" "$BUILD_DIR/HMDReview-x86_64" -output "$APP_DIR/Contents/MacOS/HMDReview"
cp "$PACKAGE_DIR/patterns.json" "$APP_DIR/Contents/Resources/patterns.json"
cat > "$APP_DIR/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>HMDReview</string>
<key>CFBundleIdentifier</key><string>local.hidemydata.openclip.review</string>
<key>CFBundleName</key><string>HideMyData Review</string>
<key>CFBundleDisplayName</key><string>HideMyData Review</string>
<key>CFBundleVersion</key><string>3</string>
<key>CFBundleShortVersionString</key><string>1.0.2</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>LSMinimumSystemVersion</key><string>14.0</string>
<key>NSPrincipalClass</key><string>NSApplication</string>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
chmod +x "$PACKAGE_DIR/redact.sh" "$APP_DIR/Contents/MacOS/HMDReview"
/usr/bin/codesign --force --sign - "$APP_DIR"
echo 'Built universal HideMyData Review (macOS 14+).'
