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

ifeq ($(include_guard),)
  $(error you should never run this makefile directly!)
endif
ifeq ($(name),)
  $(error name ENV is not set)
endif

PYTHON = $(shell which python3)
ifeq ($(PYTHON),)
  PYTHON = $(shell which python)
  ifeq ($(PYTHON),)
  	$(error "PYTHON=$(PYTHON) not found in $(PATH)")
  endif
endif
PYTHON_VERSION_MIN=3.0
PYTHON_VERSION=$(shell $(PYTHON) -c \
'import sys; print(float(str(sys.version_info[0]) + "." + str(sys.version_info[1])))')
PYTHON_VERSION_OK=$(shell $(PYTHON) -c 'print(int($(PYTHON_VERSION) >= $(PYTHON_VERSION_MIN)))' )
ifeq ($(PYTHON_VERSION_OK), 0) # True == 1
   $(error "Need python version >= $(PYTHON_VERSION_MIN) (current: $(PYTHON_VERSION))")
endif

# Thx to https://stackoverflow.com/questions/5618615/check-if-a-program-exists-from-a-makefile
EXECUTABLES = make docker kind git node npm npx kubectl helm yq java $(PYTHON)
ALL_EXECUTABLES_OK := $(foreach exec,$(EXECUTABLES),\
        $(if $(shell which $(exec)),some string,$(error "ERROR: The prerequisites are not met to execute this makefile! No '$(exec)' found in your PATH")))

# Variables you might want to override:
#
# IMG_NS:				Defines the namespace under which the images are build.
#						For `securecodebox/scanner-nmap` `securecodebox` is the namespace
#						Defaults to `securecodebox`
#
# BASE_IMG_TAG:			Defines the tag of the base image used to build this scanner/hook
#
# IMG_TAG:				Tag used to tag the newly created image. Defaults to the shortend commit hash
#						prefixed with `sha-` e.g. `sha-ef8de4b7`
#
# JEST_VERSION  		Defines the jest version used for executing the tests. Defaults to latest
#
# KIND_CLUSTER_NAME:	Defines the name of the kind cluster (created by kind create cluster --name cluster-name)
#
# Examples:
# 	make all IMG_TAG=main
# 	make deploy IMG_TAG=$(git rev-parse --short HEAD)
#   make kind-import KIND_CLUSTER_NAME=your-cluster-name
# 	make integration-tests
#

SHELL = /bin/sh

IMG_NS ?= securecodebox
GIT_TAG ?= $$(git rev-parse --short HEAD)
BASE_IMG_TAG ?= sha-$(GIT_TAG)
IMG_TAG ?= "sha-$(GIT_TAG)"
JEST_VERSION ?= latest
KIND_CLUSTER_NAME ?= kind

parser-prefix = parser
scanner-prefix = scanner
hook-prefix = hook

all: help

test: | clean-integration-tests clean-demo-targets unit-tests docker-build docker-export kind-import deploy deploy-test-deps integration-tests ## 🧪 Complete clean Test for this module.

.PHONY: help unit-tests-hook install-deps docker-build docker-export kind-import deploy deploy-test-deps integration-tests all build test

install-deps-js:
	@echo ".: ⚙️ Installing all $(module) specific javascript dependencies."
	cd ./.. && npm ci
	cd ./../.. && npm ci
	cd ../../${module}-sdk/nodejs && npm ci
	cd ./${module}/ && npm ci

unit-test-js: install-deps-js
	@echo ".: 🧪 Starting unit-tests for '$(name)' $(module) with 'jest@$(JEST_VERSION)'."
	npx --yes --package jest@$(JEST_VERSION) jest --ci --colors --coverage --passWithNoTests ${name}/${module}/

install-deps-py:
	@echo ".: ⚙️ Installing all $(module) specific python dependencies."
	$(PYTHON) -m pip install --upgrade pip setuptools wheel pytest
	cd ./$(module)/ && $(PYTHON) -m pip install -r requirements.txt

unit-test-py: install-deps-py
	cd ./$(module)/ && $(PYTHON) -m pytest --ignore-glob='*_local.py' --ignore=tests/docker

unit-test-java:
	cd ./$(module)/ && ./gradlew test

common-docker-build:
	@echo ".: ⚙️ Build '$(name)' $(module) with BASE_IMG_TAG: '$(BASE_IMG_TAG)'."
	docker build \
		--build-arg=scannerVersion=$(shell yq e .appVersion ./Chart.yaml) \
		--build-arg=baseImageTag=$(BASE_IMG_TAG) \
		--build-arg=namespace=$(IMG_NS) \
		-t $(IMG_NS)/$(module)-$(name):$(IMG_TAG) \
		-f ./$(module)/Dockerfile \
		./$(module)

common-docker-export:
	@echo ".: ⚙️ Saving new docker image archive to '$(module)-$(name).tar'."
	docker save $(IMG_NS)/$(module)-$(name):$(IMG_TAG) -o $(module)-$(name).tar

common-kind-import:
	@echo ".: 💾 Importing the image archive '$(module)-$(name).tar' to local kind cluster."
	kind load image-archive ./$(module)-$(name).tar --name $(KIND_CLUSTER_NAME)

deploy-test-deps: deploy-test-dep-namespace

deploy-test-dep-namespace:
	# If not exists create namespace where the tests will be executed
	kubectl create namespace demo-targets --dry-run=client -o yaml | kubectl apply -f -

deploy-test-dep-dummy-ssh:
	# Install dummy-ssh app
	helm -n demo-targets upgrade --install dummy-ssh ../../demo-targets/dummy-ssh/ --set="fullnameOverride=dummy-ssh" --wait

deploy-test-dep-unsafe-https:
	# Install unsafe-https app
	helm -n demo-targets upgrade --install unsafe-https ../../demo-targets/unsafe-https/ --set="fullnameOverride=unsafe-https" --wait

deploy-test-dep-bodgeit:
	# Install bodgeit app
	helm -n demo-targets upgrade --install bodgeit ../../demo-targets/bodgeit/ --set="fullnameOverride=bodgeit" --wait

deploy-test-dep-petstore:
	# Install bodgeit app
	helm -n demo-targets upgrade --install petstore ../../demo-targets/swagger-petstore/ --set="fullnameOverride=petstore" --wait

deploy-test-dep-old-wordpress:
	# Install old-wordpress app
	helm -n demo-targets upgrade --install old-wordpress ../../demo-targets/old-wordpress/ --set="fullnameOverride=old-wordpress" --wait

deploy-test-dep-old-typo3:
	# Install old-typo3 app
	helm -n demo-targets upgrade --install old-typo3 ../../demo-targets/old-typo3/ --set="fullnameOverride=old-typo3" --wait

deploy-test-dep-juiceshop:
	# Install juiceshop app
	helm -n demo-targets upgrade --install juiceshop ../../demo-targets/juice-shop/ --set="fullnameOverride=juiceshop" --wait

deploy-test-dep-vulnerable-log4j:
	# Install vulnerable-log4j app
	helm -n demo-targets upgrade --install vulnerable-log4j ../../demo-targets/vulnerable-log4j/ --set="fullnameOverride=vulnerable-log4j" --wait

deploy-test-dep-nginx:
	# Delete leftover nginx's. Unfortunately can't create deployment only if not exists (like namespaces)
	kubectl delete deployment nginx --namespace demo-targets --ignore-not-found --wait
	kubectl delete svc nginx --namespace demo-targets --ignore-not-found --wait
	# Install plain nginx server
	kubectl create deployment --image nginx:alpine nginx --namespace demo-targets
	kubectl expose deployment nginx --port 80 --namespace demo-targets

deploy-test-dep-http-webhook:
	helm -n integration-tests upgrade --install http-webhook ../../demo-targets/http-webhook/

deploy-test-dep-test-scan:
	cd ../../scanners/test-scan/ && $(MAKE) docker-build docker-export kind-import && \
	helm -n integration-tests upgrade --install test-scan . \
		--set="scanner.image.repository=docker.io/$(IMG_NS)/$(scanner-prefix)-test-scan" \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-test-scan" \
		--set="parser.image.tag=$(IMG_TAG)" \
		--set="scanner.image.tag=$(IMG_TAG)" \
		--set="parser.env[0].name=CRASH_ON_FAILED_VALIDATION" \
		--set-string="parser.env[0].value=true"

deploy-test-dep-old-joomla:
	helm -n demo-targets install old-joomla ../../demo-targets/old-joomla/ --set="fullnameOverride=old-joomla" --wait

clean:  ## 🧹 Cleaning up all generated files for this module.
	@echo ".: 🧹 Cleaning up all generated files."
	rm -f ./$(module)-$(name).tar
	rm -rf ./$(module)/node_modules
	rm -rf ./$(module)/coverage
	rm -rf ./integration-tests/node_modules
	rm -rf ./integration-tests/coverage
	rm -rf ../node_modules
	rm -rf ../coverage

clean-integration-tests:
	@echo ".: 🧹 Resetting 'integration-tests' namespace"
	kubectl delete namespace integration-tests --wait || true
	kubectl create namespace integration-tests

clean-demo-targets:
	@echo ".: 🧹 Resetting 'demo-targets' namespace"
	kubectl delete namespace demo-targets --wait || true
	kubectl create namespace demo-targets

.PHONY: help
help: ## 🔮 Display this help screen.
	@grep -h -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
