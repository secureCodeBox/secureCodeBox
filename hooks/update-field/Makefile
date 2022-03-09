#!/usr/bin/make -f
#
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0
#

include_guard = set
hook = update-field

include ../../hooks.mk

deploy-test-deps: deploy-test-dep-test-scan

deploy:
	@echo ".: 💾 Deploying '$(name)' $(hook-prefix) HelmChart with the docker tag '$(IMG_TAG)' into kind namespace 'integration-tests'."
	helm -n integration-tests upgrade --install update-category . --wait \
		--set="hook.image.repository=docker.io/$(IMG_NS)/$(hook-prefix)-$(name)" \
		--set="hook.image.tag=$(IMG_TAG)" \
		--set="attribute.name=category" \
		--set="attribute.value=fancy-category"
	helm -n integration-tests upgrade --install update-severity . --wait \
		--set="hook.image.repository=docker.io/$(IMG_NS)/$(hook-prefix)-$(name)" \
		--set="hook.image.tag=$(IMG_TAG)" \
		--set="attribute.name=severity" \
		--set="attribute.value=high"