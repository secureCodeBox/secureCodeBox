#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include ../prerequisites.mk

.PHONY: integration-tests
integration-tests:
	for dir in $(wildcard */.); do \
		$(MAKE) integration-tests -C $$dir;\
	done
	
.PHONY: unit-tests 
unit-tests:
	for dir in $(wildcard */.); do \
		$(MAKE) unit-tests -C $$dir;\
	done