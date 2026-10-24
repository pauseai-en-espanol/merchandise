#!/usr/bin/env bash
# Every change to what the site's image contains must come with a changeset releasing it, or CD won't rebuild the
# image. The repo has one deployable, the web generator (@pauseai-es/merch-web, charts/static): its image (Dockerfile)
# holds the workspace packages and the repo files the site reads at build time, listed in IMAGE_INPUTS below. Keep that
# list in step with the Dockerfile's COPY lines and the files packages/web imports.
#
# It changed if a commit since the merge-base with the base touched one of those paths (uncommitted work doesn't count,
# since it isn't being pushed). It is released if the changesets added since the base bump it (changeset status;
# bumping merch-core bumps merch-web too, as its workspace dependent).
#
# Usage: scripts/check-deployables-released.sh <base-ref>              fail if the changed deployable isn't released
#        scripts/check-deployables-released.sh --affected <base-ref>   print the deployable if it changed
set -euo pipefail
mode=check
if [ "${1:-}" = --affected ]; then
  mode=affected
  shift
fi
base="${1:?usage: $0 [--affected] <base-ref>}"
deployable=@pauseai-es/merch-web

IMAGE_INPUTS=(
  Dockerfile .dockerignore package.json pnpm-lock.yaml pnpm-workspace.yaml
  packages
  ':(glob)designs/*/design.json' ':(glob)designs/*/*.orange.front.svg'
  brand/logos brand/fonts/files
  ':(glob)illustrations/portraits/*/lines.svg' ':(glob)illustrations/portraits/*/halftone.svg'
  ':(glob)illustrations/portraits/*/tone.svg'
  ':(glob)mockups/tshirt-*.jpg'
)

# After a force push the previous tip is on no branch, so the clone lacks it; GitHub still serves it by SHA.
if [[ "$base" =~ ^[0-9a-f]{40}$ ]] && ! git rev-parse --verify --quiet "$base^{commit}" > /dev/null; then
  git fetch --quiet --no-tags origin "$base" || true
fi
if ! git rev-parse --verify --quiet "$base^{commit}" > /dev/null; then
  echo "Base $base isn't in this clone (a new branch or a force push?), so releases can't be checked" >&2
  exit 1
fi

changed=$(git diff --name-only "$(git merge-base "$base" HEAD)" HEAD -- "${IMAGE_INPUTS[@]}")

if [ "$mode" = affected ]; then
  [ -z "$changed" ] || echo "$deployable"
  exit 0
fi
if [ -z "$changed" ]; then
  echo "Nothing the site's image contains changed"
  exit 0
fi

plan=$(mktemp)
errors=$(mktemp)
trap 'rm -f "$plan" "$errors"' EXIT
if ! pnpm exec changeset status --since="$base" --output="$plan" > /dev/null 2> "$errors"; then
  # Typically packages changed with no changeset at all: say so, and check against an empty plan.
  cat "$errors" >&2
  echo '{"releases": []}' > "$plan"
fi
released=$(PLAN="$plan" NAME="$deployable" node -p "JSON.parse(require('node:fs').readFileSync(process.env.PLAN,
  'utf8')).releases.some((r) => r.name === process.env.NAME && r.type !== 'none')")

if [ "$released" != true ]; then
  echo "The site's image changed but no changeset releases $deployable, so it wouldn't be rebuilt:" >&2
  head -20 <<< "$changed" | sed 's/^/  /' >&2
  echo "Run 'pnpm release:note' and include $deployable." >&2
  exit 1
fi
echo "The changed site is in the release plan"
