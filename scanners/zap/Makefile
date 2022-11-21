#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
scanner = zap

include ../../scanners.mk

deploy-test-deps: deploy-test-dep-juiceshop deploy-test-dep-nginx deploy-test-dep-bodgeit deploy-test-dep-petstore

#Run integration tests for the ZAP Automation Framework Scanner.
integration-tests:
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	kubectl -n integration-tests delete scans --all
	kubectl -n integration-tests delete configmaps --all
	helm -n integration-tests upgrade --install $(scanner) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-zap" \
		--set="parser.image.tag=3.1.0"
	kubectl apply -f ./integration-tests/automation-framework-configMap.yaml -n integration-tests
	cd $(SCANNERS_DIR) && npm ci && cd $(scanner)/integration-tests && npm run test --yes --package jest@$(JEST_VERSION) $(scanner)/integration-tests
