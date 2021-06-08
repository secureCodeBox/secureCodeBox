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

SHELL = /bin/sh

IMG_NS ?= securecodebox
BASE_IMG_TAG ?= latest
IMG_TAG ?= sha-$$(git rev-parse --short HEAD)

scanner = amass
scanner-prefix = scanner
parser-prefix = parser

all: | install-deps unit-test build-images images-export kind-import deploy deploy-demo-apps integration-test

.PHONY: unit-test
unit-test:
	npm test -- $(scanner)

.PHONY: install-deps
install-deps:
	npm ci

.PHONY: build-images
build-images:
	docker build -t $(IMG_NS)/$(parser-prefix)-$(scanner):$(IMG_TAG) -f ./parser/Dockerfile ./parser

.PHONY: images-images
images-export:
	docker save $(IMG_NS)/$(parser-prefix)-$(scanner):$(IMG_TAG) -o $(parser-prefix)-$(scanner).tar

.PHONY: kind-import
kind-import:
	kind load image-archive ./$(parser-prefix)-$(scanner).tar

.PHONY: deploy
deploy:
	helm -n integration-tests upgrade --install $(scanner) ./ \
		--set="parserImage.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(scanner)" \
		--set="parserImage.tag=$(IMG_TAG)"

.PHONY: deploy-demo-apps
deploy-demo-apps:

.PHONY: integration-test
integration-test:
	npx jest ../../tests/integration/scanner/$(scanner).test.js

.PHONY: clean
clean:
	rm ./$(parser-prefix)-$(scanner).tar
