#!/usr/bin/env bash

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

#
# Helper script to create new blog posts
#
# What does this script for you?
# 1. It creates the proper filename (eg. blog/2020-10-01-this-is-a-title.md).
#    - current date
#    - lower case
#    - spaces replaced by dashes
# 2. Adds basic frontmatter into it.
#
# You may place a file .author_meta into the root of the repo to define some variables
# for the frontmatter. The script will tell you if no meta file was found.
#

set -ue

# @see: http://wiki.bash-hackers.org/syntax/shellvars
[ -z "${SCRIPT_DIRECTORY:-}" ] \
  && SCRIPT_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )" \
  && export SCRIPT_DIRECTORY

BASE_DIR=$(dirname "${SCRIPT_DIRECTORY}")
BLOG_DIR="${BASE_DIR}/blog"
USAGE="Usage: $(basename "$0") 'The title of Your Post'"

if (( $# != 1 )); then
  echo "Error: The title is missing!"
  echo "${USAGE}"
  exit 1
fi

if [ '-h' = "${1}" ]; then
  echo "${USAGE}"
  exit 0
fi

AUTHOR_META_FILE="${BASE_DIR}/.author_meta"
if [ -f "${AUTHOR_META_FILE}" ]; then
  echo "Using author meta file ${AUTHOR_META_FILE}."
  # shellcheck disable=SC1090
  source "${AUTHOR_META_FILE}"
else
  echo "No author meta file found at ${AUTHOR_META_FILE}!"
  echo
  echo "You coukd use one to predefine some variables. Just put this:"
  echo
  echo "AUTHOR='Gordon Shumway'"
  echo "AUTHOR_TITLE='Core Developer'"
  echo "AUTHOR_URL='https://...'"
  echo "AUTHOR_IMAGE_URL='https://...'"
  echo
  echo "Into the file ${AUTHOR_META_FILE}."
fi

TITLE="${1}"
TITLE_CLEANSED=$(echo "${TITLE}" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
DATE=$(date +'%Y-%m-%d')
BLOG_POST_FILE="${BLOG_DIR}/${DATE}-${TITLE_CLEANSED}.md"
cat << EOF > "${BLOG_POST_FILE}"
---
title: ${TITLE}
author: ${AUTHOR:-}
author_title: ${AUTHOR_TITLE:-}
author_url: ${AUTHOR_URL:-}
author_image_url: ${AUTHOR_IMAGE_URL:-}
tags:
description:
image:
draft: true
---
EOF
