#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
scanner = zap-advanced
custom_scanner = set

include ../../scanners.mk

unit-tests:
	@$(MAKE) -s unit-test-py

unit-tests-parser:
	$(MAKE) -s -f ../../scanners.mk unit-tests-parser include_guard=set scanner=zap

install-deps:
	cd $(SCANNERS_DIR)/zap/ && $(MAKE) -s install-deps

docker-build-parser:
	cd $(SCANNERS_DIR)/zap/ && $(MAKE) -s docker-build-parser

docker-export-parser:
	cd $(SCANNERS_DIR)/zap/ && $(MAKE) -s docker-export-parser

kind-import-parser:
	cd $(SCANNERS_DIR)/zap/ && $(MAKE) -s kind-import-parser

deploy-with-scanner:
	@echo ".: 💾 Deploying custom '$(scanner)' scanner HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(scanner) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-zap" \
		--set="parser.image.tag=$(IMG_TAG)" \
		--set="scanner.image.repository=docker.io/$(IMG_NS)/$(scanner-prefix)-$(scanner)" \
		--set="scanner.image.tag=$(IMG_TAG)"

deploy-test-deps: deploy-test-dep-bodgeit deploy-test-dep-juiceshop deploy-test-dep-petstore

integration-tests:
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	kubectl -n integration-tests delete scans --all
	kubectl apply -f ./integration-tests/scantype-configMap.yaml -n integration-tests
	cd $(SCANNERS_DIR) && npm ci && cd $(scanner)/integration-tests && npm run test:integration -- $(scanner)/integration-tests
