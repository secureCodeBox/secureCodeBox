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

