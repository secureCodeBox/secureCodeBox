#!/usr/bin/env bash

set -eu

# $PROJECT is defined by .envrc file
project_zap_extended_dir="${PROJECT}"
scanner_impl_dir="${project_zap_extended_dir}/scanner"
config_tmp_dir="${scanner_impl_dir}/tests/mocks"

python3 ./tests/integration_test_zap_local.py --log=DEBUG
