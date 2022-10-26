#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
scanner = nuclei

include ../../scanners.mk

.PHONY: deploy-without-scanner
deploy-without-scanner:
	@echo ".: 💾 Deploying '$(name)' $(scanner-prefix) HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install $(name) ./ --wait \
		--set="parser.image.repository=docker.io/$(IMG_NS)/$(parser-prefix)-$(name)" \
		--set="parser.image.tag=$(IMG_TAG)" \
    	--set="parser.env[0].name=CRASH_ON_FAILED_VALIDATION" \
    	--set-string="parser.env[0].value=true" \
		--set="nucleiTemplateCache.enabled=false"

.PHONY: deploy-test-deps
deploy-test-deps: deploy-test-dep-bodgeit
