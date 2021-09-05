#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: 2021 iteratec GmbH
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
	$(MAKE) -f ../../scanners.mk unit-tests-parser include_guard=set scanner=zap

install-deps:
	cd ../zap/ && $(MAKE) install-deps

docker-build-parser:
	cd ../zap/ && $(MAKE) docker-build-parser

docker-export-parser:
	cd ../zap/ && $(MAKE) docker-export-parser

kind-import-parser:
	cd ../zap/ && $(MAKE) kind-import-parser

deploy-with-scanner:
	@echo ".: 💾 Deploying custom '$(scanner)' scanner HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(scanner) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-zap" \
		--set="parser.image.tag=$(IMG_TAG)" \
		--set="scanner.image.repository=docker.io/$(IMG_NS)/$(scanner-prefix)-$(scanner)" \
		--set="scanner.image.tag=$(IMG_TAG)"

deploy-test-deps: deploy-test-dep-nginx deploy-test-dep-bodgeit deploy-test-dep-juiceshop deploy-test-dep-petstore
