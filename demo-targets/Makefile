#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include ../prerequisites.mk

.PHONY: helm-unit-tests
helm-unit-tests:
	set -e; \
	for directory in ./*; do \
		if [ -d "$$directory" ]; then \
				dir_name=$$(basename "$$directory"); \
						helm unittest "$$directory"; \
		fi; \
	done