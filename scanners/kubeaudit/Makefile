#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
scanner = kubeaudit
custom_scanner = set

include ../../scanners.mk

.PHONY: deploy-with-scanner
deploy-with-scanner:
	@echo ".: 💾 Deploying custom '$(scanner)' scanner HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(scanner) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(scanner)" \
		--set="parser.image.tag=$(IMG_TAG)" \
		--set="scanner.image.repository=docker.io/$(IMG_NS)/$(scanner-prefix)-$(scanner)" \
		--set="scanner.image.tag=$(IMG_TAG)" \
		--set="kubeauditScope=cluster"

.PHONY: deploy-test-deps
deploy-test-deps:
	# If not exists create namespace where the tests will be executed
	kubectl create namespace kubeaudit-tests --dry-run=client -o yaml | kubectl apply -f -
	# Install jshop in kubeaudit-tests namespace
	helm -n kubeaudit-tests upgrade --install juice-shop ../../demo-targets/juice-shop/ --wait
