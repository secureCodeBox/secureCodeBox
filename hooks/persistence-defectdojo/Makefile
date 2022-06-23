#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
hook = persistence-defectdojo

include ../../hooks.mk

.PHONY: unit-tests
unit-tests:
	@$(MAKE) -s unit-test-java

.PHONY: integration-tests
integration-tests: ## 🩺 Start integration test for this module in the namespace "integration-tests"
	@echo "No integration tests for $(hook) defined!"