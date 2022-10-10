#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#
#
# This include is a base for all scanners make files.

name = ${scanner}

include ../../test-base.mk
include ../../env-paths.mk
# Telling the env-paths file where the root project dir is. This is done to allow the generation of the paths of the
# different project folders relative to where the makefile is being run from.  So BIN_DIR= $(PROJECT_DIR)/bin will be
# BIN_DIR=../../bin
PROJECT_DIR=../..

module = $(scanner-prefix)

# IMPORTANT: The body of conditionals MUST not be indented! Indentation result in
# errors on macOS/FreeBSD because the line wil be interpreted as command which must
# inside a recipe (target). (see https://github.com/secureCodeBox/secureCodeBox/issues/1353)
ifeq ($(custom_scanner),)
docker-build: | docker-build-parser
docker-export: | docker-export-parser
kind-import: | kind-import-parser
deploy: deploy-without-scanner
else
docker-build: | docker-build-parser docker-build-scanner
docker-export: | docker-export-parser docker-export-scanner
kind-import: | kind-import-parser kind-import-scanner
deploy: deploy-with-scanner
endif

.PHONY: unit-tests
unit-tests:
	@$(MAKE) -s unit-test-js module=$(parser-prefix)

.PHONY: install-deps
install-deps:
	@$(MAKE) -s install-deps-js module=$(parser-prefix)

.PHONY: docker-build-parser
docker-build-parser:
	@$(MAKE) -s common-docker-build module=$(parser-prefix)

.PHONY: docker-export-parser
docker-export-parser:
	@$(MAKE) -s common-docker-export module=$(parser-prefix)

.PHONY: kind-import-parser
kind-import-parser:
	@$(MAKE) -s common-kind-import module=$(parser-prefix)

.PHONY: docker-build-scanner
docker-build-scanner:
	@$(MAKE) -s common-docker-build

.PHONY: docker-export-scanner
docker-export-scanner:
	@$(MAKE) -s common-docker-export

.PHONY: kind-import-scanner
kind-import-scanner:
	@$(MAKE) -s common-kind-import

.PHONY: deploy-without-scanner
deploy-without-scanner:
	@echo ".: 💾 Deploying '$(name)' $(scanner-prefix) HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(name) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(name)" \
		--set="parser.image.tag=$(IMG_TAG)" \
		--set="parser.env[0].name=CRASH_ON_FAILED_VALIDATION" \
		--set-string="parser.env[0].value=true"

.PHONY: deploy-with-scanner
deploy-with-scanner:
	@echo ".: 💾 Deploying '$(name)' $(scanner-prefix) HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(name) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(name)" \
		--set="parser.image.tag=$(IMG_TAG)" \
		--set="parser.env[0].name=CRASH_ON_FAILED_VALIDATION" \
		--set-string="parser.env[0].value=true" \
		--set="scanner.image.repository=docker.io/$(IMG_NS)/$(scanner-prefix)-$(name)" \
		--set="scanner.image.tag=$(IMG_TAG)"

.PHONY: integration-tests
integration-tests:
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	kubectl -n integration-tests delete scans --all
	cd $(SCANNERS_DIR) && npm ci && cd $(scanner)/integration-tests && npm run test --yes --package jest@$(JEST_VERSION) $(scanner)/integration-tests
