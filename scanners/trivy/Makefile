#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
scanner = trivy

# Add additional dependencies to the targets for the CycloneDX parser
docker-build: | docker-build-parser-sbom
docker-export: | docker-export-parser-sbom
kind-import: | kind-import-parser-sbom

include ../../scanners.mk

# Cannot use common-docker-build because the Dockerfile is supposed to be in the $(module) directory and the resulting image is supposed to
# be named $(module)-$(name), but this image is in directory parser-cyclonedx and supposed to be named parser-cyclonedx
.PHONY: docker-build-parser-sbom
docker-build-parser-sbom:
	@echo ".: ⚙️ Build 'cyclonedx' $(parser-prefix) with BASE_IMG_TAG: '$(BASE_IMG_TAG)'."
	docker build \
		--build-arg=scannerVersion=$(shell yq -e .appVersion ./Chart.yaml) \
		--build-arg=baseImageTag=$(BASE_IMG_TAG) \
		--build-arg=namespace=$(IMG_NS) \
		-t $(IMG_NS)/$(parser-prefix)-cyclonedx:$(IMG_TAG) \
		-f ./$(parser-prefix)-cyclonedx/Dockerfile \
		./$(parser-prefix)-cyclonedx

# These targets creatively reuse the common-... make targets a bit by resetting the name, otherwise the repository of the image will end in -trivy
.PHONY: docker-export-parser-sbom
docker-export-parser-sbom:
	@$(MAKE) -s common-docker-export module=$(parser-prefix) name=cyclonedx

.PHONY: kind-import-parser-sbom
kind-import-parser-sbom:
	@$(MAKE) -s common-kind-import module=$(parser-prefix) name=cyclonedx

# Deploy needs to be defined again to set the image repository and tag for the cyclonedx parser as well
# This either overrides the original target or runs helm upgrade again, but it will work in either case
.PHONY: deploy-without-scanner
deploy-without-scanner:
	@echo ".: 💾 Deploying '$(name)' $(scanner-prefix) HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(name) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(name)" \
		--set="parser.image.tag=$(IMG_TAG)" \
		--set="cyclonedxParser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-cyclonedx" \
		--set="cyclonedxParser.image.tag=$(IMG_TAG)" \
		--set="parser.env[0].name=CRASH_ON_FAILED_VALIDATION" \
		--set-string="parser.env[0].value=true"
