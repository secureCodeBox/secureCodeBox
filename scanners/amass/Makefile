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
# 	make all BASE_IMG_TAG=latest
# 	make deploy IMG_TAG=$(git rev-parse --short HEAD)
# 	make integration-tests
#

SHELL = /bin/sh

IMG_NS ?= securecodebox
BASE_IMG_TAG ?= latest
IMG_TAG ?= sha-$$(git rev-parse --short HEAD)
JEST_VERSION ?= latest

scanner = amass
scanner-prefix = scanner
parser-prefix = parser


build: | install-deps build-images

test: | unit-tests images-export kind-import deploy-prerequisites deploy deploy-test-deps integration-tests

all: | clean install-deps unit-tests build-images images-export kind-import deploy-prerequisites deploy deploy-test-deps integration-tests

.PHONY: unit-tests install-deps build-images images-export kind-import deploy-prerequisites deploy deploy-test-deps integration-tests all build test

unit-tests:
	@echo ".: 🧪 Starting unit-tests for '$(scanner)' parser  with 'jest@$(JEST_VERSION)'."
	cd parser && npx --yes --package jest@$(JEST_VERSION) jest --ci --colors --coverage .

install-deps:

build-images:
	@echo ".: ⚙️ Build With BASE_IMG_TAG: '$(BASE_IMG_TAG)'."
	docker build --build-arg=baseImageTag=$(BASE_IMG_TAG) --build-arg=namespace=$(IMG_NS) -t $(IMG_NS)/$(parser-prefix)-$(scanner):$(IMG_TAG) -f ./parser/Dockerfile ./parser

images-export:
	@echo ".: ⚙️ Saving new docker image archive to '$(parser-prefix)-$(scanner).tar'."
	docker save $(IMG_NS)/$(parser-prefix)-$(scanner):$(IMG_TAG) -o $(parser-prefix)-$(scanner).tar

kind-import:
	@echo ".: 💾 Importing the image archive '$(parser-prefix)-$(scanner).tar' to local kind cluster."
	kind load image-archive ./$(parser-prefix)-$(scanner).tar

deploy-prerequisites:
	@echo ".: 💾 Deploying prerequisite HelmChart with the docker tag '$(BASE_IMG_TAG)' into kind."
	# If not exists create namespace where the tests will be executed
	kubectl create namespace integration-tests --dry-run=client -o yaml | kubectl apply -f -
	# If not exists create secureCodeBox operator namespace
	kubectl create namespace securecodebox-system --dry-run=client -o yaml | kubectl apply -f -
	helm -n securecodebox-system upgrade --install securecodebox-operator secureCodeBox/operator --wait \
		# --set="image.repository=docker.io/$(IMG_NS)/operator" \
		# --set="image.tag=$(BASE_IMG_TAG)" \
		# --set="lurcher.image.repository=docker.io/$(IMG_NS)/lurcher" \
		# --set="lurcher.image.tag=$(BASE_IMG_TAG)" \

deploy:
	@echo ".: 💾 Deploying '$(scanner)' scanner HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(scanner) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(scanner)" \
		--set="parser.image.tag=$(IMG_TAG)"

deploy-test-deps:

install-integration-test-deps:

integration-tests:
	@echo ".: 🩺 Starting integration test in kind namespace 'integration-tests'."
	kubectl -n integration-tests delete scans --all
	cd integration-tests && npx --yes --package jest@$(JEST_VERSION) jest --ci --colors --coverage .

clean:
	@echo ".: 🧹 Cleaning up all generated files."
	rm -f ./$(parser-prefix)-$(scanner).tar

check:
	make --version
	which make
