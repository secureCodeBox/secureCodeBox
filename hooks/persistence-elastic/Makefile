#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
hook = persistence-elastic

include ../../hooks.mk

.PHONY: docker-build
docker-build: dashboard-importer-docker-build

.PHONY: docker-export
docker-export: dashboard-importer-docker-export

.PHONY: kind-import
kind-import: dashboard-importer-kind-import

.PHONY: dashboard-importer-docker-build
dashboard-importer-docker-build:
	@echo ".: ⚙️ Build '$(name)' dashboard-importer with BASE_IMG_TAG: '$(BASE_IMG_TAG)'."
	docker build \
		--build-arg=scannerVersion=$(shell yq e .appVersion ./Chart.yaml) \
		--build-arg=baseImageTag=$(BASE_IMG_TAG) \
		--build-arg=namespace=$(IMG_NS) \
		-t $(IMG_NS)/$(name)-dashboard-importer:$(IMG_TAG) \
		-f ./dashboard-importer/Dockerfile \
		./dashboard-importer

.PHONY: dashboard-importer-docker-export
dashboard-importer-docker-export:
	@echo ".: ⚙️ Saving new docker image archive to '$(name)-dashboard-importer.tar'."
	docker save $(IMG_NS)/$(name)-dashboard-importer:$(IMG_TAG) -o $(name)-dashboard-importer.tar

.PHONY: dashboard-importer-kind-import
dashboard-importer-kind-import:
	@echo ".: 💾 Importing the image archive '$(name)-dashboard-importer.tar' to local kind cluster."
	kind load image-archive ./$(name)-dashboard-importer.tar --name $(KIND_CLUSTER_NAME)

.PHONY: deploy
deploy: ## 💾 Deploy this module via HelmChart into namespace "integration-tests"
	@echo ".: 💾 Deploying '$(name)' $(hook-prefix) HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(name) . --debug --timeout 5m --wait  \
		--set="hook.image.repository=docker.io/$(IMG_NS)/$(hook-prefix)-$(name)" \
		--set="hook.image.tag=$(IMG_TAG)" \
		--set="dashboardImporter.image.tag=$(IMG_TAG)"
