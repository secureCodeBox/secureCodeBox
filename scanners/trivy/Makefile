#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
scanner = trivy

# Usually scanners are supposed to have exactly one parser, but Trivy can produce either vulnerability findings from
# normal scans or CycloneDX SBOMs. Using separate parsers for each of these formats is cleaner because technically the
# CycloneDX parser is not Trivy-specific. At the moment it is kept in the Trivy directory though so that the
# architecture does not have to get changed more than it needs to for an MVP. This Makefile is edited to allow building
# both parsers by using the targets as usual.

# Add additional dependencies to the targets for the CycloneDX parser so that it gets built as well
docker-build: | docker-build-parser-sbom
docker-export: | docker-export-parser-sbom
kind-import: | kind-import-parser-sbom
unit-tests: unit-tests-parser-sbom

include ../../scanners.mk

# Cannot use common-docker-build to build the CycloneDX parser because the Dockerfile is supposed to be in the $(module)
# directory and the resulting image is supposed to be named $(module)-$(name), but this image is in directory
# parser-cyclonedx and also supposed to be named parser-cyclonedx, without any mention of trivy.
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

# These targets creatively reuse the common-... make targets to export and import the CycloneDX parser image by
# resetting the name variable, otherwise the repository name of the image will end in -trivy
.PHONY: docker-export-parser-sbom
docker-export-parser-sbom:
	@$(MAKE) -s common-docker-export module=$(parser-prefix) name=cyclonedx

.PHONY: kind-import-parser-sbom
kind-import-parser-sbom:
	@$(MAKE) -s common-kind-import module=$(parser-prefix) name=cyclonedx

# Deploy needs to be defined again to set the image repository and tag for the cyclonedx parser as well. This either
# overrides the original target or runs helm upgrade again, but it will work in either case
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

# The unit tests for the cyclonedx-parser cannot reuse the unit-test-js target, because it requires install-deps-js,
# which then tries to run npm ci in ../../${module}-sdk/nodejs and module is set to "parser-cyclonedx", but
# install-deps-js still needs to be executed, in case this target runs before the normal parser tests
.PHONY: unit-tests-parser-sbom
unit-tests-parser-sbom:
	@$(MAKE) -s install-deps-js module=$(parser-prefix)
	@echo ".: 🧪 Starting unit-tests for '$(name)' parser-cyclonedx."
	npm run test:unit -- ${name}/parser-cyclonedx/
