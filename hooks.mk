#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#
#
# This include is a base for all hooks make files.

module = hook
prefix = hook
name = ${hook}

include ../../test-base.mk
include ../../env-paths.mk
# Telling the env-paths file where the root project dir is. This is done to allow the generation of the paths of the
# different project folders relative to where the makefile is being run from.  So BIN_DIR= $(PROJECT_DIR)/bin will be
# BIN_DIR=../../bin
PROJECT_DIR=../..

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
	npm ci --prefix $(TESTS_HELPERS_DIR)
	cd $(hook-prefix) && npm ci && npm run test --package jest@$(JEST_VERSION)
