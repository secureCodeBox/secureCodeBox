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

.PHONY: helm-unit-tests
helm-unit-tests:
	@result=0; \
	for dir in $(wildcard */); do \
		if [[ $$dir != "coverage/" && $$dir != "node_modules/" ]]; then \
			echo "Running helm unit tests for $$dir"; \
			if ! helm unittest $$dir; then \
				result=1; \
			fi; \
		fi; \
	done; \
	exit $$result
