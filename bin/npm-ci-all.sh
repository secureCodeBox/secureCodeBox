#!/usr/bin/env bash

set -euo pipefail

if [ -z "${PROJECT_DIR:-}" ]; then
  echo >&2 "Waring: Env var PROJECT_DIR is not set! Maybe direnv is not installed/enabled."
  echo >&2 "Determine PROJECT_DIR by myself..."
  # @see: http://wiki.bash-hackers.org/syntax/shellvars
  [ -z "${SCRIPT_DIRECTORY:-}" ] && SCRIPT_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
  # Assuming we are in ./bin and need one level up.
  PROJECT_DIR="$(dirname "${SCRIPT_DIRECTORY}")"
  echo >&2 "Determined PROJECT_DIR is ${PROJECT_DIR}"
fi

# Found directives are delimited  by : to make this script failsafe,
# if the repository working copy is cloned into a directory which
# contains white spaces in the file name.
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

# We split on colon instead of any white space in the for loop.
IFS=':'
for package in $PACKAGE_JSON_LIST; do
  echo "- ${package}"
  echo "🧱 Installing dependencies for ${package}"
  dir=$(dirname "${package}")
  (
    cd "${dir}"
    npm ci
  )
done
