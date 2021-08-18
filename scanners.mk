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

ifeq ($(include_guard),)
  $(error you should never run this makefile directly!)
endif
ifeq ($(scanner),)
  $(error scanner ENV is not set)
endif

# Thx to https://stackoverflow.com/questions/5618615/check-if-a-program-exists-from-a-makefile
EXECUTABLES = make docker kind git node npm npx kubectl helm yq
K := $(foreach exec,$(EXECUTABLES),\
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

scanner-prefix = scanner
parser-prefix = parser

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


test: | unit-tests-parser docker-build docker-export kind-import deploy integration-tests

all: | clean install-deps unit-tests-parser docker-build docker-export kind-import deploy integration-tests

.PHONY: unit-tests-parser install-deps docker-build docker-export kind-import deploy integration-tests all build test

unit-tests-parser:
	@echo ".: 🧪 Starting unit-tests for '$(scanner)' parser  with 'jest@$(JEST_VERSION)'."
	npx --yes --package jest@$(JEST_VERSION) jest --ci --colors --coverage ${scanner}/parser/

install-deps:
	@echo ".: ⚙️ Installing all scanner specific dependencies."
	cd ./.. && npm ci
	cd ../../parser-sdk/nodejs && npm ci
	cd ./parser/ && npm ci

docker-build-parser:
	@echo ".: ⚙️ Build parser with BASE_IMG_TAG: '$(BASE_IMG_TAG)'."
	docker build --build-arg=baseImageTag=$(BASE_IMG_TAG) --build-arg=namespace=$(IMG_NS) -t $(IMG_NS)/$(parser-prefix)-$(scanner):$(IMG_TAG) -f ./parser/Dockerfile ./parser

docker-export-parser:
	@echo ".: ⚙️ Saving new docker image archive to '$(parser-prefix)-$(scanner).tar'."
	docker save $(IMG_NS)/$(parser-prefix)-$(scanner):$(IMG_TAG) -o $(parser-prefix)-$(scanner).tar

kind-import-parser:
	@echo ".: 💾 Importing the image archive '$(parser-prefix)-$(scanner).tar' to local kind cluster."
	kind load image-archive ./$(parser-prefix)-$(scanner).tar

docker-build-scanner:
	@echo ".: ⚙️ Build custom scanner with BASE_IMG_TAG: '$(BASE_IMG_TAG)'."
	docker build --build-arg=scannerVersion=$(shell yq e .appVersion ./Chart.yaml) --build-arg=namespace=$(IMG_NS) -t $(IMG_NS)/$(scanner-prefix)-$(scanner):$(IMG_TAG) -f ./scanner/Dockerfile ./scanner

docker-export-scanner:
	@echo ".: ⚙️ Saving new docker image archive to '$(scanner-prefix)-$(scanner).tar'."; \
	docker save $(IMG_NS)/$(scanner-prefix)-$(scanner):$(IMG_TAG) -o $(scanner-prefix)-$(scanner).tar; \

kind-import-scanner:
	@echo ".: 💾 Importing the image archive '$(scanner-prefix)-$(scanner).tar' to local kind cluster."
	kind load image-archive ./$(scanner-prefix)-$(scanner).tar

deploy-without-scanner:
	@echo ".: 💾 Deploying '$(scanner)' scanner HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(scanner) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(scanner)" \
		--set="parser.image.tag=$(IMG_TAG)"

deploy-with-scanner:
	@echo ".: 💾 Deploying '$(scanner)' scanner HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(scanner) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(scanner)" \
		--set="parser.image.tag=$(IMG_TAG)" \
		--set="scanner.image.repository=docker.io/$(IMG_NS)/$(scanner-prefix)-$(scanner)" \
		--set="scanner.image.tag=$(IMG_TAG)"

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

deploy-test-dep-juiceshop:
	# Install juiceshop app
	helm -n demo-targets upgrade --install juiceshop ../../demo-targets/juice-shop/ --set="fullnameOverride=juiceshop" --wait

deploy-test-dep-nginx:
	# Delete leftover nginx's. Unfortunately can't create deployment only if not exists (like namespaces)
	kubectl delete deployment nginx --namespace demo-targets --ignore-not-found --wait
	kubectl delete svc nginx --namespace demo-targets --ignore-not-found --wait
	# Install plain nginx server
	kubectl create deployment --image nginx:alpine nginx --namespace demo-targets
	kubectl expose deployment nginx --port 80 --namespace demo-targets

install-integration-test-deps:

integration-tests: deploy-test-deps
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	kubectl -n integration-tests delete scans --all
	cd ../../tests/integration/ && npm ci
	npx --yes --package jest@$(JEST_VERSION) jest --verbose --ci --colors --coverage ${scanner}/integration-tests

clean:
	@echo ".: 🧹 Cleaning up all generated files."
	rm -f ./$(parser-prefix)-$(scanner).tar
	rm -rf ./parser/node_modules
	rm -rf ./parser/coverage
	rm -rf ./integration-tests/node_modules
	rm -rf ./integration-tests/coverage
	rm -rf ../node_modules
	rm -rf ../coverage
