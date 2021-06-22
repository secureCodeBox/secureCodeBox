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


# Variables you might want to override:
#
# IMG_NS:				Defines the namespace under which the images are build.
#								For `securecodebox/hook-nmap` `securecodebox` is the namespace
#								Defaults to `securecodebox`
#
# BASE_IMG_TAG:	Defines the tag of the base image used to build this hook/hook
#
# IMG_TAG:			Tag used to tag the newly created image. Defaults to the shortend commit hash
#								prefixed with `sha-` e.g. `sha-ef8de4b7`
#
#	JEST_VERSION  Defines the jest version used for executing the tests. Defaults to latest

SHELL = /bin/sh

IMG_NS ?= securecodebox
BASE_IMG_TAG ?= latest
IMG_TAG ?= sha-$$(git rev-parse --short HEAD)
JEST_VERSION ?= latest

hook = finding-post-processing
hook-prefix =


build: | install-deps build-images

test: | unit-tests images-export kind-import deploy deploy-test-deps integration-tests

all: | install-deps unit-tests build-images images-export kind-import deploy deploy-test-deps integration-tests

.PHONY: unit-tests install-deps build-images images-export kind-import deploy deploy-test-deps integration-tests all build test

unit-tests:
	cd hook && npx --yes --package jest@$(JEST_VERSION) jest

install-deps:
	cd hook && npm ci

build-images:
	@echo Build With BASE_IMG_TAG: $(BASE_IMG_TAG)
	docker build --build-arg=baseImageTag=$(BASE_IMG_TAG) --build-arg=namespace=$(IMG_NS) -t $(IMG_NS)/$(hook-prefix)$(hook):$(IMG_TAG) -f ./hook/Dockerfile ./hook

images-export:
	docker save $(IMG_NS)/$(hook-prefix)$(hook):$(IMG_TAG) -o $(hook-prefix)$(hook).tar

kind-import:
	kind load image-archive ./$(hook-prefix)$(hook).tar

deploy:
	helm -n integration-tests upgrade --install $(hook) ./ \
		--values ./integration-tests/__testFiles__/values.yaml \
		--set="image.repository=docker.io/$(IMG_NS)/$(hook-prefix)$(hook)" \
		--set="image.tag=$(IMG_TAG)"

deploy-test-deps:
	helm -n integration-tests upgrade --install test-scan ../../scanners/test-scan/ \
	  --set="image.tag=$(BASE_IMG_TAG)" \
	  --set="parserImage.tag=$(BASE_IMG_TAG)"

install-integration-test-deps:

integration-tests:
	kubectl -n integration-tests delete scans --all
	cd integration-tests && npx --yes --package jest@$(JEST_VERSION) jest

clean:
	rm ./$(hook-prefix)$(hook).tar

