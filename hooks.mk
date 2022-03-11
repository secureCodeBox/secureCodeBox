#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
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

module = $(hook-prefix)

docker-build: | common-docker-build
docker-export: | common-docker-export
kind-import: | common-kind-import

unit-tests:
	@$(MAKE) -s unit-test-js

deploy:
	@echo ".: 💾 Deploying '$(name)' $(hook-prefix) HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(name) . --wait \
		--set="hook.image.repository=docker.io/$(IMG_NS)/$(hook-prefix)-$(name)" \
		--set="hook.image.tag=$(IMG_TAG)"

integration-tests:
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	kubectl -n integration-tests delete scans --all
	cd $(hook-prefix) && npm ci && npm run test --package jest@$(JEST_VERSION)