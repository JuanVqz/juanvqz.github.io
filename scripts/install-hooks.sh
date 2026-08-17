#!/usr/bin/env bash
# Install a pre-commit hook that runs the prose linter on staged posts.
#
#   ./scripts/install-hooks.sh          install
#   ./scripts/install-hooks.sh remove   uninstall
#
# Git hooks are not versioned, so this script exists to put one in place.
set -euo pipefail
cd "$(dirname "$0")/.."
HOOK=.git/hooks/pre-commit

if [ "${1:-}" = "remove" ]; then
  rm -f "$HOOK"; echo "removed $HOOK"; exit 0
fi

cat > "$HOOK" <<'HOOKEOF'
#!/usr/bin/env bash
# Lint staged posts before they are committed. Skip with: git commit --no-verify
files=$(git diff --cached --name-only --diff-filter=d | grep '^_posts/.*\.md$' || true)
[ -z "$files" ] && exit 0
ruby scripts/lint-prose.rb $files || {
  echo
  echo "Style errors above. Fix them, or commit with --no-verify if you disagree."
  exit 1
}
HOOKEOF

chmod +x "$HOOK"
echo "installed $HOOK"
echo "It lints staged posts on every commit. Bypass with: git commit --no-verify"
