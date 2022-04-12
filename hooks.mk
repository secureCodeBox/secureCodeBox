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
include ../../env-paths.mk
PROJECT_DIR = ../../ ## Telling the env-paths file where the root project dir is. This is done to allow to generate the relative

module = $(hook-prefix)

.PHONY: docker-build
docker-build: | common-docker-build

.PHONY: docker-export
docker-export: | common-docker-export

.PHONY: kind-import
kind-import: | common-kind-import

.PHONY: unit-tests
unit-tests:
	@$(MAKE) -s unit-test-js

.PHONY: deploy
deploy: ## 💾 Deploy this module via HelmChart into namespace "integration-tests"
	@echo ".: 💾 Deploying '$(name)' $(hook-prefix) HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(name) . --wait \
		--set="hook.image.repository=docker.io/$(IMG_NS)/$(hook-prefix)-$(name)" \
		--set="hook.image.tag=$(IMG_TAG)"

.PHONY: integration-tests
integration-tests: ## 🩺 Start integration test for this module in the namespace "integration-tests"
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	kubectl -n integration-tests delete scans --all
	cd $(hook-prefix) && npm ci && npm run test --package jest@$(JEST_VERSION)