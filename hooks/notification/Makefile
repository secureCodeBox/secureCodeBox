#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
hook = notification

include ../../hooks.mk

.PHONY: deploy-test-deps
deploy-test-deps: deploy-test-dep-test-scan deploy-test-dep-http-webhook

.PHONY: deploy
deploy:
	@echo ".: 💾 Deploying '$(name)' $(hook-prefix) HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install notification-hook . \
		--values ../../tests/integration/hooks/__testFiles__/notification-values.yaml \
		--set="hook.image.repository=docker.io/$(IMG_NS)/$(hook-prefix)-$(name)" \
		--set="hook.image.tag=$(IMG_TAG)" \
		--set="hook.image.pullPolicy=IfNotPresent"
