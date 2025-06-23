#!/usr/bin/make -f

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

include_guard = set                 # Always include this line (checked in the makefile framework)
scanner = semgrep

include ../../scanners.mk           # Ensures that all the default makefile targets are included

deploy-test-deps:
	@echo ".: 🩺 Deploying test dependencies for Semgrep in kind namespace 'integration-tests'."
	kubectl -n integration-tests create configmap semgrep-test-file --from-file=integration-tests/testfile.py
