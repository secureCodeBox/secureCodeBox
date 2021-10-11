#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
scanner = ncrack
custom_scanner = set

include ../../scanners.mk

deploy-test-deps: deploy-test-dep-dummy-ssh

integration-tests:
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	kubectl -n integration-tests delete scans --all
	cd ../../tests/integration/ && npm ci
	cd ../../scanners/${scanner}
	npx --yes --package jest@$(JEST_VERSION) jest --verbose --ci --colors --coverage --passWithNoTests ${scanner}/integration-tests
