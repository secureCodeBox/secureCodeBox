#!/usr/bin/make -f

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
	npx --yes --package jest@$(JEST_VERSION) jest --verbose --ci --colors --coverage --passWithNoTests ${scanner}/integration-tests
	kubectl -n integration-tests delete configmap semgrep-test-file
