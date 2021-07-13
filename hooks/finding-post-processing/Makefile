#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0
#
#
# This Makefile is intended to be used for developement and testing only.
# For using this hook/hook in production please use the helm chart.
# See: <https://docs.securecodebox.io/docs/getting-started/installation>
#
# This Makefile expects some additional software to be installed:
# - git
# - node + npm
# - docker
# - kind
# - kubectl
# - helm

# Thx to https://stackoverflow.com/questions/5618615/check-if-a-program-exists-from-a-makefile
EXECUTABLES = make docker kind git node npm npx kubectl helm
K := $(foreach exec,$(EXECUTABLES),\
        $(if $(shell which $(exec)),some string,$(error "ERROR: The prerequisites are not met to execute this makefile! No '$(exec)' found in your PATH")))


# Variables you might want to override:
#
# IMG_NS:				Defines the namespace under which the images are build.
#						For `securecodebox/hook-nmap` `securecodebox` is the namespace
#						Defaults to `securecodebox`
#
# BASE_IMG_TAG:			Defines the tag of the base image used to build this hook/hook
#
# IMG_TAG:				Tag used to tag the newly created image. Defaults to the shortend commit hash
#						prefixed with `sha-` e.g. `sha-ef8de4b7`
#
# JEST_VERSION  		Defines the jest version used for executing the tests. Defaults to latest
#
# Examples:
# 	make all IMG_TAG=main
# 	make deploy IMG_TAG=$(git rev-parse --short HEAD)
# 	make integration-tests
#

SHELL = /bin/sh

IMG_NS ?= securecodebox
GIT_TAG ?= $$(git rev-parse --short HEAD)
BASE_IMG_TAG ?= latest
IMG_TAG ?= "sha-$(GIT_TAG)"
JEST_VERSION ?= latest

hook = finding-post-processing
hook-prefix =


build: | install-deps docker-build

test: | unit-tests docker-export kind-import deploy-prerequisites deploy deploy-test-deps integration-tests

all: | clean install-deps unit-tests docker-build docker-export kind-import deploy-prerequisites deploy deploy-test-deps integration-tests

.PHONY: unit-tests install-deps docker-build docker-export kind-import deploy-prerequisites deploy deploy-test-deps integration-tests all build test

unit-tests:
	@echo ".: 🧪 Starting unit-tests for hook '$(hook)' with 'jest@$(JEST_VERSION)'."
	cd hook && npx --yes --package jest@$(JEST_VERSION) jest --ci --colors --coverage .

install-deps:
	@echo ".: ⚙️ Installing all hook specific dependencies."
	cd hook && npm ci

docker-build:
	@echo ".: ⚙️ Build With BASE_IMG_TAG: '$(BASE_IMG_TAG)'."
	docker build --build-arg=baseImageTag=$(BASE_IMG_TAG) --build-arg=namespace=$(IMG_NS) -t $(IMG_NS)/$(hook-prefix)$(hook):$(IMG_TAG) -f ./hook/Dockerfile ./hook

docker-export:
	@echo ".: ⚙️ Saving new docker image archive to '$(hook-prefix)$(hook).tar'."
	docker save $(IMG_NS)/$(hook-prefix)$(hook):$(IMG_TAG) -o $(hook-prefix)$(hook).tar

kind-import:
	@echo ".: 💾 Importing the image archive '$(hook-prefix)$(hook).tar' to local kind cluster."
	kind load image-archive ./$(hook-prefix)$(hook).tar

deploy:
	@echo ".: 💾 Deploying '$(hook)' hook HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(hook) ./ --wait \
		--values ./integration-tests/__testFiles__/values.yaml \
		--set="hook.image.repository=docker.io/$(IMG_NS)/$(hook-prefix)$(hook)" \
		--set="hook.image.tag=$(IMG_TAG)"

deploy-test-deps:
	@echo ".: 💾 Deploying test dependency HelmChart with the docker tag '$(BASE_IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install test-scan ../../scanners/test-scan/ --wait \
	  --set="scanner.image.tag=$(BASE_IMG_TAG)" \
	  --set="parser.image.tag=$(BASE_IMG_TAG)"

install-integration-test-deps:

integration-tests:
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	kubectl -n integration-tests delete scans --all
	cd ../../tests/integration && npm ci
	npm i -g jest
	npx jest --ci --config=./integration-tests/jest.config.json --colors --coverage ./integration-tests

clean:
	@echo ".: 🧹 Cleaning up all generated files."
	rm -f ./$(hook-prefix)$(hook).tar
	rm -rf ./hook/node_modules
	rm -rf ./hook/coverage
	rm -rf ./integration-tests/node_modules
	rm -rf ./integration-tests/coverage
