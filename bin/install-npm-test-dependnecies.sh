#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2020 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

#
# Thisscript installs recursiveall dependencies in JavaScript modules.
#

set -eu

# @see: http://wiki.bash-hackers.org/syntax/shellvars
[ -z "${SCRIPT_DIRECTORY:-}" ] \
  && SCRIPT_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

BASE_DIR=$(dirname "${SCRIPT_DIRECTORY}")

echo "Install npm dependencies in all parser sub projects"

for dir in "$BASE_DIR/scanners/"*/parser; do
  (
    cd "$dir"
    if [ -f package.json ] && [ -f package-lock.json ]; then
      echo "Installing dependencies for $dir"
      npm ci
  fi
  )
done

echo "Install npm dependencies in all hook sub projects"

for dir in "$BASE_DIR/hooks/"*; do
  (
    cd "$dir"
    if [ -f package.json ] && [ -f package-lock.json ]; then
        echo "Installing dependencies for $dir"
        npm ci
    fi
  )
done

echo "Install npm test dependencies"

npm ci
(cd "$BASE_DIR/scanners" && npm ci)
(cd "$BASE_DIR/hooks" && npm ci)
