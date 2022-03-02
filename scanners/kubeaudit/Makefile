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

deploy-with-scanner:
	@echo ".: 💾 Deploying custom '$(scanner)' scanner HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(scanner) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(scanner)" \
		--set="parser.image.tag=$(IMG_TAG)" \
		--set="scanner.image.repository=docker.io/$(IMG_NS)/$(scanner-prefix)-$(scanner)" \
		--set="scanner.image.tag=$(IMG_TAG)" \
		--set="kubeauditScope=cluster"

deploy-test-deps:
	# If not exists create namespace where the tests will be executed
	kubectl create namespace kubeaudit-tests --dry-run=client -o yaml | kubectl apply -f -
	# Install jshop in kubeaudit-tests namespace
	helm -n kubeaudit-tests upgrade --install juice-shop ../../demo-targets/juice-shop/ --wait

integration-tests:
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	kubectl -n integration-tests delete scans --all
	cd ../../tests/integration/ && npm ci
	cd ../../scanners/${scanner}
	npx --yes --package jest@$(JEST_VERSION) jest --verbose --ci --colors --coverage --passWithNoTests ${scanner}/integration-tests
