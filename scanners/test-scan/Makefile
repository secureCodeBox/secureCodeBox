#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
scanner = test-scan
custom_scanner = set

include ../../scanners.mk

deploy-with-scanner:
	@echo ".: 💾 Deploying '$(name)' '$(scanner-prefix)' HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install test-scan . \
		--set="scanner.image.repository=docker.io/$(IMG_NS)/$(scanner-prefix)-$(name)" \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(name)" \
		--set="parser.image.tag=$(IMG_TAG)" \
		--set="scanner.image.tag=$(IMG_TAG)" \
		--set="parser.env[0].name=CRASH_ON_FAILED_VALIDATION" \
		--set-string="parser.env[0].value=true"

integration-tests:
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	kubectl -n integration-tests delete scans --all
	cd $(PROJECT_DIR)/tests/integration/ && npm ci && npm run test:integration -- generic/findings-validation.test.js
