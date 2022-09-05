#!/usr/bin/env bash

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

echo "Running 'npm audit fix' in all directories containing a package-lock.json"

find . -type f -name package-lock.json -print0 | while IFS= read -r -d '' chart; do
  (
    dir="$(dirname "${chart}")"
    cd "${dir}" || exit
    echo "Running 'npm audit fix' in $dir"
    npm audit fix
  )
done
