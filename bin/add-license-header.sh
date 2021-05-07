#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2020 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

#
# Add SPDX license header to givne list off files
#
# Prerequesites:
# - reuse tool
#
# Usage:
#   add-license-header.sh file1 file2 file3
#   cat file_list.txt | add-license-header.sh
#
# See also:
# - https://spdx.org
# - https://reuse.software
#

set -eu

FILES=""

if [[ -p /dev/stdin ]]; then
  FILES="$(cat -)"
else
  FILES="$@"
fi

for file in $FILES; do
    reuse addheader \
      --copyright "iteratec GmbH" \
      --year 2020 \
      --license "Apache-2.0" \
      --skip-unrecognised \
      "$file"
done
