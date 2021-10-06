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


name = ${sdk}
module = ${sdk}
include ../../common.mk

docker-build-sdk:
	@echo ".: ⚙️ Build '$(name)'."
	docker build -t $(IMG_NS)/$(name)-nodejs:$(IMG_TAG) .

docker-export-sdk:
	@echo ".: ⚙️ Build '$(name)'."
	docker save $(IMG_NS)/$(name)-nodejs:$(IMG_TAG) -o $(name).tar
