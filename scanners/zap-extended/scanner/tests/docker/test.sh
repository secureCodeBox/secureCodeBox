#!/usr/bin/env bash

set -eu


# $PROJECT is defined by .envrc file
scb_zap_extended_dir="${PROJECT}"
docker_dir="${scb_zap_extended_dir}/scanner/"
docker_tmp_dir="${docker_dir}/tests/docker/tmp"
zap_examples_dir="${scb_zap_extended_dir}/scanner/examples"

mkdir -pv "${docker_tmp_dir}"

cp -Rv "${zap_examples_dir}" "${docker_tmp_dir}/configs/"
#cp -rv "${zap_examples_dir}/scan-overlay/"* "${docker_tmp_dir}/configs/"

# Test: `docker run --rm -it securecodebox/zap:local-test`
docker build -t securecodebox/zap:local-test "${docker_dir}"

docker run -t --rm \
    -v "${docker_tmp_dir}":/zap/wrk \
    -v "${docker_tmp_dir}/configs/bodgeit":/zap/secureCodeBox-extensions/configs \
    -e SCB_ZAP_SCANTYPE_CONFIG_DIR="/zap/secureCodeBox-extensions/configs/" \
    -e SCB_ZAP_SCAN_CONFIG_DIR="/zap/secureCodeBox-extensions/configs/scan/" \
    securecodebox/zap:local-test \
    zap-full-scan.py \
    -t "http://localhost:8080/bodgeit" \
    -I \
    --hook=/zap/zap_hooks.py

# docker run -t --rm \
#     -v "${docker_tmp_dir}":/zap/wrk \
#     -v "${docker_tmp_dir}/configs/bodgeit":/zap/secureCodeBox-extensions/configs \
#     -e SCB_ZAP_SCAN_CONFIG_DIR="/zap/secureCodeBox-extensions/configs/scan/" \
#     -e SCB_ZAP_SCANTYPE_CONFIG_DIR="/zap/secureCodeBox-extensions/configs" \
#     securecodebox/zap:local-test \
#     zap-full-scan.py \
#     -t "http://localhost:8080/bodgeit" \
#     -I \
#     --hook=/zap/zap_hooks.py

# docker run -it --rm \
#     -v "${docker_tmp_dir}":/zap/wrk \
#     -v "${docker_tmp_dir}/configs/bodgeit":/zap/secureCodeBox-extensions/configs \
#     -e SCB_ZAP_SCAN_CONFIG_DIR="/zap/secureCodeBox-extensions/configs/scan" \
#     -e SCB_ZAP_SCANTYPE_CONFIG_DIR="/zap/secureCodeBox-extensions/configs/scantype" \
#     securecodebox/zap:local-test

# docker run -it --rm \
#     -v "${docker_tmp_dir}":/zap/wrk \
#     -v "${docker_tmp_dir}/configs/scan-overlay/scan":/zap/secureCodeBox-extensions/configs/scan \
#     -v "${docker_tmp_dir}/configs/scan-overlay/scantype":/zap/secureCodeBox-extensions/configs/scantype \
#     -e SCB_ZAP_SCAN_CONFIG_DIR="/zap/secureCodeBox-extensions/configs/scan" \
#     -e SCB_ZAP_SCANTYPE_CONFIG_DIR="/zap/secureCodeBox-extensions/configs/scantype" \
#     securecodebox/zap:local-test

#> zap-full-scan.py -t "https://www.secureCodeBox.io" --hook=/zap/zap_hooks.py
