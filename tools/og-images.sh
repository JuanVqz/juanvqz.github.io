#!/usr/bin/env bash
# Regenerate Open Graph images via `jekyll-og-image` and copy them into the
# source tree so they can be committed. Invoked by the
# `.github/workflows/og-images.yml` workflow and can be run locally too.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT/assets/images/og/posts"
DEST_DIR="$ROOT/_site/assets/images/og/posts"

cd "$ROOT"
bundle exec jekyll build

mkdir -p "$SRC_DIR"
cp -f "$DEST_DIR"/*.png "$SRC_DIR"/

echo "Copied OG images to $SRC_DIR"
