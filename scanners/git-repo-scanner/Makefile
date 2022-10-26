#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
scanner = git-repo-scanner
custom_scanner = set

include ../../scanners.mk

.PHONY: unit-tests
unit-tests:
	@$(MAKE) -s unit-test-py

.PHONY: integration-tests
integration-tests:
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	@echo "Disabled due to performance."
	#kubectl -n integration-tests delete scans --all
	#cd ../../tests/integration/ && npm ci
	#cd ../../scanners/${scanner}
	#npx --yes --package jest@$(JEST_VERSION) jest --verbose --ci --colors --coverage --passWithNoTests ${scanner}/integration-tests
