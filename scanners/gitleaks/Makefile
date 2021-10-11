#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
scanner = gitleaks
custom_scanner = set

include ../../scanners.mk

deploy-with-scanner:
	helm -n integration-tests install gitleaks ./ \
    --set="scanner.image.repository=docker.io/${IMG_NS}/${scanner-prefix}-gitleaks" \
    --set="scanner.image.tag=${IMG_TAG}" \
    --set="parser.image.repository=docker.io/${IMG_NS}/${parser-prefix}-gitleaks" \
    --set="parser.image.tag=sha-${IMG_TAG}" \
    --set="parser.env[0].name=CRASH_ON_FAILED_VALIDATION" \
    --set-string="parser.env[0].value=true"

