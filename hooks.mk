#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0
#
#
# This Makefile is intended to be used for developement and testing only.
# For using this scanner/hook in production please use the helm chart.
# See: <https://docs.securecodebox.io/docs/getting-started/installation>
#
# This Makefile expects some additional software to be installed:
# - git
# - node + npm
# - docker
# - kind
# - kubectl
# - helm
# - yq

module = hook
prefix = hook
name = ${hook}

include ../../common.mk

docker-build: | common-docker-build
docker-export: | common-docker-export
kind-import: | common-kind-import

unit-tests:
	@$(MAKE) -s unit-test-js module=$(hook-prefix)
