#!/usr/bin/env bash
# Renovate PRs don't write changesets. Add a patch changeset for every workspace package the PR touches and for the
# site when its image changes (scripts/check-deployables-released.sh: a root dependency bump changes the image without
# touching packages/), or an empty one when there are none (same approach as aiontheballot).
# Usage: scripts/renovate-changeset.sh <base-ref>
set -euo pipefail
base="${1:?usage: $0 <base-ref>}"
if pnpm release:check > /dev/null 2>&1 && scripts/check-deployables-released.sh "$base" > /dev/null 2>&1; then
  echo "No changeset needed: one exists and releases the changed site, or the PR changes no package"
  exit 0
fi
paths=$(git diff --name-only "$(git merge-base "$base" HEAD)" HEAD | grep -E '^packages/[^/]+/' |
  sed -E 's#^(packages/[^/]+)/.*#\1#' | sort -u || true)
names=$(
  {
    for path in $paths; do
      if [ -f "$path/package.json" ]; then
        node -p "require('./$path/package.json').name"
      fi
    done
    scripts/check-deployables-released.sh --affected "$base"
  } | sort -u | sed '/^$/d'
)
if [ -z "$names" ]; then
  pnpm changeset add --empty
  exit 0
fi
file=".changeset/renovate-$(git rev-parse --short HEAD).md"
{
  echo '---'
  # Single quotes, as in the rest of the repo's changesets: this file reaches main unchecked by the PR's own run (it is
  # amended in after the checks).
  while read -r name; do
    echo "'$name': patch"
  done <<< "$names"
  echo '---'
  echo
  echo 'Dependencies bump'
} > "$file"
cat "$file"
