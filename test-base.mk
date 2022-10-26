#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#
#
# This include is a base test setup used for hooks, scanners, and SDKs.
#

# include must be two levels up because this file is included effectivity two levels deeper in the modules hierarchy.
include ../../prerequisites.mk

# IMPORTANT: The body of conditionals MUST not be indented! Indentation result in
# errors on macOS/FreeBSD because the line wil be interpreted as command which must
# inside a recipe (target). (see https://github.com/secureCodeBox/secureCodeBox/issues/1353)
ifeq ($(include_guard),)
$(error you should never run this makefile directly!)
endif

# IMPORTANT: The body of conditionals MUST not be indented! Indentation result in
# errors on macOS/FreeBSD because the line wil be interpreted as command which must
# inside a recipe (target). (see https://github.com/secureCodeBox/secureCodeBox/issues/1353)
ifeq ($(name),)
$(error name ENV is not set)
endif

# Variables you might want to override:
#
# IMG_NS:					Defines the namespace under which the images are build.
#									For `securecodebox/scanner-nmap` `securecodebox` is the namespace
#									Defaults to `securecodebox`
#
# BASE_IMG_TAG:		Defines the tag of the base image used to build this scanner/hook
#
# IMG_TAG:	Tag used to tag the newly created image. Defaults to the shortened commit hash
#						prefixed with `sha-` e.g. `sha-ef8de4b7`
#
# JEST_VERSION:		Defines the jest version used for executing the tests. Defaults to latest
#
# KIND_CLUSTER_NAME:	Defines the name of the kind cluster (created by kind create cluster --name cluster-name)
#
# Examples:
#		make all IMG_TAG=main
#		make deploy IMG_TAG=$(git rev-parse --short HEAD)
#		make kind-import KIND_CLUSTER_NAME=your-cluster-name
#		make integration-tests
#

SHELL = /bin/sh

IMG_NS ?= securecodebox
GIT_TAG ?= $$(git rev-parse --short HEAD)
BASE_IMG_TAG ?= sha-$(GIT_TAG)
IMG_TAG ?= "sha-$(GIT_TAG)"
JEST_VERSION ?= 27.0.6
KIND_CLUSTER_NAME ?= kind

parser-prefix = parser
scanner-prefix = scanner
hook-prefix = hook

all: help

.PHONY: test
test: | reset-integration-tests-namespace reset-demo-targets-namespace clean-operator clean-parser-sdk clean-hook-sdk unit-tests docker-build docker-export kind-import deploy deploy-test-deps integration-tests ## 🧪 Complete clean Test for this module.

.PHONY: install-deps-js
install-deps-js:
	@echo ".: ⚙️ Installing all $(module) specific javascript dependencies."
	cd .. && npm ci
	cd ../.. && npm ci
	cd ../../${module}-sdk/nodejs && npm ci
	cd ${module}/ && npm ci

.PHONY: unit-test-js
unit-test-js: install-deps-js
	@echo ".: 🧪 Starting unit-tests for '$(name)' $(module) with 'jest@$(JEST_VERSION)'."
	npx --yes --package jest@$(JEST_VERSION) jest --ci --colors --coverage --passWithNoTests ${name}/${module}/ --testPathIgnorePatterns /integration-tests/

.PHONY: install-deps-py
install-deps-py:
	@echo ".: ⚙️ Installing all $(module) specific python dependencies."
	$(PYTHON) -m pip install --upgrade pip setuptools wheel pytest
	cd $(module)/ && $(PYTHON) -m pip install -r requirements.txt

.PHONY: unit-test-py
unit-test-py: install-deps-py
	cd $(module)/ && $(PYTHON) -m pytest --ignore-glob='*_local.py' --ignore=tests/docker

.PHONY: unit-test-java
unit-test-java:
	cd $(module)/ && ./gradlew test

.PHONY: common-docker-build
common-docker-build:
	@echo ".: ⚙️ Build '$(name)' $(module) with BASE_IMG_TAG: '$(BASE_IMG_TAG)'."
	docker build \
		--build-arg=scannerVersion=$(shell yq -e .appVersion ./Chart.yaml) \
		--build-arg=baseImageTag=$(BASE_IMG_TAG) \
		--build-arg=namespace=$(IMG_NS) \
		-t $(IMG_NS)/$(module)-$(name):$(IMG_TAG) \
		-f ./$(module)/Dockerfile \
		./$(module)

.PHONY: common-docker-export
common-docker-export:
	@echo ".: ⚙️ Saving new docker image archive to '$(module)-$(name).tar'."
	docker save $(IMG_NS)/$(module)-$(name):$(IMG_TAG) -o $(module)-$(name).tar

.PHONY: common-kind-import
common-kind-import:
	@echo ".: 💾 Importing the image archive '$(module)-$(name).tar' to local kind cluster."
	kind load image-archive ./$(module)-$(name).tar --name $(KIND_CLUSTER_NAME)

.PHONY: deploy-test-deps
deploy-test-deps: deploy-test-dep-namespace

.PHONY: deploy-test-dep-namespace
deploy-test-dep-namespace:
	# If not exists create namespace where the tests will be executed
	kubectl create namespace demo-targets --dry-run=client -o yaml | kubectl apply -f -

.PHONY: deploy-test-dep-dummy-ssh
deploy-test-dep-dummy-ssh:
	helm -n demo-targets upgrade --install dummy-ssh ../../demo-targets/dummy-ssh/ --set="fullnameOverride=dummy-ssh" --wait

.PHONY: deploy-test-dep-unsafe-https
deploy-test-dep-unsafe-https:
	helm -n demo-targets upgrade --install unsafe-https ../../demo-targets/unsafe-https/ --set="fullnameOverride=unsafe-https" --wait

.PHONY: deploy-test-dep-bodgeit
deploy-test-dep-bodgeit:
	helm -n demo-targets upgrade --install bodgeit ../../demo-targets/bodgeit/ --set="fullnameOverride=bodgeit" --wait

.PHONY: deploy-test-dep-petstore
deploy-test-dep-petstore:
	helm -n demo-targets upgrade --install petstore ../../demo-targets/swagger-petstore/ --set="fullnameOverride=petstore" --wait

.PHONY: deploy-test-dep-old-wordpress
deploy-test-dep-old-wordpress:
	helm -n demo-targets upgrade --install old-wordpress ../../demo-targets/old-wordpress/ --set="fullnameOverride=old-wordpress" --wait

.PHONY: deploy-test-dep-old-typo3
deploy-test-dep-old-typo3:
	helm -n demo-targets upgrade --install old-typo3 ../../demo-targets/old-typo3/ --set="fullnameOverride=old-typo3" --wait

.PHONY: deploy-test-dep-juiceshop
deploy-test-dep-juiceshop:
	helm -n demo-targets upgrade --install juiceshop ../../demo-targets/juice-shop/ --set="fullnameOverride=juiceshop" --wait

.PHONY: deploy-test-dep-vulnerable-log4j
deploy-test-dep-vulnerable-log4j:
	helm -n demo-targets upgrade --install vulnerable-log4j ../../demo-targets/vulnerable-log4j/ --set="fullnameOverride=vulnerable-log4j" --wait

.PHONY: deploy-test-dep-nginx
deploy-test-dep-nginx:
	# Delete leftover nginx's. Unfortunately can't create deployment only if not exists (like namespaces)
	kubectl delete deployment nginx --namespace demo-targets --ignore-not-found --wait
	kubectl delete svc nginx --namespace demo-targets --ignore-not-found --wait
	# Install plain nginx server
	kubectl create deployment --image nginx:alpine nginx --namespace demo-targets
	kubectl expose deployment nginx --port 80 --namespace demo-targets

.PHONY: deploy-test-dep-http-webhook
deploy-test-dep-http-webhook:
	helm -n integration-tests upgrade --install http-webhook ../../demo-targets/http-webhook/

.PHONY: deploy-test-dep-test-scan
deploy-test-dep-test-scan:
	cd ../../scanners/test-scan/ && $(MAKE) docker-build docker-export kind-import && \
	helm -n integration-tests upgrade --install test-scan . \
		--set="scanner.image.repository=docker.io/$(IMG_NS)/$(scanner-prefix)-test-scan" \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-test-scan" \
		--set="parser.image.tag=$(IMG_TAG)" \
		--set="scanner.image.tag=$(IMG_TAG)" \
		--set="parser.env[0].name=CRASH_ON_FAILED_VALIDATION" \
		--set-string="parser.env[0].value=true"

.PHONY: deploy-test-dep-old-joomla
deploy-test-dep-old-joomla:
	helm -n demo-targets install old-joomla ../../demo-targets/old-joomla/ --set="fullnameOverride=old-joomla" --wait

.PHONY: reset
reset:  ## 🧹 removing all generated files for this module.
	@echo ".: 🧹 removing all generated files."
	rm -f ./$(module)-$(name).tar
	rm -rf ./$(module)/node_modules
	rm -rf ./$(module)/coverage
	rm -rf ./integration-tests/node_modules
	rm -rf ./integration-tests/coverage
	rm -rf ../node_modules
	rm -rf ../coverage

.PHONY: reset-integration-tests-namespace
reset-integration-tests-namespace:
	@echo ".: 🧹 Resetting 'integration-tests' namespace"
	kubectl delete namespace integration-tests --wait || true
	kubectl create namespace integration-tests

.PHONY: reset-demo-targets-namespace
reset-demo-targets-namespace:
	@echo ".: 🧹 Resetting 'demo-targets' namespace"
	kubectl delete namespace demo-targets --wait || true
	kubectl create namespace demo-targets

.PHONY: clean-operator
clean-operator:
	make -C $(OPERATOR_DIR) docker-build
	make -C $(OPERATOR_DIR) docker-export
	make -C $(OPERATOR_DIR) kind-import
	rm $(OPERATOR_DIR)/operator.tar $(OPERATOR_DIR)/lurker.tar
	make -C $(OPERATOR_DIR) helm-deploy

.PHONY: clean-parser-sdk
clean-parser-sdk:
	make -C $(PARSER_SDK_DIR) docker-build-sdk

.PHONY: clean-hook-sdk
clean-hook-sdk:
	make -C $(HOOK_SDK_DIR) docker-build-sdk

.PHONY: help
help: ## 🔮 Display this help screen.
	@grep -h -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
