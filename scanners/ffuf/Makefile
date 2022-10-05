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

integration-tests:
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	kubectl -n integration-tests delete scans --all
	kubectl apply -f ./integration-tests/configmap-wordlist.yaml -n integration-tests
	cd $(SCANNERS_DIR) && npm ci && cd $(scanner)/integration-tests && npm run test --yes --package jest@$(JEST_VERSION) $(scanner)/integration-tests
