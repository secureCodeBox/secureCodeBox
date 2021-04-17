#!/usr/bin/env bash

set -eu

# $PROJECT is defined by .envrc file
project_zap_extended_dir="${PROJECT}"
scanner_impl_dir="${project_zap_extended_dir}/scanner"
config_tmp_dir="${scanner_impl_dir}/tests/tmp"
zap_examples_dir="${scanner_impl_dir}/examples"

#mkdir -pv "${config_tmp_dir}"

#cp -Rv "${zap_examples_dir}" "${config_tmp_dir}/configs/"

python3 integration_test_zap_local.py --log=DEBUG
