#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include ../prerequisites.mk

.PHONY: helm-unit-tests
helm-unit-tests:
	@result=0; \
	for dir in $(wildcard */); do \
		echo "Running helm unit tests for $$dir"; \
		if ! helm unittest $$dir; then \
			result=1; \
		fi; \
	done; \
	exit $$result