#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

.PHONY: integration-tests
integration-tests:
	for dir in $(wildcard */.); do \
	$(MAKE) integration-tests -C $$dir;\
	done