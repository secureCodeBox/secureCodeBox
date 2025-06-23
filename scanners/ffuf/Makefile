#!/usr/bin/make -fq
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
scanner = ffuf
custom_scanner = set

include ../../scanners.mk

deploy-test-deps: deploy-test-dep-juiceshop
	kubectl apply -f ./integration-tests/configmap-wordlist.yaml -n integration-tests

