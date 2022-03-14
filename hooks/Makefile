#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

integration-tests:
	for dir in $(wildcard */.); do \
	$(MAKE) integration-tests -C $$dir;\
	done