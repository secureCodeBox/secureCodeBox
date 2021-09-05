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

name = ${scanner}

include ../../common.mk

module = $(scanner-prefix)

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

unit-tests:
	@$(MAKE) -s unit-test-js module=$(parser-prefix)

install-deps:
	@$(MAKE) -s install-deps-js module=$(parser-prefix)

docker-build-parser:
	@$(MAKE) -s common-docker-build module=$(parser-prefix)

docker-export-parser:
	@$(MAKE) -s common-docker-export module=$(parser-prefix)

kind-import-parser:
	@$(MAKE) -s common-kind-import module=$(parser-prefix)

docker-build-scanner:
	@$(MAKE) -s common-docker-build

docker-export-scanner:
	@$(MAKE) -s common-docker-export

kind-import-scanner:
	@$(MAKE) -s common-kind-import

deploy-without-scanner:
	@echo ".: 💾 Deploying '$(name)' $(scanner-prefix) HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(name) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(name)" \
		--set="parser.image.tag=$(IMG_TAG)"

deploy-with-scanner:
	@echo ".: 💾 Deploying '$(name)' $(scanner-prefix) HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(name) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(name)" \
		--set="parser.image.tag=$(IMG_TAG)" \
		--set="scanner.image.repository=docker.io/$(IMG_NS)/$(scanner-prefix)-$(name)" \
		--set="scanner.image.tag=$(IMG_TAG)"

integration-tests:
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	kubectl -n integration-tests delete scans --all
	cd ../../tests/integration/ && npm ci &&	npx --yes --package jest@$(JEST_VERSION) jest --verbose --ci --colors --coverage --passWithNoTests ${scanner-prefix}/${name}.test.js
