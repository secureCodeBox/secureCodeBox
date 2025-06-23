#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
scanner = zap-automation-framework

include ../../scanners.mk

deploy-test-deps: deploy-test-dep-juiceshop deploy-test-dep-nginx deploy-test-dep-bodgeit deploy-test-dep-petstore
	kubectl apply -f ./integration-tests/automation-framework-configMap.yaml -n integration-tests
