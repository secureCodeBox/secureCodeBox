#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
# common.mk fails if name is not set, so we use a placeholder w/o any further meaning.
name = _scanners_
include ../common.mk

.PHONY: integration-tests 
integration-tests:
	for dir in $(wildcard */.); do \
		$(MAKE) integration-tests -C $$dir;\
	done
