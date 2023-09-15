#!/usr/bin/make -f

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

include_guard = set                 # Always include this line (checked in the makefile framework)
scanner = semgrep

include ../../scanners.mk           # Ensures that all the default makefile targets are included

.PHONY: integration-tests
integration-tests: 
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	kubectl -n integration-tests delete scans --all
	cd $(PROJECT_DIR)/tests/integration/ && npm ci
	cd $(SCANNERS_DIR)/${scanner}
	kubectl -n integration-tests create configmap semgrep-test-file --from-file=integration-tests/testfile.py
	npm run test:integration -- ${scanner}/integration-tests
	kubectl -n integration-tests delete configmap semgrep-test-file
