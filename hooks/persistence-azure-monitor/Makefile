#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
hook = persistence-azure-monitor

include ../../hooks.mk

.PHONY: unit-tests
unit-tests:
	@$(MAKE) -s unit-test-js
