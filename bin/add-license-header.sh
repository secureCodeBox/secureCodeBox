#!/usr/bin/env bash

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

#
# Add SPDX license header to given list off files
#
# Prerequisites:
# - reuse tool
#
# Usage:
#   add-license-header.sh file1 file2 file3
#
# Example to read from linter file (IMPORTANT: You must remove all the markdown clutter to get palin list of files):
#   cat spdx-report.md | ./add-license-header.sh
#
# To generate the file list use `reuse lint`. This produces a Markdown report:
#   docker run --rm --volume $(pwd):/data fsfe/reuse lint > spdx-report.md
#
# See also:
# - https://spdx.org
# - https://reuse.software
#

set -eu

echo "Adding Header to all files..."

FILES=""

if [[ -p /dev/stdin ]]; then
  FILES="$(cat -)"
else
  FILES="$@"
fi

for file in $FILES; do
  echo "Adding HEADER to file: $file"
  docker run --rm --volume $(pwd):/data fsfe/reuse annotate \
    --copyright "the secureCodeBox authors" \
    --exclude-year \
    --license "Apache-2.0" \
    --skip-unrecognised \
    "$file"
done
