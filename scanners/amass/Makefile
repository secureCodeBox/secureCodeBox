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
#								For `securecodebox/scanner-nmap` `securecodebox` is the namespace
#								Defaults to `securecodebox`
#
# BASE_IMG_TAG:	Defines the tag of the base image used to build this scanner/hook
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

scanner = amass
scanner-prefix = scanner
parser-prefix = parser


build: | install-deps build-images

test: | unit-tests images-export kind-import deploy deploy-test-deps integration-tests

all: | install-deps unit-tests build-images images-export kind-import deploy deploy-demo-apps integration-tests

.PHONY: unit-tests install-deps build-images images-export kind-import deploy deploy-demo-apps integration-tests all

unit-tests:
	cd parser && npx --yes --package jest@$(JEST_VERSION) jest

install-deps:

build-images:
	@echo Build With BASE_IMG_TAG: $(BASE_IMG_TAG)
	docker build --build-arg=baseImageTag=$(BASE_IMG_TAG) --build-arg=namespace=$(IMG_NS) -t $(IMG_NS)/$(parser-prefix)-$(scanner):$(IMG_TAG) -f ./parser/Dockerfile ./parser

images-export:
	docker save $(IMG_NS)/$(parser-prefix)-$(scanner):$(IMG_TAG) -o $(parser-prefix)-$(scanner).tar

kind-import:
	kind load image-archive ./$(parser-prefix)-$(scanner).tar

deploy:
	helm -n integration-tests upgrade --install $(scanner) ./ \
		--set="parserImage.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(scanner)" \
		--set="parserImage.tag=$(IMG_TAG)"

deploy-test-deps:

install-integration-test-deps:

integration-tests:
	kubectl -n integration-tests delete scans --all
	cd integration-tests && npx --yes --package jest@$(JEST_VERSION) jest

clean:
	rm ./$(parser-prefix)-$(scanner).tar

