#!/bin/sh
set -eu
extension_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec "$extension_dir/HideMyData Review.app/Contents/MacOS/HMDReview" --launch
