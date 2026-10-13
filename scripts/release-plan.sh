#!/usr/bin/env bash
# Prints the deployable CD must release: the web generator, when its package version is ahead of the image tag in
# charts/static/values.yaml. Tags are "<version>.<short sha>", so only the version part is compared.
#
# Comparing against the chart, rather than diffing the last commit, makes CD idempotent: a failed or skipped run is
# picked up by the next one. Output: "<chart key> <package name> <version>", or nothing. Requires yq.
set -euo pipefail
chart=charts/static
name=$(node -p "require('./packages/web/package.json').name")
version=$(node -p "require('./packages/web/package.json').version")
tag=$(yq '.image.tag // ""' "$chart/values.yaml")
if [ "${tag%.*}" != "$version" ]; then
  echo "web $name $version"
fi
