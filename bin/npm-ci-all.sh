#!/usr/bin/env bash

set -euo pipefail

# This find construct is based on https://stackoverflow.com/questions/4210042/how-to-exclude-a-directory-in-find-command/4210072#4210072
PACKAGE_JSON_LIST=$(find "$PROJECT_DIR" \( \
  -name .git -o \
  -name .github -o \
  -name .idea -o \
  -name .reuse -o \
  -name .vagrant -o \
  -name .vscode -o \
  -name bin -o \
  -name docs -o \
  -name LICENSES -o \
  -name coverage -o \
  -name dist -o \
  -name node_modules -o \
  -name target \) \
  -prune \
  -false \
  -o -type f \
  -iname package.json \
  -exec printf '%s:' {} + | sed '$s/:$/\n/')
  # Print each path w/o newline but w/ : appended  and then remove the last : with sed.

IFS=':'
for package in $PACKAGE_JSON_LIST; do
  # echo "$IFS" | cat -et
  echo "- ${package}"
  echo "🧱 Installing dependencies for ${package}"
  dir=$(dirname "${package}")
  (
    cd "${dir}"
    npm ci
  )
done
