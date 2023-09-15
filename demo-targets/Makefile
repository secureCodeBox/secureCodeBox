#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include ../prerequisites.mk

.PHONY: helm-unit-tests
helm-unit-tests:
	for dir in $(wildcard */); do \
		echo "Running helm unit tests for $$dir"; \
		helm unittest $$dir; \
	done
