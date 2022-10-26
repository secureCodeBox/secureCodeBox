#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
hook = finding-post-processing

include ../../hooks.mk

deploy-test-deps: deploy-test-dep-test-scan

.PHONY:  deploy
deploy:
	@echo ".: 💾 Deploying '$(name)' $(hook-prefix) HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install finding-post-processing . \
		--set="hook.image.repository=docker.io/$(IMG_NS)/$(hook-prefix)-$(name)" \
		--set="hook.image.tag=$(IMG_TAG)" \
		--set="hook.image.pullPolicy=IfNotPresent" \
		--set="rules[0].matches.anyOf[0].category=Host" \
		--set="rules[0].override.severity=high"
