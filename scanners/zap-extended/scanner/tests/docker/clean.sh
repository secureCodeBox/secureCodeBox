#!/usr/bin/env bash

set -eu

# $PROJECT is defined by .envrc file
build_dir="${PROJECT}/target"
rm -rf "${build_dir}"
